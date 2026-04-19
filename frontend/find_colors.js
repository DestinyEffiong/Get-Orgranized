const fs = require("fs");
const path = require("path");

function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) files.push(full);
  }
  return files;
}

const srcDir = "C:\Users\HP\Desktop\SLIMDEV\go\src";
const pattern = /#[0-9A-Fa-f]{3,8}/g;
const counts = {};

for (const file of walk(srcDir)) {
  const content = fs.readFileSync(file, "utf8");
  const matches = content.match(pattern);
  if (matches) {
    for (const m of matches) {
      counts[m] = (counts[m] || 0) + 1;
    }
  }
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 60);
for (const [color, count] of sorted) {
  console.log(String(count).padStart(6) + " " + color);
}