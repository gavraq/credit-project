import { test as setup, expect, request } from '@playwright/test';
import users from '../fixtures/users.json';

const authFile = 'playwright/.auth/user.json';

// API base URL for direct authentication
const API_BASE_URL = 'https://credit.gavinslater.co.uk';

/**
 * Authentication setup for E2E tests.
 *
 * This authenticates via API and sets localStorage tokens directly.
 * This is more reliable than testing the login form each time.
 */
setup('authenticate', async ({ page }) => {
  // Use the Relationship Manager for initial auth
  const user = users.relationship_manager;

  // Authenticate via API directly (more reliable than form-based login)
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_BASE_URL}/api/token/`, {
    data: {
      username: user.username,
      password: user.password,
    },
  });

  expect(response.ok()).toBeTruthy();
  const tokens = await response.json();

  // Navigate to the app first to set localStorage on the correct domain
  await page.goto('/');

  // Set the tokens in localStorage
  await page.evaluate((tokenData) => {
    localStorage.setItem('jwt', tokenData.access);
    localStorage.setItem('jwt_refresh', tokenData.refresh);
  }, tokens);

  // Reload to pick up the authentication
  await page.reload();

  // Wait for the dashboard to load (should auto-redirect to dashboard when authenticated)
  // Use Playwright locator syntax for text matching
  await page.locator('text=Request Tracking Dashboard').waitFor({ timeout: 15000 });

  // Verify we're not on the login page
  await expect(page).not.toHaveURL(/\/login/);

  // Save the authentication state
  await page.context().storageState({ path: authFile });
});
