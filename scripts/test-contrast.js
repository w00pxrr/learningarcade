const fs = require("fs");
const path = require("path");

const checks = [
  {
    file: "src/hooks/useTheme.ts",
    required: ["data-contrast", "contrast", "toggleContrast"],
  },
  {
    file: "src/App.tsx",
    required: ["contrast", "toggleContrast", "isHighContrast"],
  },
  {
    file: "src/pages/Settings.tsx",
    required: ["High contrast mode", "onToggleContrast"],
  },
  {
    file: "src/index.css",
    required: ['html[data-contrast="high"]'],
  },
];

let failed = false;

for (const check of checks) {
  const fullPath = path.resolve(process.cwd(), check.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing file: ${check.file}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, "utf8");
  for (const token of check.required) {
    if (!content.includes(token)) {
      console.error(`Missing '${token}' in ${check.file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("High contrast mode check failed.");
  process.exit(1);
}

console.log("High contrast mode check passed.");
