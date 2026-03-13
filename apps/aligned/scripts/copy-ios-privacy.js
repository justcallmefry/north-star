#!/usr/bin/env node
/**
 * Copy PrivacyInfo.xcprivacy into the iOS app bundle so you can add it to the Xcode target.
 * Run after: npx cap add ios
 * Usage: node scripts/copy-ios-privacy.js
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "ios-privacy", "PrivacyInfo.xcprivacy");
const destDir = path.join(__dirname, "..", "ios", "App", "App");
const dest = path.join(destDir, "PrivacyInfo.xcprivacy");

if (!fs.existsSync(src)) {
  console.error("Source not found:", src);
  process.exit(1);
}
if (!fs.existsSync(path.join(__dirname, "..", "ios"))) {
  console.error("ios folder not found. Run: npx cap add ios");
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied PrivacyInfo.xcprivacy to ios/App/App/");
console.log("In Xcode: add this file to the App target (File → Add Files, or drag into project, check App target).");
