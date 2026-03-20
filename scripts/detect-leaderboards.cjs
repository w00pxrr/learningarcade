/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gamesPath = path.join(root, "src", "data", "games.json");
const outputPath = path.join(root, "src", "data", "leaderboardGames.json");
const publicGamesRoot = path.join(root, "public", "games");
const maxBytes = 8_000_000;
const keyword = /leaderboard/i;
const allowedExts = new Set([".html", ".js", ".json"]);

const games = JSON.parse(fs.readFileSync(gamesPath, "utf-8"));

const gameId = (name, id) => {
  if (id) return id;
  return name.toLowerCase().replace(/\s/g, "");
};

const readFileSafe = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size > maxBytes) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
};

const scanFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExts.has(ext)) return false;
  const content = readFileSafe(filePath);
  if (!content) return false;
  return keyword.test(content);
};

const scanDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return false;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (scanDir(fullPath)) return true;
      continue;
    }
    if (entry.isFile() && scanFile(fullPath)) return true;
  }
  return false;
};

const matches = [];

for (const entry of games) {
  if (entry.title) continue;
  if (!entry.name || !entry.href) continue;
  const id = gameId(entry.name, entry.id);
  const href = entry.href.replace(/^\\//, "");
  const fullPath = path.join(root, "public", href);
  let found = false;
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const parent = path.dirname(fullPath);
    if (path.resolve(parent) !== path.resolve(publicGamesRoot)) {
      found = scanDir(parent);
    } else {
      found = scanFile(fullPath);
    }
  } else {
    found = scanDir(fullPath);
  }
  if (found) matches.push(id);
}

const unique = Array.from(new Set(matches)).sort();
fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2) + "\n");
console.log(`Leaderboards detected: ${unique.length}`);
