import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WorkflowActionsComponent } from './workflow-actions.component';

/**
 * Form names that correspond to sub-processes in the workflow.
 * These are displayed as sub-process cards with "View" buttons.
 */
export type FormTabName =
  | 'Credit Request'
  | 'Credit Request Form'
  | 'Credit Review'
  | 'Credit Review Form'
  | 'Business Sponsorship'
  | 'Business Sponsorship Form'
  | 'Legal Review'
  | 'Legal Review Form'
  | 'Credit Questionnaire'
  | 'Credit Questionnaire Form'
  | 'Credit Analysis'
  | 'Credit Analysis Form'
  | 'Credit Compilation'
  | 'Credit Compilation Form'
  | 'Credit Paper'
  | 'Credit Approval'
  | 'Credit Approval Form';

/**
 * Generic Form Page Object.
 *
 * Handles navigation to any form tab within an application
 * and provides access to the WorkflowActionsComponent for transitions.
 * This allows testing the complete workflow without creating
 * separate page objects for each form type.
 */
export class GenericFormPage extends BasePage {
  readonly workflowActions: WorkflowActionsComponent;

  constructor(page: Page) {
    super(page);
    this.workflowActions = new WorkflowActionsComponent(page);
  }

  /**
   * Navigate to an application's edit page for a specific form.
   * Uses the details page to ensure the form exists before navigating.
   * @param applicationId The application UUID
   * @param formType Form type to navigate to (e.g., 'CreditRequestForm', 'CreditReviewForm')
   */
  async navigateToApplication(applicationId: string, formType?: string) {
    if (!formType) {
      // If no form type specified, just go to the default edit page
      await this.goto(`/credit-requests/${applicationId}/edit`);
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });
      await this.waitForLoadingToComplete();
      await this.page.waitForSelector('form, h1, h2, .MuiContainer-root', { timeout: 15000 });
      return;
    }

    // Navigate to details page first to see available sub-processes
    await this.navigateToDetails(applicationId);

    // Get the display name for the form type (e.g., 'CreditRequestForm' -> 'Credit Request Form')
    const formDisplayName = this.getFormDisplayName(formType);
    console.log(`Looking for sub-process: ${formDisplayName}`);

    // Check if the sub-process exists in the list
    const subProcessExists = await this.waitForSubProcess(formDisplayName, 15000);

    if (subProcessExists) {
      // Click the Edit/View button for this sub-process
      await this.clickSubProcessButton(formDisplayName);
    } else {
      // Form doesn't exist yet - navigate directly and see what happens
      console.log(`Sub-process ${formDisplayName} not found in details, navigating directly`);
      await this.goto(`/credit-requests/${applicationId}/edit?form_type=${formType}`);
    }

    // Wait for the form page to load
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.waitForLoadingToComplete();
    await this.page.waitForSelector('form, h1, h2, .MuiContainer-root', { timeout: 15000 });
  }

  /**
   * Navigate to application details page (overview with workflow status).
   */
  async navigateToDetails(applicationId: string) {
    await this.goto(`/credit-requests/${applicationId}/details`);
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.waitForLoadingToComplete();
    await this.page.waitForSelector('.MuiContainer-root, h1, h2', { timeout: 15000 });
  }

  /**
   * Convert form type to display name (e.g., 'CreditRequestForm' -> 'Credit Request Form')
   */
  private getFormDisplayName(formType: string): string {
    // Remove 'Form' suffix and add spaces before capitals
    const name = formType.replace('Form', '');
    return name.replace(/([A-Z])/g, ' $1').trim() + ' Form';
  }

  /**
   * Wait for a sub-process to appear in the details page.
   */
  async waitForSubProcess(formDisplayName: string, timeout: number = 15000): Promise<boolean> {
    const startTime = Date.now();
    let refreshCount = 0;
    while (Date.now() - startTime < timeout) {
      const subProcessLocator = this.page.locator(`text="${formDisplayName}"`).first();
      if (await subProcessLocator.isVisible().catch(() => false)) {
        // Also log the sub-process status if visible
        const listItem = this.page.locator(`li:has-text("${formDisplayName}")`).first();
        if (await listItem.isVisible()) {
          const statusText = await listItem.locator('text=/Status:.*/')
            .first()
            .textContent()
            .catch(() => 'Unknown');
          console.log(`Found sub-process ${formDisplayName} with status: ${statusText}`);
        }
        return true;
      }
      // Log parent workflow status
      const parentStatus = await this.getParentWorkflowState();
      console.log(`Parent workflow state: ${parentStatus} (refresh ${++refreshCount})`);

      // Refresh the page to check for newly created sub-processes
      await this.page.waitForTimeout(2000);
      await this.page.reload();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    return false;
  }

  /**
   * Click the Edit/View button for a specific sub-process.
   */
  async clickSubProcessButton(formDisplayName: string) {
    // Find the list item containing the form name
    const listItem = this.page.locator(`li:has-text("${formDisplayName}")`).first();

    if (await listItem.isVisible()) {
      // Click the button within this list item (Edit or View)
      const button = listItem.locator('button').first();
      await button.click();
    } else {
      // Try finding by direct text match
      const formText = this.page.locator(`text="${formDisplayName}"`).first();
      if (await formText.isVisible()) {
        // Find nearby button
        const container = this.page.locator(`div:has(text="${formDisplayName}")`).first();
        const button = container.locator('button').first();
        if (await button.isVisible()) {
          await button.click();
        }
      }
    }
  }

  /**
   * Get the current parent workflow state from the details page.
   */
  async getParentWorkflowState(): Promise<string | null> {
    // The status is shown as "Status: STATE_NAME"
    const statusLocator = this.page.locator('text=/Status:.*/')
      .first();
    if (await statusLocator.isVisible()) {
      const text = await statusLocator.textContent();
      const match = text?.match(/Status:\s*(.+)/);
      return match ? match[1].trim() : null;
    }
    return null;
  }

  /**
   * Select a specific form/sub-process within the application.
   * The UI displays sub-processes as cards with "View" buttons.
   * This method finds the sub-process card and clicks its View button.
   */
  async selectFormTab(tabName: FormTabName) {
    // Normalize the tab name to handle variations (e.g., "Credit Request" vs "Credit Request Form")
    const normalizedName = tabName.replace(' Form', '');

    // First, try to find a sub-process card with this name and click its View button
    // The card structure has the form name as text and a View button
    const subProcessCard = this.page.locator(`text="${normalizedName}"`).first();
    if (await subProcessCard.isVisible()) {
      // Find the View button in the same row/card
      const viewButton = this.page.locator(`text="${normalizedName}" >> xpath=ancestor::*[contains(@class, "MuiCard") or contains(@class, "MuiPaper") or self::div[.//button]]//button:has-text("View")`);
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await this.waitForFormReady();
        return;
      }

      // Alternative: Find View button that's a sibling or nearby
      const nearbyViewButton = this.page.locator(`text="${normalizedName} Form" >> xpath=following::button[contains(text(), "View")][1]`);
      if (await nearbyViewButton.isVisible()) {
        await nearbyViewButton.click();
        await this.waitForFormReady();
        return;
      }
    }

    // Try clicking a View button directly after the form name text
    const formNameWithView = this.page.locator(`div:has-text("${normalizedName} Form") button:has-text("View")`).first();
    if (await formNameWithView.isVisible()) {
      await formNameWithView.click();
      await this.waitForFormReady();
      return;
    }

    // Try finding the card by looking for the sub-process section
    const subProcessSection = this.page.locator('text=Sub-Processes').first();
    if (await subProcessSection.isVisible()) {
      // Find the specific form within sub-processes
      const formCard = this.page.locator(`text="${normalizedName} Form"`).first();
      if (await formCard.isVisible()) {
        // Click the View button in the same parent container
        const container = this.page.locator(`div:has(text="${normalizedName} Form")`).first();
        const viewBtn = container.locator('button:has-text("View")').first();
        if (await viewBtn.isVisible()) {
          await viewBtn.click();
          await this.waitForFormReady();
          return;
        }
      }
    }

    // Try workflow stepper - click on the phase step
    const stepperStep = this.page.locator(`text="${normalizedName}"`).first();
    if (await stepperStep.isVisible()) {
      await stepperStep.click();
      await this.page.waitForTimeout(1000);
      // After clicking a step, look for View button in the updated sub-processes
      const viewButton = this.page.locator('button:has-text("View")').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await this.waitForFormReady();
        return;
      }
    }

    // Last resort: Find any View button and click it
    console.log(`Looking for any View button for "${tabName}"`);
    const anyViewButton = this.page.locator('button:has-text("View")').first();
    if (await anyViewButton.isVisible()) {
      await anyViewButton.click();
      await this.waitForFormReady();
      return;
    }

    throw new Error(`Could not find tab/link for "${tabName}"`);
  }

  /**
   * Wait for the form to be ready after navigation.
   */
  async waitForFormReady() {
    await this.waitForLoadingToComplete();
    // Wait a moment for React to render
    await this.page.waitForTimeout(500);
    // Wait for workflow actions to be visible (indicates form is loaded)
    try {
      await this.page.waitForSelector('text=Workflow Actions', { timeout: 10000 });
    } catch {
      // Form might not have workflow actions visible yet
      console.log('Workflow Actions not immediately visible');
    }
  }

  /**
   * Check if a specific form tab is available.
   */
  async hasFormTab(tabName: FormTabName): Promise<boolean> {
    const selectors = [
      `[role="tab"]:has-text("${tabName}")`,
      `nav a:has-text("${tabName}")`,
      `text="${tabName}"`,
    ];

    for (const selector of selectors) {
      if (await this.page.locator(selector).first().isVisible()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the current workflow state from the form.
   */
  async getCurrentState(): Promise<string | null> {
    return await this.workflowActions.getCurrentState();
  }

  /**
   * Perform a workflow transition by name.
   */
  async performTransition(transitionName: string, comments?: string) {
    await this.workflowActions.performTransition(transitionName, comments);
  }

  /**
   * Check if a transition is available.
   */
  async hasTransition(transitionName: string): Promise<boolean> {
    return await this.workflowActions.hasTransition(transitionName);
  }

  /**
   * Get all available transitions.
   */
  async getAvailableTransitions(): Promise<string[]> {
    return await this.workflowActions.getTransitionButtons();
  }

  /**
   * Check if workflow actions section is visible.
   */
  async hasWorkflowActions(): Promise<boolean> {
    return await this.workflowActions.isVisible();
  }

  /**
   * Verify no error occurred after a transition.
   */
  async expectNoError() {
    const hasError = await this.workflowActions.hasError();
    if (hasError) {
      const errorMessage = await this.workflowActions.getErrorMessage();
      throw new Error(`Workflow error: ${errorMessage}`);
    }
  }

  /**
   * Complete a form phase by transitioning from Draft -> In Progress -> Submitted.
   * This is the standard transition pattern for most forms.
   *
   * @param options Optional configuration
   * @param options.inProgressTransition Name of the "In Progress" transition (varies by form)
   * @param options.submitTransition Name of the "Submit" transition (varies by form)
   * @param options.comments Comments to add with the submit transition
   */
  async completePhase(options?: {
    inProgressTransition?: string;
    submitTransition?: string;
    comments?: string;
  }) {
    const inProgressName = options?.inProgressTransition || 'Submit for In Progress';
    const submitName = options?.submitTransition || 'Submit';
    const comments = options?.comments || 'E2E Test - Phase completion';

    // Check available transitions
    let transitions = await this.getAvailableTransitions();
    console.log('Available transitions:', transitions);

    // Check current state
    const initialState = await this.getCurrentState();
    console.log('Current state:', initialState);

    // Transition names that move to "In Progress"
    const inProgressOptions = [
      inProgressName,
      'Submit for In Progress',
      'Update Credit Paper',
      'In Progress',
      'Move to In Progress',
    ];

    // Transition names that submit/complete the form
    const submitOptions = [
      submitName,
      'Submit',
      'Submit for Review',
      'Complete',
      'Submit Credit Paper',
    ];

    // Check if we need to do the in-progress transition
    // Skip if state already contains "IN_PROGRESS"
    const alreadyInProgress = initialState?.includes('IN_PROGRESS') || false;

    let usedTransition: string | null = null;

    if (!alreadyInProgress) {
      // First transition: Draft -> In Progress
      for (const transitionName of inProgressOptions) {
        if (await this.hasTransition(transitionName)) {
          console.log(`Performing transition: ${transitionName}`);
          await this.performTransition(transitionName);

          // Check for error
          if (await this.workflowActions.hasError()) {
            const errorMessage = await this.workflowActions.getErrorMessage();
            console.log(`Transition error: ${errorMessage}`);
            // Clear error by refreshing
            await this.page.reload();
            await this.waitForFormReady();
          } else {
            usedTransition = transitionName;
          }
          break;
        }
      }

      // Wait for page to update with new transitions
      await this.page.waitForTimeout(1000);

      // Refresh to get updated transitions
      await this.page.reload();
      await this.waitForFormReady();
    }

    // Get updated transitions after state change
    transitions = await this.getAvailableTransitions();
    console.log('Transitions after in-progress:', transitions);

    // Second transition: In Progress -> Submitted
    for (const transitionName of submitOptions) {
      // Don't repeat the same transition we just did
      if (transitionName === usedTransition) continue;

      if (await this.hasTransition(transitionName)) {
        console.log(`Performing transition: ${transitionName}`);
        await this.performTransition(transitionName, comments);
        await this.expectNoError();
        return;
      }
    }

    // If no submit transition found, try any transition that's not Save as Draft
    // and not the one we already used
    console.log('No standard submit transition found, trying alternatives...');
    for (const transition of transitions) {
      if (transition.toLowerCase().includes('draft')) continue;
      if (transition === usedTransition) continue;

      console.log(`Trying alternative transition: ${transition}`);
      await this.performTransition(transition, comments);
      await this.expectNoError();
      return;
    }

    // Log current state for debugging
    const finalState = await this.getCurrentState();
    console.log('Final state:', finalState);
  }
}
