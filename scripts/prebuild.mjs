import { rmSync, mkdirSync, cpSync } from "fs";

rmSync("public/vendor", { recursive: true, force: true });

for (const dir of [
  "public/vendor/axios",
  "public/vendor/fontawesome-7", // renamed from fontawesome-6
  "public/vendor/material-symbols",
]) {
  mkdirSync(dir, { recursive: true });
}

cpSync("node_modules/@ruffle-rs/ruffle", "public/vendor/ruffle", { recursive: true });
cpSync("node_modules/axios/dist/axios.min.js", "public/vendor/axios/axios.min.js");
cpSync("node_modules/@fortawesome/fontawesome-free", "public/vendor/fontawesome-7", {
  recursive: true,
});
cpSync("node_modules/material-symbols", "public/vendor/material-symbols", { recursive: true });
