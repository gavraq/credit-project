import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object with common functionality for all pages.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL path.
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded.
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the current URL.
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Check if an element is visible.
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Click an element with retry logic.
   */
  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  /**
   * Fill an input field.
   */
  async fill(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Select an option from a dropdown.
   */
  async selectOption(selector: string, value: string) {
    await this.page.locator(selector).selectOption(value);
  }

  /**
   * Get text content from an element.
   */
  async getText(selector: string): Promise<string | null> {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Wait for a specific URL pattern.
   */
  async waitForUrl(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Take a screenshot with a descriptive name.
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `../reports/e2e/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Check for error alerts on the page.
   */
  async hasError(): Promise<boolean> {
    const errorAlert = this.page.locator('.MuiAlert-standardError, [role="alert"]');
    return await errorAlert.isVisible();
  }

  /**
   * Get error message text.
   */
  async getErrorMessage(): Promise<string | null> {
    const errorAlert = this.page.locator('.MuiAlert-standardError, [role="alert"]');
    return await errorAlert.textContent();
  }

  /**
   * Wait for a loading spinner to disappear.
   */
  async waitForLoadingToComplete() {
    const spinner = this.page.locator('.MuiCircularProgress-root, [role="progressbar"]');
    if (await spinner.isVisible()) {
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }
}
