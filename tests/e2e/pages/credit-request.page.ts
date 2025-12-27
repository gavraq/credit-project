import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WorkflowActionsComponent } from './workflow-actions.component';

/**
 * Credit Request Form Page Object Model.
 *
 * Phase 1 of the credit workflow - initial application submission.
 * Form uses custom FormField components which render native HTML elements.
 */
export class CreditRequestPage extends BasePage {
  readonly workflowActions: WorkflowActionsComponent;

  constructor(page: Page) {
    super(page);
    this.workflowActions = new WorkflowActionsComponent(page);
  }

  /**
   * Navigate to create new credit request.
   */
  async navigateToNew() {
    await this.goto('/credit-requests/new');
    await this.waitForLoadingToComplete();
  }

  /**
   * Navigate to existing credit request by application ID.
   */
  async navigateToExisting(applicationId: string) {
    await this.goto(`/credit-requests/${applicationId}/edit`);
    await this.waitForLoadingToComplete();
  }

  /**
   * Fill in the application title.
   * The form field has placeholder "Enter a title for this credit request"
   */
  async enterTitle(title: string) {
    const titleInput = this.page.getByPlaceholder('Enter a title for this credit request');
    await titleInput.click();
    await titleInput.fill(title);
  }

  /**
   * Select a counterparty from the dropdown.
   * The form uses a native select element with label "Counterparty Name"
   */
  async selectCounterparty(counterpartyName: string) {
    // Wait for counterparties to load (the select has loading state)
    await this.page.waitForSelector('select', { timeout: 10000 });

    // Find the select by looking for the label "Counterparty Name" and its sibling select
    const counterpartySelect = this.page.locator('label:has-text("Counterparty Name") + select, label:has-text("Counterparty Name") ~ select').first();

    if (await counterpartySelect.isVisible()) {
      // Select by label text (the option's visible text)
      await counterpartySelect.selectOption({ label: counterpartyName });
    } else {
      // Fallback: find select that has the counterparty options
      const selects = this.page.locator('select');
      const count = await selects.count();
      for (let i = 0; i < count; i++) {
        const select = selects.nth(i);
        const options = await select.locator('option').allTextContents();
        if (options.some(opt => opt.includes(counterpartyName))) {
          await select.selectOption({ label: counterpartyName });
          break;
        }
      }
    }
  }

  /**
   * Select a counterparty by value (UUID).
   */
  async selectCounterpartyByValue(counterpartyId: string) {
    const counterpartySelect = this.page.locator('select').first();
    await counterpartySelect.selectOption({ value: counterpartyId });
  }

  /**
   * Get available counterparty options.
   */
  async getCounterpartyOptions(): Promise<string[]> {
    const counterpartySelect = this.page.locator('select').first();
    const options = await counterpartySelect.locator('option').allTextContents();
    return options.filter(opt => opt !== 'Select counterparty...');
  }

  /**
   * Set priority (Medium, High, etc.)
   */
  async setPriority(priority: string) {
    const prioritySelect = this.page.locator('label:has-text("Priority") + select, label:has-text("Priority") ~ select');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption({ label: priority });
    }
  }

  /**
   * Navigate to a specific form section by clicking on the tab.
   * Section indices: 0=Overview, 1=Counterparty, 2=Limits, 3=Relationship, 4=Prioritisation, 5=Documents
   */
  async navigateToSection(sectionIndex: number) {
    // The form uses MUI Tabs - click on the tab at the given index
    const tabs = this.page.locator('.MuiTab-root, [role="tab"]');
    const count = await tabs.count();
    console.log(`Found ${count} tabs, clicking tab ${sectionIndex}`);

    if (sectionIndex < count) {
      await tabs.nth(sectionIndex).click();
      await this.page.waitForTimeout(500); // Wait for section to render
    } else {
      console.log(`Tab index ${sectionIndex} not found, only ${count} tabs exist`);
    }
  }

  /**
   * Select a senior business sponsor from the dropdown.
   * This field is on the Prioritisation section (section 4).
   * @param sponsorLabel The label shown in the dropdown (e.g., "Mike Brown (mike.brown)")
   */
  async selectSeniorBusinessSponsor(sponsorLabel: string) {
    // Navigate to Prioritisation section (index 4)
    await this.navigateToSection(4);

    // Wait for business sponsors to load
    await this.page.waitForFunction(
      () => {
        // Check if loading message is gone and select has options
        const loading = document.body.textContent?.includes('Loading business sponsors');
        const error = document.body.textContent?.includes('Error loading business sponsors');
        if (loading || error) return false;
        const select = document.querySelector('label[class*="Senior Business Sponsor"] ~ select, select');
        return select !== null;
      },
      { timeout: 15000 }
    );

    // Find the Senior Business Sponsor select by label
    const sponsorSelect = this.page.locator('label:has-text("Senior Business Sponsor") ~ select').first();

    if (await sponsorSelect.isVisible()) {
      await sponsorSelect.selectOption({ label: sponsorLabel });
    } else {
      // Fallback: find select with the sponsor option
      const selects = this.page.locator('select');
      const count = await selects.count();
      for (let i = 0; i < count; i++) {
        const select = selects.nth(i);
        const options = await select.locator('option').allTextContents();
        if (options.some(opt => opt.includes(sponsorLabel))) {
          await select.selectOption({ label: sponsorLabel });
          console.log(`Selected sponsor ${sponsorLabel} from select index ${i}`);
          break;
        }
      }
    }
  }

  /**
   * Fill in all required fields for a basic credit request.
   */
  async fillBasicForm(data: {
    title: string;
    counterparty?: string;
    priority?: string;
  }) {
    // Fill title first
    await this.enterTitle(data.title);

    // Select counterparty if provided
    if (data.counterparty) {
      await this.selectCounterparty(data.counterparty);
    }

    // Set priority if provided
    if (data.priority) {
      await this.setPriority(data.priority);
    }
  }

  /**
   * Submit the form as draft (for new forms).
   * For new forms, the button shows "Save as Draft"
   * After successful save, the app redirects to the dashboard.
   */
  async saveAsDraft() {
    await this.workflowActions.clickSaveDraft();

    // Wait for either success (redirect to dashboard) or error display
    const result = await Promise.race([
      // Success: redirect to dashboard (URL ends with just /) or application page
      this.page.waitForURL(/\/$|\/credit-requests\/[a-f0-9-]+/, { timeout: 30000 })
        .then(() => ({ success: true, error: null })),
      // Error: alert displayed
      this.page.waitForSelector('[role="alert"], .MuiAlert-root', { timeout: 30000 })
        .then(async () => {
          const errorText = await this.page.locator('[role="alert"], .MuiAlert-root').textContent();
          return { success: false, error: errorText };
        })
    ]);

    if (!result.success) {
      throw new Error(`Form submission failed: ${result.error}`);
    }
  }

  /**
   * Move to In Progress state.
   */
  async submitForInProgress() {
    // Look for the transition button that moves to in progress
    const hasInProgress = await this.workflowActions.hasTransition('In Progress');
    if (hasInProgress) {
      await this.workflowActions.performTransition('In Progress');
    }
  }

  /**
   * Perform final submission.
   */
  async submit(comments?: string) {
    await this.workflowActions.clickSubmit(comments);
  }

  /**
   * Check if form is loaded.
   */
  async isLoaded(): Promise<boolean> {
    const titleInput = this.page.getByPlaceholder('Enter a title for this credit request');
    return await titleInput.isVisible();
  }

  /**
   * Get the current form title.
   */
  async getTitle(): Promise<string | null> {
    const titleInput = this.page.getByPlaceholder('Enter a title for this credit request');
    return await titleInput.inputValue();
  }

  /**
   * Wait for page to be ready.
   */
  async waitForReady() {
    // Wait for form to load
    await this.page.getByPlaceholder('Enter a title for this credit request').waitFor({ timeout: 10000 });
  }
}
