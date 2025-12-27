import { Page } from '@playwright/test';
import users from '../fixtures/users.json';

// API base URL for direct authentication
const API_BASE_URL = 'https://credit.gavinslater.co.uk';

/**
 * Helper function to login as a specific role.
 * Use this in tests that need a different user role.
 * Uses API-based authentication for reliability.
 */
export async function loginAsRole(page: Page, role: keyof typeof users) {
  const user = users[role];

  // Clear existing auth state
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwt_refresh');
  });

  // Authenticate via API directly
  const response = await page.request.post(`${API_BASE_URL}/api/token/`, {
    data: {
      username: user.username,
      password: user.password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${role}: ${response.status()}`);
  }

  const tokens = await response.json();

  // Set the tokens in localStorage
  await page.evaluate((tokenData: { access: string; refresh: string }) => {
    localStorage.setItem('jwt', tokenData.access);
    localStorage.setItem('jwt_refresh', tokenData.refresh);
  }, tokens);

  // Navigate to dashboard (don't just reload - current page might not be dashboard)
  await page.goto('/');

  // Wait for dashboard to load
  await page.locator('text=Request Tracking Dashboard').waitFor({ timeout: 15000 });
}
