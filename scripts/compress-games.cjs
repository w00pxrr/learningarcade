#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const GAMES_DIR = path.join(__dirname, '..', 'public', 'games');
const MIN_SIZE_KB = 100; // Only compress files larger than 100KB
const MIN_SIZE_BYTES = MIN_SIZE_KB * 1024;

async function compressFile(filePath) {
  try {
    const stats = await stat(filePath);
    
    // Skip small files
    if (stats.size < MIN_SIZE_BYTES) {
      return { skipped: true, reason: 'too small' };
    }
    
    // Skip if .gz file already exists and is newer
    const gzPath = `${filePath}.gz`;
    try {
      const gzStats = await stat(gzPath);
      if (gzStats.mtime >= stats.mtime) {
        return { skipped: true, reason: 'already compressed' };
      }
    } catch {
      // .gz file doesn't exist, continue
    }
    
    console.log(`Compressing: ${path.basename(filePath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const content = await readFile(filePath);
    const compressed = await gzip(content, { level: 9 }); // Maximum compression
    
    await writeFile(gzPath, compressed);
    
    const compressionRatio = ((1 - compressed.length / stats.size) * 100).toFixed(1);
    console.log(`  → ${(compressed.length / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% smaller)`);
    
    return { success: true, originalSize: stats.size, compressedSize: compressed.length };
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error.message);
    return { error: error.message };
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  let items = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subItems = await processDirectory(fullPath);
      items = items.concat(subItems);
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
      items.push(fullPath);
    }
  }
  
  return items;
}

async function main() {
  console.log('🎮 Game File Compression Tool\n');
  console.log(`Scanning: ${GAMES_DIR}\n`);
  
  try {
    const files = await processDirectory(GAMES_DIR);
    console.log(`Found ${files.length} HTML/JS files\n`);
    
    let totalOriginal = 0;
    let totalCompressed = 0;
    let compressedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      const result = await compressFile(file);
      
      if (result.success) {
        totalOriginal += result.originalSize;
        totalCompressed += result.compressedSize;
        compressedCount++;
      } else if (result.skipped) {
        skippedCount++;
      }
    }
    
    console.log('\n📊 Compression Summary:');
    console.log(`  Files processed: ${files.length}`);
    console.log(`  Files compressed: ${compressedCount}`);
    console.log(`  Files skipped: ${skippedCount}`);
    
    if (compressedCount > 0) {
      const totalSaved = totalOriginal - totalCompressed;
      const totalSavedMB = (totalSaved / 1024 / 1024).toFixed(2);
      const avgCompression = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
      
      console.log(`  Total space saved: ${totalSavedMB} MB`);
      console.log(`  Average compression: ${avgCompression}%`);
    }
    
    console.log('\n✅ Compression complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
