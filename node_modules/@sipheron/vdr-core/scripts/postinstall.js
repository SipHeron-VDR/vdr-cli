const fs = require('fs');
const path = require('path');

// NPM sets INIT_CWD to the root directory where `npm install` was run
const initCwd = process.env.INIT_CWD;

function copyDirRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  if (!initCwd) {
    return;
  }

  // If installed globally, or installed in its own development directory, exit silently
  if (process.env.npm_config_global === 'true' || process.cwd() === initCwd) {
    return;
  }

  const examplesSrc = path.join(__dirname, '..', 'examples');
  const examplesDest = path.join(initCwd, 'sipheron-vdr-examples');

  if (fs.existsSync(examplesSrc)) {
    if (!fs.existsSync(examplesDest)) {
      try {
        console.log('\nSipHeron VDR — Unpacking quickstart examples into your project...\n');
        copyDirRecursiveSync(examplesSrc, examplesDest);
        console.log(`successfully created: ./sipheron-vdr-examples/\n`);
      } catch (err) {
        console.error('Failed to unpack examples:', err);
      }
    } else {
      console.log('\nSipHeron VDR — Directory "sipheron-vdr-examples" already exists in your workspace. Skipping unpacking.\n');
    }
  }
}

main();
