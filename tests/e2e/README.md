# E2E Testing - Credit Risk Workflow

End-to-end tests for the Credit Risk Workflow application using Playwright.

## Overview

These tests verify the complete credit application lifecycle from submission through final approval, covering all 6 workflow phases with proper role switching.

## Project Structure

```
tests/e2e/
├── fixtures/
│   └── users.json          # Test user credentials by role
├── pages/                   # Page Object Models
│   ├── base.page.ts        # Base page with common functionality
│   ├── dashboard.page.ts   # Dashboard page interactions
│   ├── credit-request.page.ts  # Credit request form (Phase 1)
│   ├── generic-form.page.ts    # Generic form handler for all phases
│   ├── login.page.ts       # Login page
│   └── workflow-actions.component.ts  # Workflow actions component
├── tests/
│   ├── auth.setup.ts       # Authentication setup project
│   └── workflows/
│       ├── full-workflow-journey.spec.ts  # Complete 6-phase workflow test
│       └── complete-workflow.spec.ts      # Additional workflow tests
├── utils/
│   └── auth-helpers.ts     # Role switching utilities
├── playwright/
│   └── .auth/user.json     # Cached auth state
├── playwright.config.ts    # Playwright configuration
└── README.md
```

## Workflow Phases Tested

| Phase | Form | Role | Description |
|-------|------|------|-------------|
| 1 | Credit Request | Relationship Manager | Initial application submission |
| 2 | Credit Review | Credit Analyst | Initial credit review |
| 3 | Business Sponsorship | Business Sponsor | Sponsor approval |
| 4a | Legal Review | Legal Reviewer | Legal documentation review |
| 4b | Credit Questionnaire | Relationship Manager | Additional questionnaire |
| 4c | Credit Analysis | Credit Analyst | Detailed credit analysis |
| 5 | Credit Compilation | Credit Analyst | Compile credit paper |
| 6 | Credit Approval | Credit Analyst | Final approval decision |

## Running Tests

### Prerequisites

```bash
cd tests/e2e
npm install
npx playwright install
```

### Run All E2E Tests

```bash
npx playwright test
```

### Run Full Workflow Test Only

```bash
# Chromium only
npx playwright test --project=chromium --grep "complete workflow from start"

# All browsers
npx playwright test --grep "complete workflow from start"
```

### Run with UI Mode (Debug)

```bash
npx playwright test --ui
```

### Run with Trace (for debugging failures)

```bash
npx playwright test --trace=on
```

### View Test Report

```bash
npx playwright show-report ../reports/e2e/html
```

## Test Architecture

### Page Object Model

Tests use the Page Object Model pattern for maintainability:

- **BasePage**: Common navigation, waiting, and utility methods
- **DashboardPage**: Dashboard interactions, creating new applications
- **CreditRequestPage**: Phase 1 form with counterparty selection, sponsor assignment
- **GenericFormPage**: Handles all workflow form phases with tab navigation
- **WorkflowActionsComponent**: Shared workflow transition buttons and state management

### Authentication

- Auth is handled by a setup project (`auth.setup.ts`) that runs before tests
- Cached auth state is stored in `playwright/.auth/user.json`
- Role switching uses `loginAsRole()` from `utils/auth-helpers.ts`

### Test Users

Test users are defined in `fixtures/users.json`:

| Role | Username | Description |
|------|----------|-------------|
| relationship_manager | jane.smith | Creates applications, Phase 1, 4b |
| credit_analyst | john.doe | Phases 2, 4c, 5, 6 |
| business_sponsor | mike.brown | Phase 3 |
| legal_reviewer | sarah.wilson | Phase 4a |

## Key Implementation Details

### Sponsor Assignment

For Phase 3 (Business Sponsorship) to work, the senior business sponsor must be set during Phase 1:

```typescript
await creditRequestPage.selectSeniorBusinessSponsor('Mike Brown (mike.brown)');
```

### Workflow Transitions

Each phase follows the pattern:
1. Navigate to form
2. Click "Submit for In Progress" (Draft → In Progress)
3. Click "Submit" (In Progress → Submitted)

The `GenericFormPage.completePhase()` method handles this automatically.

### Error Handling

Tests check for backend errors after each transition:

```typescript
await genericFormPage.expectNoError();
```

## Configuration

### Environment Variables

Tests target the production API:
- **Base URL**: `https://credit.gavinslater.co.uk`

### Timeouts

- Default test timeout: 30 seconds
- Full workflow test timeout: 5 minutes (300 seconds)
- Navigation timeout: 30 seconds

### Browsers

Tests run on:
- Chromium (primary)
- Firefox
- WebKit (Safari)

## Troubleshooting

### "Available transitions: []"

If no transitions appear, check:
1. User has correct role for the current phase
2. Workflow instance is properly attached to the form
3. Previous phase completed successfully

### NOT NULL Constraint Errors

If you see database constraint errors, the form model may need `null=True` on text fields. Check migrations 0024-0027.

### Timeout on networkidle

Dashboard pages with polling can timeout on `networkidle`. Use `domcontentloaded` instead.

## Reports

Test reports are generated in:
- `../reports/e2e/html/` - HTML report
- `../reports/e2e/test-results/` - Screenshots, videos, traces
