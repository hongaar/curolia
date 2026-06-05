import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const brandPkgRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(brandPkgRoot, "..", "..");
const mobileRoot = path.join(repoRoot, "apps", "mobile");

const configPath = path.join(brandPkgRoot, "app-assets.config.json");
const config = JSON.parse(await fs.readFile(configPath, "utf8"));

const logoSourcePath = path.join(brandPkgRoot, "icon.png");

const assetInputDirRel = ".asset-input";
const assetInputDir = path.join(mobileRoot, assetInputDirRel);
await fs.rm(assetInputDir, { recursive: true, force: true });
await fs.mkdir(assetInputDir, { recursive: true });

/**
 * Android adaptive icons mask to circles/squircles. @capacitor/assets feeds the
 * full source image into the foreground layer, so edge-to-edge artwork bleeds
 * past the launcher mask. Scale into the safe zone before generation.
 */
async function prepareAdaptiveIconSource(sourcePath, destPath, scale) {
  const metadata = await sharp(sourcePath).metadata();
  const size = metadata.width;
  if (!size || size !== metadata.height) {
    throw new Error(
      `Expected square icon source, got ${metadata.width}x${metadata.height}`,
    );
  }

  const logoSize = Math.max(1, Math.round(size * scale));
  const resized = await sharp(sourcePath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(destPath);
}

const iconScale = config.native.iconForegroundScale ?? 0.72;
const preparedIconPath = path.join(assetInputDir, "icon.png");
await prepareAdaptiveIconSource(logoSourcePath, preparedIconPath, iconScale);
await fs.copyFile(preparedIconPath, path.join(assetInputDir, "icon-dark.png"));

const capacitorAssetsBin = path.join(
  repoRoot,
  "node_modules",
  ".bin",
  "capacitor-assets",
);

const args = [
  "generate",
  "--ios",
  "--android",
  "--assetPath",
  assetInputDirRel,
  "--androidProject",
  "android",
  "--iosProject",
  "ios/App",
  "--iconBackgroundColor",
  config.native.iconBackgroundColor,
  "--iconBackgroundColorDark",
  config.native.iconBackgroundColorDark,
  "--splashBackgroundColor",
  config.native.splashBackgroundColor,
  "--splashBackgroundColorDark",
  config.native.splashBackgroundColorDark,
  "--logoSplashScale",
  String(config.native.logoSplashScale ?? 0.2),
];

execFileSync(capacitorAssetsBin, args, { stdio: "inherit", cwd: mobileRoot });

// capacitor-assets uses 16.7% inset; 16.6% avoids 1px background gaps on some launchers.
const adaptiveIconXmlPaths = [
  path.join(
    mobileRoot,
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
  ),
  path.join(
    mobileRoot,
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
  ),
];
for (const xmlPath of adaptiveIconXmlPaths) {
  const xml = await fs.readFile(xmlPath, "utf8");
  const fixed = xml.replaceAll(
    'android:inset="16.7%"',
    'android:inset="16.6%"',
  );
  if (fixed !== xml) {
    await fs.writeFile(xmlPath, fixed);
  }
}

console.log("Generated native assets via @capacitor/assets (iOS + Android).");
