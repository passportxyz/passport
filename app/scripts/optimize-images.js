#!/usr/bin/env node

/**
 * Image Optimization Script for Campaign Images
 *
 * This script converts PNG campaign images to optimized WebP format.
 * - Input: /public/assets/campaigns/*.png
 * - Output: WebP files at 570x786 pixels (2x of 285x393 display size)
 * - Quality: 85
 * - Also creates a placeholder.webp with a gray background
 *
 * This script is idempotent - it can be run multiple times safely.
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { existsSync } = require("fs");

// Configuration
const CONFIG = {
  inputDir: path.join(__dirname, "..", "public", "assets", "campaigns"),
  outputWidth: 570,
  outputHeight: 786,
  quality: 85,
  placeholderColor: { r: 128, g: 128, b: 128 }, // #808080 gray
};

async function optimizeImage(inputPath, outputPath) {
  const filename = path.basename(inputPath);
  console.log(`Processing: ${filename}`);

  try {
    await sharp(inputPath)
      .resize(CONFIG.outputWidth, CONFIG.outputHeight, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: CONFIG.quality })
      .toFile(outputPath);

    console.log(`  ✓ Created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Error processing ${filename}: ${error.message}`);
    return false;
  }
}

async function createPlaceholder(outputPath) {
  console.log("Creating placeholder image...");

  try {
    await sharp({
      create: {
        width: CONFIG.outputWidth,
        height: CONFIG.outputHeight,
        channels: 3,
        background: CONFIG.placeholderColor,
      },
    })
      .webp({ quality: CONFIG.quality })
      .toFile(outputPath);

    console.log(`  ✓ Created: placeholder.webp`);
    return true;
  } catch (error) {
    console.error(`  ✗ Error creating placeholder: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("Campaign Image Optimization Script");
  console.log("=".repeat(50));
  console.log(`Input directory: ${CONFIG.inputDir}`);
  console.log(`Output dimensions: ${CONFIG.outputWidth}x${CONFIG.outputHeight}`);
  console.log(`WebP quality: ${CONFIG.quality}`);
  console.log("=".repeat(50));

  // Check if input directory exists
  if (!existsSync(CONFIG.inputDir)) {
    console.error(`Error: Input directory does not exist: ${CONFIG.inputDir}`);
    process.exit(1);
  }

  // Get all PNG files in the input directory
  const files = await fs.readdir(CONFIG.inputDir);
  const pngFiles = files.filter((file) => file.toLowerCase().endsWith(".png"));

  if (pngFiles.length === 0) {
    console.log("No PNG files found in the input directory.");
  } else {
    console.log(`Found ${pngFiles.length} PNG file(s) to process.\n`);
  }

  let successCount = 0;
  let failCount = 0;

  // Process each PNG file
  for (const pngFile of pngFiles) {
    const inputPath = path.join(CONFIG.inputDir, pngFile);
    const outputFilename = pngFile.replace(/\.png$/i, ".webp");
    const outputPath = path.join(CONFIG.inputDir, outputFilename);

    const success = await optimizeImage(inputPath, outputPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Create placeholder image
  const placeholderPath = path.join(CONFIG.inputDir, "placeholder.webp");
  const placeholderSuccess = await createPlaceholder(placeholderPath);
  if (placeholderSuccess) {
    successCount++;
  } else {
    failCount++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Summary");
  console.log("=".repeat(50));
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }

  console.log("\nImage optimization complete!");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
