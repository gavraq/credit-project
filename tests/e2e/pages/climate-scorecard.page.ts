import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Climate Scorecard Page Object.
 *
 * Handles interactions with the Climate Scorecard form including:
 * - AI generation with "Generate with AI" button
 * - Manual field entry and updates
 * - Viewing confidence scores
 * - Analyst review status management
 */
export class ClimateScorecardPage extends BasePage {
  // Locators for main elements
  readonly generateAIButton: Locator;
  readonly overallRatingField: Locator;
  readonly transitionRiskSection: Locator;
  readonly physicalRiskSection: Locator;
  readonly aiGeneratedBadge: Locator;
  readonly confidenceScoresPanel: Locator;
  readonly analystReviewStatus: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    // AI Generation button
    this.generateAIButton = page.locator('button:has-text("Generate with AI")');

    // Overall rating display
    this.overallRatingField = page.locator('[data-testid="overall-climate-risk-rating"], text=/Overall.*Rating/i');

    // Section headers
    this.transitionRiskSection = page.locator('text=/Transition Risk/i').first();
    this.physicalRiskSection = page.locator('text=/Physical Risk/i').first();

    // AI metadata indicators
    this.aiGeneratedBadge = page.locator('text=/AI Generated/i, [data-testid="ai-generated-badge"]');
    this.confidenceScoresPanel = page.locator('[data-testid="confidence-scores"], text=/Confidence/i');

    // Analyst review
    this.analystReviewStatus = page.locator('[data-testid="analyst-review-status"], select[name*="review"], text=/Review Status/i');

    // Save button
    this.saveButton = page.locator('button:has-text("Save")').first();
  }

  /**
   * Navigate to climate scorecard for a specific application.
   */
  async navigateToScorecard(applicationId: string) {
    // Navigate to the climate scorecard page
    await this.goto(`/credit-requests/${applicationId}/climate-scorecard`);
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.waitForLoadingToComplete();
  }

  /**
   * Navigate via the application details page.
   */
  async navigateFromDetails(applicationId: string) {
    // Go to details page first
    await this.goto(`/credit-requests/${applicationId}/details`);
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.waitForLoadingToComplete();

    // Look for Climate Scorecard in sub-processes or tabs
    const scorecardLink = this.page.locator('text=/Climate Scorecard/i').first();
    if (await scorecardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await scorecardLink.click();
      await this.page.waitForLoadState('networkidle');
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Check if the "Generate with AI" button is visible.
   */
  async hasGenerateAIButton(): Promise<boolean> {
    return await this.generateAIButton.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Click the "Generate with AI" button and wait for generation to complete.
   * Note: This can take 5-7 minutes for real AI generation.
   */
  async clickGenerateAI(timeout: number = 420000) {
    await expect(this.generateAIButton).toBeVisible();
    await this.generateAIButton.click();

    // Wait for loading indicator
    await this.page.waitForSelector('text=/Generating/i, .MuiCircularProgress-root', { timeout: 10000 }).catch(() => {});

    // Wait for generation to complete (loading to disappear)
    await this.page.waitForSelector('text=/Generating/i, .MuiCircularProgress-root', { state: 'hidden', timeout });

    // Wait for the page to update with generated data
    await this.page.waitForLoadState('networkidle');
    await this.waitForLoadingToComplete();
  }

  /**
   * Check if the scorecard shows AI-generated badge/indicator.
   */
  async isAIGenerated(): Promise<boolean> {
    return await this.aiGeneratedBadge.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Get the overall climate risk rating value.
   */
  async getOverallRating(): Promise<string | null> {
    // Try various selectors for the rating
    const selectors = [
      '[data-testid="overall-climate-risk-rating"]',
      'input[name*="overall_climate_risk_rating"]',
      'select[name*="overall_climate_risk_rating"]',
      '.overall-rating',
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        // Try getting value (for input/select) or text content
        const value = await element.inputValue().catch(() => null) ||
                      await element.textContent().catch(() => null);
        if (value) return value.trim();
      }
    }

    // Try finding text that looks like a rating (A, B, C, D, E)
    const ratingText = this.page.locator('text=/Rating.*[A-E]|[A-E].*Rating/i').first();
    if (await ratingText.isVisible().catch(() => false)) {
      const text = await ratingText.textContent();
      const match = text?.match(/[A-E]/);
      return match ? match[0] : null;
    }

    return null;
  }

  /**
   * Get the transition risk score/level.
   */
  async getTransitionRiskLevel(): Promise<string | null> {
    const selectors = [
      '[data-testid="transition-risk-score"]',
      'input[name*="overall_transition_risk"]',
      'select[name*="overall_transition_risk"]',
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const value = await element.inputValue().catch(() => null) ||
                      await element.textContent().catch(() => null);
        if (value) return value.trim();
      }
    }
    return null;
  }

  /**
   * Get the physical risk score/level.
   */
  async getPhysicalRiskLevel(): Promise<string | null> {
    const selectors = [
      '[data-testid="physical-risk-score"]',
      'input[name*="overall_physical_risk"]',
      'select[name*="overall_physical_risk"]',
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const value = await element.inputValue().catch(() => null) ||
                      await element.textContent().catch(() => null);
        if (value) return value.trim();
      }
    }
    return null;
  }

  /**
   * Check if confidence scores are displayed.
   */
  async hasConfidenceScores(): Promise<boolean> {
    return await this.confidenceScoresPanel.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Get the analyst review status.
   */
  async getAnalystReviewStatus(): Promise<string | null> {
    const statusElement = this.page.locator('[data-testid="analyst-review-status"], [name*="review_status"]').first();
    if (await statusElement.isVisible().catch(() => false)) {
      return await statusElement.inputValue().catch(() => null) ||
             await statusElement.textContent().catch(() => null);
    }
    return null;
  }

  /**
   * Set the analyst review status.
   */
  async setAnalystReviewStatus(status: 'pending' | 'reviewed' | 'approved' | 'rejected') {
    const select = this.page.locator('select[name*="review_status"]').first();
    if (await select.isVisible().catch(() => false)) {
      await select.selectOption(status);
    } else {
      // Try radio buttons or other controls
      const statusOption = this.page.locator(`input[value="${status}"], label:has-text("${status}")`).first();
      if (await statusOption.isVisible().catch(() => false)) {
        await statusOption.click();
      }
    }
  }

  /**
   * Fill a specific field in the scorecard.
   */
  async fillField(fieldName: string, value: string | number | boolean) {
    // Try various selector patterns
    const selectors = [
      `input[name="${fieldName}"]`,
      `input[name*="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `select[name*="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `textarea[name*="${fieldName}"]`,
      `[data-testid="${fieldName}"]`,
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());

        if (tagName === 'select') {
          await element.selectOption(String(value));
        } else if (tagName === 'input') {
          const inputType = await element.getAttribute('type');
          if (inputType === 'checkbox') {
            if (value) {
              await element.check();
            } else {
              await element.uncheck();
            }
          } else {
            await element.fill(String(value));
          }
        } else if (tagName === 'textarea') {
          await element.fill(String(value));
        }
        return;
      }
    }

    console.log(`Could not find field: ${fieldName}`);
  }

  /**
   * Save the scorecard form.
   */
  async save() {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForLoadingToComplete();
  }

  /**
   * Check if the form has been saved successfully.
   */
  async expectSaveSuccess() {
    // Look for success message or absence of error
    const successMessage = this.page.locator('text=/saved|success/i').first();
    const errorMessage = this.page.locator('.MuiAlert-standardError, text=/error/i').first();

    // Wait a moment for any messages to appear
    await this.page.waitForTimeout(1000);

    if (await errorMessage.isVisible().catch(() => false)) {
      const error = await errorMessage.textContent();
      throw new Error(`Save failed: ${error}`);
    }

    // Success is indicated by success message or no error
    const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    return hasSuccess;
  }

  /**
   * Verify the scorecard contains expected fields.
   */
  async expectScorecardLoaded() {
    // Check for key sections
    await expect(this.page.locator('text=/Climate/i').first()).toBeVisible({ timeout: 10000 });

    // Check for at least one of the main sections
    const hasTransition = await this.transitionRiskSection.isVisible().catch(() => false);
    const hasPhysical = await this.physicalRiskSection.isVisible().catch(() => false);
    const hasRating = await this.page.locator('text=/Rating|Risk Score/i').first().isVisible().catch(() => false);

    expect(hasTransition || hasPhysical || hasRating).toBe(true);
  }

  /**
   * Get key risk drivers text.
   */
  async getKeyRiskDrivers(): Promise<string | null> {
    const element = this.page.locator('[name*="key_risk_drivers"], [data-testid="key-risk-drivers"]').first();
    if (await element.isVisible().catch(() => false)) {
      return await element.inputValue().catch(() => null) ||
             await element.textContent().catch(() => null);
    }
    return null;
  }

  /**
   * Get recommended mitigations text.
   */
  async getRecommendedMitigations(): Promise<string | null> {
    const element = this.page.locator('[name*="recommended_mitigations"], [data-testid="recommended-mitigations"]').first();
    if (await element.isVisible().catch(() => false)) {
      return await element.inputValue().catch(() => null) ||
             await element.textContent().catch(() => null);
    }
    return null;
  }
}
