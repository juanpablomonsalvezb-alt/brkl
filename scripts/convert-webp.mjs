import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";

const dir = "/Users/juanpablomonsalvez/Downloads/Moodle-Theme-Creator/client/public/images";

function walk(d) {
  let files = [];
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) files = files.concat(walk(p));
    else if ([".jpeg", ".jpg", ".png"].includes(extname(f).toLowerCase())) files.push(p);
  }
  return files;
}

const files = walk(dir);
let totalBefore = 0, totalAfter = 0;

for (const file of files) {
  const before = statSync(file).size;
  const out = file.replace(/\.(jpeg|jpg|png)$/i, ".webp");
  await sharp(file).webp({ quality: 78 }).toFile(out);
  const after = statSync(out).size;
  totalBefore += before;
  totalAfter += after;
  console.log(`${basename(file)}: ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB`);
}

console.log(`\nTotal: ${(totalBefore/1024).toFixed(0)}KB -> ${(totalAfter/1024).toFixed(0)}KB (${(100-100*totalAfter/totalBefore).toFixed(0)}% reducción)`);
