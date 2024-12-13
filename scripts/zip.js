const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { version } = require('../package.json');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Create a file to stream archive data to
const output = fs.createWriteStream(
  path.join(__dirname, `../dist/screen-time-monitor-${version}.zip`)
);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', () => {
  console.log(`\n📦 Extension packaged successfully!`);
  console.log(`📍 Location: dist/screen-time-monitor-${version}.zip`);
  console.log(`📊 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB\n`);
});

// Handle warnings during archiving
archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Handle errors during archiving
archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files from dist directory
archive.directory('dist/', false);

// Finalize the archive
archive.finalize();