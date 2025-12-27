import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright Configuration for Credit Risk Workflow E2E Tests
 *
 * Target: Deployed server at credit.gavinslater.co.uk
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 4,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: '../reports/e2e/html' }],
    ['json', { outputFile: '../reports/e2e/results.json' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for the deployed server
    baseURL: process.env.TEST_BASE_URL || 'https://credit.gavinslater.co.uk',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Timeout for each action
    actionTimeout: 10000,

    // Timeout for navigation
    navigationTimeout: 30000,

    // Ignore HTTPS errors (useful for self-signed certs)
    ignoreHTTPSErrors: true,
  },

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    // Authentication setup - runs before all tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Chromium tests (primary browser)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Chromium with web security disabled (for workflow tests that need mixed content)
    {
      name: 'chromium-insecure',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-running-insecure-content',
          ],
        },
      },
      dependencies: ['setup'],
    },

    // Firefox tests
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // WebKit tests
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome tests
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile Safari tests
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Output folder for test artifacts
  outputDir: '../reports/e2e/test-results',
});
