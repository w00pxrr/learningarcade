const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const GAMES_DIR = path.join(__dirname, '../public/games');

// File extensions to compress
const EXTENSIONS_TO_COMPRESS = ['.html', '.js', '.css'];

function compressFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS_TO_COMPRESS.includes(ext)) {
    return;
  }

  // Skip already compressed files
  if (filePath.endsWith('.gz') || filePath.endsWith('.br')) {
    return;
  }

  // Read the file
  const content = fs.readFileSync(filePath);
  
  // Compress with gzip
  const compressed = zlib.gzipSync(content);
  
  // Write the compressed file
  const gzipPath = filePath + '.gz';
  fs.writeFileSync(gzipPath, compressed);
  
  const originalSize = content.length;
  const compressedSize = compressed.length;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  
  console.log(`${path.basename(filePath)}: ${originalSize} -> ${compressedSize} bytes (${ratio}% reduction)`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      compressFile(filePath);
    }
  }
}

console.log('Starting compression of games directory...');
console.log('Target directory:', GAMES_DIR);
console.log('');

walkDir(GAMES_DIR);

console.log('');
console.log('Compression complete!');
