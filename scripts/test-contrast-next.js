const fs = require("fs");
const path = require("path");

const checks = [
  {
    file: "src/hooks/useTheme.ts",
    required: ["data-contrast", "contrast", "toggleContrast"],
  },
  {
    file: "src/components/ThemeRoot.tsx",
    required: ["isHighContrast", "toggleContrast"],
  },
  {
    file: "src/views/Settings.tsx",
    required: ["High contrast mode", "toggleContrast"],
  },
  {
    file: "src/index.css",
    required: ['html[data-contrast="high"]'],
  },
  {
    file: "src/app/layout.tsx",
    required: ["ThemeRoot"],
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
