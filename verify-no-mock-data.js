#!/usr/bin/env node

/**
 * Script to verify that no mock data exists in the codebase
 * This enforces the NO MOCK DATA policy
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

const FORBIDDEN_PATTERNS = [
  /mock.*service/i,
  /fake.*data/i,
  /sample.*result/i,
  /demo.*content/i,
  /dummy.*data/i,
  /test.*user.*admin@cobytes\.com/i,
  /hardcoded.*password/i,
  /setTimeout.*simulate/i,
  /mock.*scan/i,
  /mock.*report/i,
];

const ALLOWED_FILES = [
  'verify-no-mock-data.js',
  'NO_MOCK_DATA_POLICY.md',
  '.git',
  'node_modules',
  'dist',
  'build',
];

async function searchForMockData() {
  console.log('🔍 Searching for mock data in the codebase...\n');
  
  const violations = [];
  
  // Get all source files
  const files = glob.sync('**/*.{js,ts,tsx,jsx}', {
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
  });
  
  for (const file of files) {
    if (ALLOWED_FILES.some(allowed => file.includes(allowed))) {
      continue;
    }
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        FORBIDDEN_PATTERNS.forEach(pattern => {
          if (pattern.test(line)) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString(),
            });
          }
        });
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
  
  return violations;
}

async function main() {
  const violations = await searchForMockData();
  
  if (violations.length === 0) {
    console.log('✅ No mock data found! The codebase is clean.\n');
    console.log('The NO MOCK DATA policy is being followed correctly.');
    process.exit(0);
  } else {
    console.log(`❌ Found ${violations.length} mock data violations:\n`);
    
    violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}:${violation.line}`);
      console.log(`   Pattern: ${violation.pattern}`);
      console.log(`   Line: ${violation.content}`);
      console.log('');
    });
    
    console.log('Please remove all mock data to comply with the NO MOCK DATA policy.');
    process.exit(1);
  }
}

main().catch(console.error);