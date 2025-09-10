#!/usr/bin/env node

/**
 * Basic smoke tests for LaunchLens CLI
 * Run with: node test/cli.test.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import assert from 'assert';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = join(__dirname, '..', 'cli.js');

// Test counter
let passed = 0;
let failed = 0;

// Color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function test(name, fn) {
  try {
    await fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

// Tests
async function runTests() {
  console.log('Running LaunchLens CLI smoke tests...\n');

  // Test 1: Help command works
  await test('CLI shows help with --help flag', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('LaunchLens CLI'), 'Help should show LaunchLens CLI');
    assert(stdout.includes('Usage:'), 'Help should show usage');
    assert(stdout.includes('Examples:'), 'Help should show examples');
  });

  // Test 2: Config commands exist
  await test('Config commands are available', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('config set'), 'Should have config set command');
    assert(stdout.includes('config get'), 'Should have config get command');
    assert(stdout.includes('config list'), 'Should have config list command');
  });

  // Test 3: Error on missing idea
  await test('Shows error when no idea provided', async () => {
    try {
      await execAsync(`node ${cliPath}`);
      assert.fail('Should have thrown error');
    } catch (error) {
      assert(error.stderr.includes('Error') || error.stdout.includes('Error'), 
        'Should show error message');
    }
  });

  // Test 4: Config list works
  await test('Config list command works', async () => {
    const { stdout } = await execAsync(`node ${cliPath} config list`);
    assert(stdout.includes('Configuration') || stdout.includes('model'), 
      'Should show configuration');
  });

  // Test 5: Short idea validation
  await test('Rejects ideas shorter than 10 characters', async () => {
    try {
      const { stdout, stderr } = await execAsync(`node ${cliPath} "short"`);
      const output = stdout + stderr;
      assert(output.includes('at least 10 characters') || output.includes('Error'), 
        'Should reject short ideas');
    } catch (error) {
      // Expected to fail, check error message
      const output = error.stdout + error.stderr;
      assert(output.includes('at least 10 characters') || output.includes('Error'),
        'Should show appropriate error');
    }
  });

  // Test 6: JSON flag is recognized
  await test('JSON flag is recognized', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('--json'), 'Should support --json flag');
  });

  // Test 7: Roast mode flag exists
  await test('Roast mode flag exists', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('--roast'), 'Should support --roast flag');
  });

  // Test 8: Detailed mode flag exists
  await test('Detailed mode flag exists', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('--detailed'), 'Should support --detailed flag');
  });

  // Test 9: File processing flag exists
  await test('File processing flag exists', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('--file'), 'Should support --file flag');
  });

  // Test 10: Model flag exists
  await test('Model selection flag exists', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert(stdout.includes('--model'), 'Should support --model flag');
  });

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log(`Tests completed: ${GREEN}${passed} passed${RESET}, ${failed > 0 ? RED : ''}${failed} failed${RESET}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});