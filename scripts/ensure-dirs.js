#!/usr/bin/env node
/**
 * Ensures required directories exist before starting the application
 */
const fs = require('fs');
const path = require('path');

const dirs = [
  process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(process.cwd(), 'data'),
  process.env.STORAGE_PATH || path.join(process.cwd(), 'data', 'storage')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log('All required directories are ready');
