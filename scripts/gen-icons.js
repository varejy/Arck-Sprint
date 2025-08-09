const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const projectRoot = process.cwd();
  const svgPath = path.join(projectRoot, "public", "icons", "icon.svg");
  const outDir = path.join(projectRoot, "public", "icons");

  if (!fs.existsSync(svgPath)) {
    console.error("SVG icon not found at", svgPath);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(svgPath);
  const sizes = [512, 192];

  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer, { density: size * 2 })
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outPath);
    console.log("Wrote", outPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
