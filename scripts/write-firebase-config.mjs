#!/usr/bin/env node
/**
 * Generates the gitignored `firebase.js` at the repo root so CI (Codemagic,
 * GitHub Actions, ...) can build the web app. Local dev is untouched: if
 * firebase.js already exists the script does nothing.
 *
 * Two ways to supply the config, checked in this order:
 *
 *   1. FIREBASE_JS_B64 - base64 of a complete firebase.js file.
 *        base64 -i firebase.js | pbcopy      (macOS)
 *        base64 -w0 firebase.js              (Linux)
 *      One variable, reproduces your working file exactly.
 *
 *   2. Individual variables, rendered into firebase.js.template:
 *        FIREBASE_API_KEY             (required)
 *        FIREBASE_PROJECT_ID          (required)
 *        FIREBASE_APP_ID              (required)
 *        FIREBASE_MESSAGING_SENDER_ID (required)
 *        FIREBASE_STORAGE_BUCKET      (required)
 *        RECAPTCHA_SITE_KEY           (required, App Check reCAPTCHA v3)
 *        FIREBASE_AUTH_DOMAIN         (optional, defaults to <projectId>.web.app)
 *        FIREBASE_MEASUREMENT_ID      (optional)
 *
 * Pass --force to overwrite an existing firebase.js.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'firebase.js');
const templatePath = join(root, 'firebase.js.template');
const force = process.argv.includes('--force');

const fail = (msg) => {
  console.error(`\nwrite-firebase-config: ${msg}\n`);
  process.exit(1);
};

if (existsSync(target) && !force) {
  console.log('write-firebase-config: firebase.js already exists, leaving it alone (use --force to overwrite).');
  process.exit(0);
}

const b64 = process.env.FIREBASE_JS_B64;
if (b64 && b64.trim()) {
  const decoded = Buffer.from(b64.trim(), 'base64').toString('utf8');
  if (!/export\s+const\s+db\b/.test(decoded)) {
    fail('FIREBASE_JS_B64 decoded to something that does not export `db`. Re-encode the real firebase.js.');
  }
  writeFileSync(target, decoded);
  console.log('write-firebase-config: wrote firebase.js from FIREBASE_JS_B64.');
  process.exit(0);
}

if (!existsSync(templatePath)) fail(`template not found at ${templatePath}`);

const projectId = process.env.FIREBASE_PROJECT_ID;
const values = {
  YOUR_API_KEY: process.env.FIREBASE_API_KEY,
  'YOUR_PROJECT_ID.web.app': process.env.FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.web.app` : undefined),
  YOUR_PROJECT_ID: projectId,
  YOUR_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  YOUR_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  YOUR_APP_ID: process.env.FIREBASE_APP_ID,
  YOUR_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || '',
  YOUR_RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
};

const required = {
  FIREBASE_API_KEY: values.YOUR_API_KEY,
  FIREBASE_PROJECT_ID: values.YOUR_PROJECT_ID,
  FIREBASE_APP_ID: values.YOUR_APP_ID,
  FIREBASE_MESSAGING_SENDER_ID: values.YOUR_MESSAGING_SENDER_ID,
  FIREBASE_STORAGE_BUCKET: values.YOUR_STORAGE_BUCKET,
  RECAPTCHA_SITE_KEY: values.YOUR_RECAPTCHA_SITE_KEY,
};
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);

if (missing.length) {
  fail(
    'firebase.js is missing and no config was supplied.\n' +
    '  Set FIREBASE_JS_B64 (base64 of a complete firebase.js), or set these variables:\n' +
    missing.map((k) => `    - ${k}`).join('\n') +
    '\n  In Codemagic: App settings > Environment variables, then reference the group in codemagic.yaml.'
  );
}

let out = readFileSync(templatePath, 'utf8');
// Longest placeholder first so YOUR_PROJECT_ID.web.app is not clobbered by YOUR_PROJECT_ID.
for (const key of Object.keys(values).sort((a, b) => b.length - a.length)) {
  const pattern = new RegExp(`(["'])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
  out = out.replace(pattern, () => JSON.stringify(values[key]));
}

const leftover = out.match(/YOUR_[A-Z_]+/g);
if (leftover) fail(`unsubstituted placeholders remain: ${[...new Set(leftover)].join(', ')}`);

writeFileSync(target, out);
console.log(`write-firebase-config: wrote firebase.js for project "${projectId}" from firebase.js.template.`);
