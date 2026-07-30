import { copyFile, mkdir, rename, stat, unlink } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(projectRoot, "public", "images", "cloudwifi");

const images = [
  {
    source: "cloudwifi-hero.jpg",
    basename: "cloudwifi-hero",
    width: 1920,
    height: 1080,
    maxJpegBytes: 750_000,
  },
  {
    source: "venue-hospitality.jpg",
    basename: "venue-hospitality",
    width: 960,
    height: 720,
    maxJpegBytes: 450_000,
  },
  {
    source: "venue-retail.jpg",
    basename: "venue-retail",
    width: 960,
    height: 720,
    maxJpegBytes: 450_000,
  },
  {
    source: "venue-property.jpg",
    basename: "venue-property",
    width: 960,
    height: 720,
    maxJpegBytes: 450_000,
  },
  {
    source: "venue-healthcare.jpg",
    basename: "venue-healthcare",
    width: 960,
    height: 720,
    maxJpegBytes: 450_000,
  },
  {
    source: "venue-education.jpg",
    basename: "venue-education",
    width: 960,
    height: 720,
    maxJpegBytes: 450_000,
  },
  {
    source: "venue-public.jpg",
    basename: "venue-public",
    width: 960,
    height: 720,
    maxJpegBytes: 450_000,
  },
];

function temporaryPath(finalPath) {
  return path.join(
    path.dirname(finalPath),
    `.${path.basename(finalPath)}.${process.pid}.tmp`,
  );
}

async function replaceAtomically(finalPath, writeTemporaryFile) {
  const temporary = temporaryPath(finalPath);

  try {
    await writeTemporaryFile(temporary);
    await rename(temporary, finalPath);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

async function assertRequiredSourcesExist() {
  const missing = [];

  for (const image of images) {
    const sourcePath = path.join(outputDirectory, image.source);

    try {
      const sourceStat = await stat(sourcePath);
      if (!sourceStat.isFile() || sourceStat.size === 0)
        missing.push(image.source);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      missing.push(image.source);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required CloudWiFi JPEG source(s): ${missing.join(", ")}`,
    );
  }
}

async function assertValidJpeg(jpegPath, image) {
  const metadata = await sharp(jpegPath).metadata();
  const withinBounds =
    metadata.width &&
    metadata.height &&
    metadata.width <= image.width &&
    metadata.height <= image.height;

  if (metadata.format !== "jpeg" || !withinBounds) {
    throw new Error(
      `Invalid optimized JPEG ${image.source}: expected JPEG within ${image.width}x${image.height}, received ${metadata.format ?? "unknown"} ${metadata.width ?? "unknown"}x${metadata.height ?? "unknown"}`,
    );
  }
}

async function optimizeImage(image) {
  const sourcePath = path.join(outputDirectory, image.source);
  const jpegPath = path.join(outputDirectory, `${image.basename}.jpg`);
  const resize = {
    width: image.width,
    height: image.height,
    fit: "cover",
    position: "attention",
    withoutEnlargement: true,
  };

  const [sourceMetadata, sourceStat] = await Promise.all([
    sharp(sourcePath).metadata(),
    stat(sourcePath),
  ]);
  const needsJpegOptimization =
    sourceMetadata.format !== "jpeg" ||
    !sourceMetadata.width ||
    !sourceMetadata.height ||
    sourceMetadata.width > image.width ||
    sourceMetadata.height > image.height ||
    sourceStat.size > image.maxJpegBytes;

  // Normal reruns preserve an already-bounded checked-in JPEG to prevent cumulative
  // lossy recompression. Replaced, oversized, or unusually large sources are repaired.
  if (needsJpegOptimization) {
    await replaceAtomically(jpegPath, (temporary) =>
      sharp(sourcePath)
        .resize(resize)
        .jpeg({ quality: 86, mozjpeg: true })
        .toFile(temporary),
    );
    console.log(`Optimized JPEG source: ${image.source}`);
  } else {
    await replaceAtomically(jpegPath, (temporary) =>
      copyFile(sourcePath, temporary),
    );
  }

  await assertValidJpeg(jpegPath, image);

  await replaceAtomically(
    path.join(outputDirectory, `${image.basename}.webp`),
    (temporary) =>
      sharp(jpegPath).resize(resize).webp({ quality: 82 }).toFile(temporary),
  );

  await replaceAtomically(
    path.join(outputDirectory, `${image.basename}.avif`),
    (temporary) =>
      sharp(jpegPath)
        .resize(resize)
        .avif({ quality: 58, effort: 5 })
        .toFile(temporary),
  );
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  await assertRequiredSourcesExist();

  for (const image of images) {
    await optimizeImage(image);
  }

  console.log(
    `Optimized ${images.length} CloudWiFi images in ${outputDirectory}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
