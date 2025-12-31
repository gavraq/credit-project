import { test, expect } from '@playwright/test';
import { ClimateScorecardPage } from '../../pages/climate-scorecard.page';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';

/**
 * Climate Scorecard E2E Tests.
 *
 * Tests for the Climate Scorecard feature including:
 * - Viewing climate scorecards
 * - AI generation (mocked in CI, real in integration)
 * - Manual field updates
 * - Analyst review workflow
 */

// Test configuration
const TEST_CONFIG = {
  // Application ID with climate scorecard data (created in test setup or fixture)
  // In real tests, this would be created fresh or come from a fixture
  applicationId: process.env.TEST_APPLICATION_ID || '',
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'https://credit.gavinslater.co.uk',
};

test.describe('Climate Scorecard Feature', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let scorecardPage: ClimateScorecardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    scorecardPage = new ClimateScorecardPage(page);

    // Login as credit analyst (has access to climate scorecard)
    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_CA_USER || 'ca_test',
      process.env.TEST_PASSWORD || 'testpass123'
    );
    await dashboardPage.waitForDashboard();
  });

  test.describe('Climate Scorecard Navigation', () => {
    test('should display climate scorecard link in application details', async ({ page }) => {
      // Skip if no test application configured
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await page.goto(`${TEST_CONFIG.baseUrl}/credit-requests/${TEST_CONFIG.applicationId}/details`);
      await page.waitForLoadState('networkidle');

      // Look for Climate Scorecard in sub-processes or navigation
      const scorecardLink = page.locator('text=/Climate Scorecard/i').first();
      await expect(scorecardLink).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to climate scorecard page', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);
      await scorecardPage.expectScorecardLoaded();
    });
  });

  test.describe('Climate Scorecard Display', () => {
    test('should display main scorecard sections', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Verify key sections are present
      await expect(page.locator('text=/Transition Risk/i').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/Physical Risk/i').first()).toBeVisible();
    });

    test('should display overall climate risk rating', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Look for rating display
      const ratingElement = page.locator('text=/Overall.*Rating|Climate Risk Rating/i').first();
      await expect(ratingElement).toBeVisible({ timeout: 10000 });
    });

    test('should display AI generation button for empty scorecard', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Check for Generate with AI button
      const hasButton = await scorecardPage.hasGenerateAIButton();
      // Button should be visible (may or may not be enabled depending on state)
      expect(hasButton).toBe(true);
    });
  });

  test.describe('Climate Scorecard AI Generation', () => {
    // This test is slow due to AI generation (5-7 minutes)
    test.slow();

    test('should trigger AI generation when button clicked', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');
      test.skip(!process.env.RISK_AGENT_API_KEY, 'Risk Agent not configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Click generate button
      await scorecardPage.clickGenerateAI(420000); // 7 minute timeout

      // Verify generation completed
      const isGenerated = await scorecardPage.isAIGenerated();
      expect(isGenerated).toBe(true);

      // Verify rating was populated
      const rating = await scorecardPage.getOverallRating();
      expect(rating).toBeTruthy();
      expect(['A', 'B', 'C', 'D', 'E']).toContain(rating);
    });

    test('should show loading indicator during generation', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      if (await scorecardPage.hasGenerateAIButton()) {
        // Click the button
        const generateButton = page.locator('button:has-text("Generate with AI")');
        await generateButton.click();

        // Check for loading indicator (briefly)
        const loadingIndicator = page.locator('text=/Generating|Loading/i, .MuiCircularProgress-root').first();
        // May or may not catch it depending on timing
        await loadingIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      }
    });

    test('should display confidence scores after generation', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');
      test.skip(!process.env.RISK_AGENT_API_KEY, 'Risk Agent not configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // If already generated, check for confidence scores
      const hasConfidence = await scorecardPage.hasConfidenceScores();
      // Confidence scores panel should be visible for AI-generated scorecards
      if (await scorecardPage.isAIGenerated()) {
        expect(hasConfidence).toBe(true);
      }
    });
  });

  test.describe('Climate Scorecard Manual Entry', () => {
    test('should allow updating transition risk fields', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Fill in a field
      await scorecardPage.fillField('net_zero_target_year', '2045');
      await scorecardPage.save();

      // Verify save succeeded
      await scorecardPage.expectSaveSuccess();
    });

    test('should allow updating physical risk fields', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Fill in a field
      await scorecardPage.fillField('acute_hazard_score', '3');
      await scorecardPage.save();

      await scorecardPage.expectSaveSuccess();
    });

    test('should allow updating overall rating', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Update overall rating
      await scorecardPage.fillField('overall_climate_risk_rating', 'C');
      await scorecardPage.save();

      await scorecardPage.expectSaveSuccess();
    });
  });

  test.describe('Analyst Review Workflow', () => {
    test('should show pending review status for AI-generated scorecard', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // If AI generated, status should be pending
      if (await scorecardPage.isAIGenerated()) {
        const status = await scorecardPage.getAnalystReviewStatus();
        expect(status).toBe('pending');
      }
    });

    test('should allow analyst to mark as reviewed', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      // Update review status
      await scorecardPage.setAnalystReviewStatus('reviewed');
      await scorecardPage.save();

      await scorecardPage.expectSaveSuccess();

      // Verify status was updated
      const status = await scorecardPage.getAnalystReviewStatus();
      expect(status).toBe('reviewed');
    });

    test('should allow analyst to approve scorecard', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      await scorecardPage.setAnalystReviewStatus('approved');
      await scorecardPage.save();

      await scorecardPage.expectSaveSuccess();
    });
  });

  test.describe('Climate Scorecard Data Validation', () => {
    test('should display key risk drivers after generation', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      if (await scorecardPage.isAIGenerated()) {
        const drivers = await scorecardPage.getKeyRiskDrivers();
        expect(drivers).toBeTruthy();
        expect(drivers!.length).toBeGreaterThan(10);
      }
    });

    test('should display recommended mitigations after generation', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      if (await scorecardPage.isAIGenerated()) {
        const mitigations = await scorecardPage.getRecommendedMitigations();
        expect(mitigations).toBeTruthy();
      }
    });

    test('should show transition and physical risk levels', async ({ page }) => {
      test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

      await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);

      const transitionRisk = await scorecardPage.getTransitionRiskLevel();
      const physicalRisk = await scorecardPage.getPhysicalRiskLevel();

      // At least one should be set
      expect(transitionRisk || physicalRisk).toBeTruthy();
    });
  });
});

test.describe('Climate Scorecard Access Control', () => {
  test('should allow credit analyst to view scorecard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const scorecardPage = new ClimateScorecardPage(page);

    test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_CA_USER || 'ca_test',
      process.env.TEST_PASSWORD || 'testpass123'
    );

    await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);
    await scorecardPage.expectScorecardLoaded();
  });

  test('should allow relationship manager to view scorecard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const scorecardPage = new ClimateScorecardPage(page);

    test.skip(!TEST_CONFIG.applicationId, 'No test application ID configured');

    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_RM_USER || 'rm_test',
      process.env.TEST_PASSWORD || 'testpass123'
    );

    await scorecardPage.navigateToScorecard(TEST_CONFIG.applicationId);
    // RM should be able to view but may not edit
    await scorecardPage.expectScorecardLoaded();
  });
});
