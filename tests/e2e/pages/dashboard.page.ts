import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Dashboard Page Object Model.
 */
export class DashboardPage extends BasePage {
  // Selectors - The button shows "+ Create New" in the header
  private readonly createApplicationButton = 'text=Create New';
  private readonly applicationsList = '[data-testid="applications-list"], .applications-list, table';
  private readonly applicationRow = 'tr[data-id], [data-testid="application-row"]';
  private readonly searchInput = 'input[type="search"], input[placeholder*="Search"]';
  private readonly filterDropdown = 'select[name="filter"], [data-testid="filter-select"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the dashboard.
   */
  async navigate() {
    await this.goto('/');
    await this.waitForLoadingToComplete();
  }

  /**
   * Click to create a new credit application.
   */
  async clickNewApplication() {
    await this.page.locator(this.createApplicationButton).click();
    await this.waitForUrl(/\/credit-applications\/new|\/credit-request/);
  }

  /**
   * Search for applications.
   */
  async searchApplications(query: string) {
    if (await this.isVisible(this.searchInput)) {
      await this.fill(this.searchInput, query);
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Open a specific application by clicking on its row.
   */
  async openApplication(applicationId: string) {
    const row = this.page.locator(`tr[data-id="${applicationId}"], a[href*="${applicationId}"]`);
    await row.click();
    await this.waitForLoadingToComplete();
  }

  /**
   * Get the count of applications displayed.
   */
  async getApplicationCount(): Promise<number> {
    const rows = this.page.locator(this.applicationRow);
    return await rows.count();
  }

  /**
   * Check if dashboard is loaded.
   */
  async isLoaded(): Promise<boolean> {
    // Check for dashboard title or the create button
    const dashboardTitle = this.page.locator('text=Request Tracking Dashboard');
    const createButton = this.page.locator(this.createApplicationButton);
    return await dashboardTitle.isVisible() || await createButton.isVisible();
  }

  /**
   * Get application titles from the list.
   */
  async getApplicationTitles(): Promise<string[]> {
    const titles: string[] = [];
    const rows = this.page.locator(this.applicationRow);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const title = await rows.nth(i).locator('td:first-child, .title').textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  /**
   * Check if a specific application exists in the list.
   */
  async hasApplication(title: string): Promise<boolean> {
    const titles = await this.getApplicationTitles();
    return titles.some(t => t.includes(title));
  }

  /**
   * Navigate to a form by clicking on the sidebar or menu.
   */
  async navigateToForm(formName: string) {
    // Look for navigation links in sidebar or menu
    const formLink = this.page.locator(`a:has-text("${formName}"), button:has-text("${formName}")`);
    if (await formLink.isVisible()) {
      await formLink.click();
      await this.waitForLoadingToComplete();
    }
  }
}
