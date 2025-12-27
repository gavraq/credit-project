import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Login Page Object Model.
 */
export class LoginPage extends BasePage {
  // Selectors - MUI TextField doesn't set name attribute by default
  private readonly loginButton = 'button[type="submit"]';
  private readonly errorMessage = '.MuiAlert-standardError, [role="alert"], .MuiAlert-root';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the login page.
   */
  async navigate() {
    await this.goto('/login');
    await this.page.waitForSelector('form');
  }

  /**
   * Fill in the username field (first input on the form).
   * Uses pressSequentially to properly trigger React onChange.
   */
  async enterUsername(username: string) {
    const usernameInput = this.page.locator('input').first();
    await usernameInput.click();
    await usernameInput.fill('');
    await usernameInput.pressSequentially(username, { delay: 50 });
  }

  /**
   * Fill in the password field.
   * Uses pressSequentially to properly trigger React onChange.
   */
  async enterPassword(password: string) {
    const passwordInput = this.page.locator('input[type="password"]');
    await passwordInput.click();
    await passwordInput.fill('');
    await passwordInput.pressSequentially(password, { delay: 50 });
  }

  /**
   * Click the login button.
   */
  async clickLogin() {
    await this.click(this.loginButton);
  }

  /**
   * Perform a complete login action.
   */
  async login(username: string, password: string) {
    await this.navigate();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  /**
   * Login and wait for successful redirect away from login page.
   */
  async loginAndWait(username: string, password: string) {
    await this.login(username, password);
    // Wait for redirect away from login
    await this.page.waitForURL((url) => !url.pathname.includes('/login'));
    await this.waitForLoadingToComplete();
  }

  /**
   * Get the login error message if displayed.
   */
  async getLoginError(): Promise<string | null> {
    if (await this.isVisible(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return null;
  }

  /**
   * Check if login form is displayed.
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible('form');
  }

  /**
   * Verify successful login by checking URL.
   */
  async isLoggedIn(): Promise<boolean> {
    const url = this.getUrl();
    return !url.includes('/login');
  }
}
