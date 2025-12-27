# Credit Risk Workflow Test Harness

Comprehensive test suite for the Credit Risk Workflow System, including API integration tests and E2E browser automation tests.

## Overview

This test harness provides:
- **API Integration Tests** (pytest) - Fast, reliable workflow testing at the API level
- **E2E Browser Tests** (Playwright) - Full UI automation testing across all browsers

## Quick Start

### API Tests

```bash
# Navigate to tests directory
cd /Users/gavinslater/projects/credit-project/tests

# Create virtual environment with UV
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -e .

# Copy and configure environment
cp .env.example .env
# Edit .env with your test credentials

# Run all API tests
pytest api -v

# Run smoke tests only
pytest api -m smoke

# Run specific phase tests
pytest api -m phase1 -v

# Run with parallel execution
pytest api -n 4
```

### E2E Tests

```bash
# Navigate to E2E directory
cd /Users/gavinslater/projects/credit-project/tests/e2e

# Install dependencies
npm install

# Install browsers
npx playwright install

# Run all E2E tests
npx playwright test

# Run in headed mode (visible browser)
npx playwright test --headed

# Run interactive UI mode
npx playwright test --ui

# Run specific browser only
npx playwright test --project=chromium

# Generate test code with codegen
npm run codegen

# View test report
npm run report
```

## Directory Structure

```
tests/
├── pyproject.toml          # Python dependencies (UV managed)
├── conftest.py             # Root pytest configuration
├── .env.example            # Environment template
├── README.md               # This file
│
├── api/                    # API Integration Tests
│   ├── conftest.py        # API fixtures (role-based clients)
│   ├── utils/
│   │   ├── api_client.py  # JWT-authenticated HTTP client
│   │   └── factories.py   # Test data factories
│   ├── test_auth.py       # Authentication tests
│   ├── test_credit_applications.py
│   ├── test_workflow_transitions.py
│   └── test_full_workflow.py
│
├── e2e/                    # Playwright E2E Tests
│   ├── playwright.config.ts
│   ├── package.json
│   ├── fixtures/
│   │   └── users.json     # Test user credentials
│   ├── pages/             # Page Object Models
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── credit-request.page.ts
│   │   └── workflow-actions.component.ts
│   └── tests/
│       ├── auth.setup.ts
│       └── workflows/
│           └── full-workflow-journey.spec.ts
│
└── reports/                # Generated test reports
    ├── api/
    └── e2e/
```

## Test Configuration

### Environment Variables

Create a `.env` file in the tests directory:

```env
# API Base URL
TEST_API_URL=https://credit.gavinslater.co.uk

# Default password for all test users
TEST_PASSWORD=testpass123

# Test User Credentials
TEST_RM_USER=rm_test
TEST_CA_USER=ca_test
TEST_BS_USER=bs_test
TEST_LR_USER=lr_test
TEST_APPROVER_USER=approver_test
```

### Test Users Required

The following test users must exist in the target system:

| Role | Username | Purpose |
|------|----------|---------|
| Relationship Manager | rm_test | Credit Request, Questionnaire |
| Credit Analyst | ca_test | Credit Review, Analysis, Compilation, Approval |
| Business Sponsor | bs_test | Business Sponsorship |
| Legal Reviewer | lr_test | Legal Review |
| Credit Approver | approver_test | Final Approval |

## Test Markers

API tests support these pytest markers:

```bash
# Smoke tests - basic connectivity
pytest api -m smoke

# Workflow phase tests
pytest api -m phase1  # Credit Request
pytest api -m phase2  # Credit Review
pytest api -m phase3  # Business Sponsorship
pytest api -m phase4  # Analysis Phase
pytest api -m phase5  # Credit Compilation
pytest api -m phase6  # Credit Approval

# Role-based access control tests
pytest api -m rbac

# Full workflow tests
pytest api -m workflow
```

## Workflow Phases Tested

### Phase 1: Credit Request
- RM creates credit application
- Transitions: CR_TR_1 → CR_TR_2 → CR_TR_4
- States: Draft → In Progress → Submitted

### Phase 2: Credit Review
- CA reviews credit application
- Transitions: CRV_TR_1 → CRV_TR_2 → CRV_TR_4
- States: Draft → In Progress → Submitted

### Phase 3: Business Sponsorship
- BS provides sponsorship
- Transitions: BS_TR_1 → BS_TR_2 → BS_TR_4
- States: Draft → In Progress → Submitted

### Phase 4: Analysis (Parallel)
- Legal Review (LR)
- Credit Questionnaire (RM)
- Credit Analysis (CA)
- All three must complete before Phase 5

### Phase 5: Credit Compilation
- CA compiles credit paper
- Transitions: CC_TR_1 → CC_TR_2 → CC_TR_4

### Phase 6: Credit Approval
- CA/Approver approves or rejects
- Transitions: CAP_TR_1 → CAP_TR_2 → CAP_TR_4
- Final states: APPROVED or REJECTED

## Troubleshooting

### API Tests

**Authentication failures:**
```bash
# Check that test users exist and passwords are correct
pytest api/test_auth.py::TestSmoke -v
```

**Missing reference data:**
```bash
# Tests may skip if no counterparties or limit types exist
pytest api -v --tb=short | grep -i skip
```

### E2E Tests

**Browser not found:**
```bash
npx playwright install
```

**Test timeouts:**
```bash
# Increase timeout in playwright.config.ts
# Or run with debug mode
npx playwright test --debug
```

**Screenshots on failure:**
Check `tests/reports/e2e/test-results/` for failure screenshots.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: |
          cd tests
          uv venv
          source .venv/bin/activate
          uv pip install -e .
          pytest api -v --tb=short

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: |
          cd tests/e2e
          npm ci
          npx playwright install --with-deps
          npx playwright test
```

## Writing New Tests

### API Test Example

```python
@pytest.mark.phase1
def test_my_new_test(rm_client: APIClient, credit_application_data: Dict):
    """Test description."""
    app = rm_client.create_credit_application(credit_application_data)
    assert 'id' in app
```

### E2E Test Example

```typescript
test('my new e2e test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAndWait(users.rm.username, users.rm.password);
  // ... test steps
});
```
