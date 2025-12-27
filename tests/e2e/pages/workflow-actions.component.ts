import { Page, Locator, expect } from '@playwright/test';

/**
 * WorkflowActions Component Page Object.
 *
 * Represents the workflow actions section that appears on all forms,
 * containing transition buttons and comments field.
 *
 * The component renders:
 * - Title "Workflow Actions" with emoji
 * - Current State chip (if existing form)
 * - Comments TextField with placeholder "Add comments for this action..."
 * - Dynamic buttons based on allowed transitions
 */
export class WorkflowActionsComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the workflow actions container locator.
   * The component has a heading "Workflow Actions"
   */
  getContainer(): Locator {
    // Use the heading to find the parent container
    return this.page.getByRole('heading', { name: /Workflow Actions/ }).locator('..');
  }

  /**
   * Check if workflow actions section is visible.
   * Target the heading specifically to avoid strict mode violations.
   */
  async isVisible(): Promise<boolean> {
    // Use role-based selector to target the heading specifically
    return await this.page.getByRole('heading', { name: /Workflow Actions/ }).isVisible();
  }

  /**
   * Get the current workflow state from the chip.
   * The chip shows "Current State: STATE_NAME"
   */
  async getCurrentState(): Promise<string | null> {
    const chip = this.page.locator('.MuiChip-root');
    if (await chip.isVisible()) {
      const text = await chip.textContent();
      // Extract state name from "Current State: STATE_NAME"
      const match = text?.match(/Current State:\s*(.+)/);
      return match ? match[1].trim() : text?.trim() || null;
    }
    return null;
  }

  /**
   * Enter comments for the transition.
   * Comments TextField has placeholder "Add comments for this action..."
   */
  async enterComments(comments: string) {
    const field = this.page.getByPlaceholder('Add comments for this action...');
    if (await field.isVisible()) {
      await field.fill(comments);
    }
  }

  /**
   * Get all available transition buttons.
   * Buttons are MUI Button components with variant="contained"
   */
  async getTransitionButtons(): Promise<string[]> {
    // Buttons have class MuiButton-contained and display emoji + transition name
    const buttons = this.page.locator('button.MuiButton-contained');
    const count = await buttons.count();
    const labels: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text) {
        // Remove emojis and trim
        const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        labels.push(cleanText);
      }
    }

    return labels;
  }

  /**
   * Click a specific transition button by name (partial match).
   */
  async clickTransition(transitionName: string) {
    // Buttons show emoji + name, so use partial text match
    const button = this.page.locator(`button:has-text("${transitionName}")`);
    await button.first().click();
  }

  /**
   * Perform a transition with optional comments.
   */
  async performTransition(transitionName: string, comments?: string) {
    if (comments) {
      await this.enterComments(comments);
    }
    await this.clickTransition(transitionName);
    await this.waitForTransitionComplete();
  }

  /**
   * Wait for a transition to complete.
   * Buttons show "Processing..." while loading
   */
  async waitForTransitionComplete() {
    // Wait for processing indicator to appear and disappear
    const processing = this.page.locator('button:has-text("Processing")');

    // Wait for loading to appear (briefly)
    try {
      await processing.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Loading may have been too quick to catch
    }

    // Wait for loading to disappear
    try {
      await processing.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // May already be hidden
    }

    // Note: We don't use networkidle here because dashboards often have
    // continuous polling that prevents the network from going idle.
    // The calling code should handle waiting for specific outcomes.
    await this.page.waitForTimeout(500); // Brief pause for UI to update
  }

  /**
   * Check if there's an error after a transition.
   */
  async hasError(): Promise<boolean> {
    const errorAlert = this.page.locator('.MuiAlert-standardError, [role="alert"]');
    return await errorAlert.isVisible();
  }

  /**
   * Get the error message if present.
   */
  async getErrorMessage(): Promise<string | null> {
    const alert = this.page.locator('.MuiAlert-standardError, [role="alert"]');
    if (await alert.isVisible()) {
      return await alert.textContent();
    }
    return null;
  }

  /**
   * Check if a specific transition button is available.
   */
  async hasTransition(transitionName: string): Promise<boolean> {
    const button = this.page.locator(`button:has-text("${transitionName}")`);
    return await button.isVisible();
  }

  /**
   * Check if Save as Draft button is available.
   */
  async hasSaveDraftButton(): Promise<boolean> {
    return await this.hasTransition('Save as Draft');
  }

  /**
   * Check if Submit button is available.
   */
  async hasSubmitButton(): Promise<boolean> {
    return await this.hasTransition('Submit');
  }

  /**
   * Click Save as Draft button.
   * For new forms, this creates the application.
   */
  async clickSaveDraft() {
    await this.clickTransition('Save as Draft');
    await this.waitForTransitionComplete();
  }

  /**
   * Click Submit for In Progress button.
   */
  async clickSubmitForInProgress() {
    // This might be called different things in different states
    const hasInProgress = await this.hasTransition('In Progress');
    if (hasInProgress) {
      await this.performTransition('In Progress');
    }
  }

  /**
   * Click final Submit button.
   */
  async clickSubmit(comments?: string) {
    await this.performTransition('Submit', comments);
  }

  /**
   * Verify workflow state matches expected (partial match).
   */
  async expectState(expectedState: string) {
    const currentState = await this.getCurrentState();
    expect(currentState).toContain(expectedState);
  }
}
