# Credit Risk Workflow UI Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Design Brief Foundation](#design-brief-foundation)
3. [UI Architecture](#ui-architecture)
4. [Common Components](#common-components)
5. [Form Implementation](#form-implementation)
6. [Navigation System](#navigation-system)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Code Organization](#code-organization)

## Overview

The Credit Risk Workflow System is a comprehensive web application for managing credit applications through various stages of approval. The UI implementation follows a modern, component-based architecture using React with Material-UI, adhering to the ICBC + Standard Bank design system.

## Design Brief Foundation

### Core Design Principles

The UI implementation is based on the **Credit Workflow Design Brief** (`/requirements/Credit Workflow Design Brief.md`), which establishes:

#### 1. **Brand Colors**
```javascript
// Primary brand colors
const colors = {
  icbcRed: '#e31937',        // ICBC Red
  standardBankBlue: '#0c4da2', // Standard Bank Blue
  redLight: '#fde8eb',       // Light red for backgrounds
  blueLight: '#e6edf7',      // Light blue for backgrounds
}
```

#### 2. **Typography**
- **Font Family**: Inter (primary), with system font fallbacks
- **Font Sizes**: 
  - Headings: 2rem (32px) to 1.25rem (20px)
  - Body text: 0.875rem (14px) to 1rem (16px)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semi-bold)

#### 3. **Spacing System**
- Base unit: 4px
- Common spacings: 8px, 12px, 16px, 24px, 32px, 48px
- Consistent padding: 48px (3rem) for page-level margins

#### 4. **Component Specifications**
- **Buttons**: 38px height, 6px border radius
- **Form fields**: Consistent styling with Material-UI
- **Cards**: White background with subtle shadows
- **Sections**: Clear visual hierarchy with proper spacing

### Material-UI Theme Configuration

The design system is implemented through a custom Material-UI theme (`/frontend/src/theme.js`):

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#0c4da2',     // Standard Bank Blue
      light: '#e6edf7',    // Blue Light
      dark: '#0b4491',     // Hover variant
    },
    secondary: {
      main: '#e31937',     // ICBC Red
      light: '#fde8eb',    // Red Light
      dark: '#cc1731',     // Hover variant
    },
    // Additional color definitions...
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Typography scale definitions...
  },
  spacing: 4, // Base spacing unit
});
```

## UI Architecture

### Component Hierarchy

```
App
├── TopNavBar (Global navigation)
├── Routes
│   ├── RequestTrackingDashboard (Home/Dashboard)
│   ├── ApplicationDetails (Hub page)
│   └── Form Pages
│       ├── CreditRequestForm
│       ├── CreditReviewForm
│       ├── BusinessSponsorshipForm
│       ├── CreditQuestionnaireForm
│       ├── LegalReviewForm
│       ├── CreditAnalysisForm
│       ├── CreditCompilationForm
│       └── CreditApprovalForm
```

### Layout Structure

Each form page follows a consistent layout pattern:

1. **TopNavBar** - Global navigation with logo and user menu
2. **WorkflowStatus** - Visual progress indicator
3. **Form Title** - Page heading
4. **CreditApplicationDetailsSection** - Key application information
5. **Form Content** - Tab-based sections with form fields
6. **WorkflowActions** - Dynamic action buttons based on workflow state

## Authentication

### LoginForm (`/frontend/src/components/LoginForm.js`)

The login page (`/login`) provides user authentication:

```javascript
// Features:
- Username/password form fields
- Redux integration for auth state management
- Error display with Material-UI Alert
- Loading state during submission
- Automatic redirect to dashboard on success
```

**Implementation Details:**
```javascript
const LoginForm = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const data = await loginApi(username, password);
      dispatch(loginSuccess({ access: data.access, refresh: data.refresh, user: data.user }));
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.detail || 'Login failed'));
    }
  };
  // ...
};
```

**Auth Flow:**
1. User submits credentials
2. `loginStart()` action dispatched (sets loading state)
3. API call to `/api/token/` endpoint
4. On success: `loginSuccess()` stores JWT tokens in Redux and localStorage
5. On failure: `loginFailure()` displays error message
6. ProtectedRoute redirects authenticated users away from `/login`

### ProtectedRoute (`/frontend/src/components/ProtectedRoute.js`)

Wrapper component that protects routes requiring authentication:
- Checks `isAuthenticated` state from Redux
- Redirects unauthenticated users to `/login`
- Renders child components for authenticated users

## Common Components

### 1. TopNavBar (`/frontend/src/components/TopNavBar.js`)

The global navigation bar appears on every page:

```javascript
// Features:
- ICBC + Standard Bank logo
- "Credit Risk Workflow" title
- Navigation links (Dashboard, My Tasks, Prioritization, All Requests)
- Create New button with "+" icon
- Notifications icon
- User avatar with dropdown menu (logout option)
```

**Technical Implementation:**
- Uses Material-UI AppBar component
- Responsive design (username hidden on mobile)
- Styled with blue background (#23408e)
- Redux integration for user state and logout

### 2. FormPageWrapper (`/frontend/src/components/common/FormPageWrapper.jsx`)

A higher-order component that provides consistent layout for all forms:

```javascript
const FormPageWrapper = ({
  title,
  workflowStatusProps,
  workflowActionsProps,
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <TopNavBar />
      <main className="flex-grow p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
          {/* WorkflowStatus with consistent padding */}
          <div style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '2rem' }}>
            <WorkflowStatus {...workflowStatusProps} />
          </div>
          
          {/* Form title */}
          <div style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 mt-4">
              {title}
            </h1>
          </div>
          
          {/* Form content */}
          <div className="form-content" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
            {children}
          </div>
          
          {/* Workflow actions */}
          <div className="mt-8 pt-6 border-t border-gray-200" 
               style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingBottom: '2rem' }}>
            <WorkflowActions {...restActionsProps} />
          </div>
        </div>
      </main>
    </div>
  );
};
```

**Key Features:**
- Consistent 48px (3rem) horizontal padding
- White card with shadow on gray background
- Proper spacing between sections
- Responsive max-width container

### 3. WorkflowStatus (`/frontend/src/components/common/WorkflowStatus.jsx`)

Visual progress indicator showing the current step in the credit workflow:

```javascript
const steps = [
  'Credit Request',
  'Credit Review',
  'Business Sponsorship',
  'Analysis',
  'Credit Paper',
  'Approval'
];
```

**Visual Design:**
- Circular step indicators connected by progress bars
- Color coding:
  - Green (#38B2AC) - Completed steps
  - Blue (#0c4da2) - Current step
  - Gray (#E4E7EB) - Future steps
- Checkmarks for completed steps
- Step labels below indicators

### 4. WorkflowActions (`/frontend/src/components/common/WorkflowActions.jsx`)

Dynamic action buttons based on workflow state and user permissions:

```javascript
// Button color logic based on action type:
- Approve/Submit: Success green
- Reject: Error red
- Save/Draft: Default gray
- Request changes: Warning orange
```

**Features:**
- Metadata-driven button generation
- Optional comments field for certain actions
- Loading states during transitions
- Error message display
- Permission-based visibility

### 5. CreditApplicationDetailsSection (`/frontend/src/components/common/CreditApplicationDetailsSection.jsx`)

Reusable component displaying key application information:

```javascript
const CreditApplicationDetailsSection = ({ creditApplication, ... }) => {
  return (
    <FormSection title="Credit Application Details">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', 
        gap: theme.spacing(3),
        marginBottom: theme.spacing(4) 
      }}>
        {/* Reference Number, Title, Counterparty, Priority, Required By */}
      </div>
    </FormSection>
  );
};
```

**Layout:**
- 5-column grid on desktop (responsive)
- Displays: Reference Number, Title, Counterparty, Priority, Required By
- Consistent styling across all forms
- Automatic fallback text for missing data

### 6. FormSection & FormField Components

**FormSection** (`/frontend/src/components/common/FormSection.jsx`):
- Provides consistent section headers and spacing
- Optional description text
- Visual separation between form sections

**FormField** (`/frontend/src/components/common/FormField.jsx`):
- Wrapper around Material-UI TextField
- Consistent styling and behavior
- Support for various input types
- Integrated with theme colors

### 7. VersionControlHeader (`/frontend/src/components/common/VersionControlHeader.jsx`)

Displays version information and provides version management actions:

```javascript
// Props:
{
  version: string,    // e.g., "Draft - v0.2"
  lastSaved: string   // e.g., "May 6, 2025, 09:30 AM"
}
```

**Features:**
- Version chip display
- Last saved timestamp
- "Save Version" button (placeholder for future functionality)
- "View History" button (placeholder for future functionality)

*Note: Currently displays placeholder data - intended for future version control implementation.*

## Form Implementation

### Form Structure Pattern

All forms follow a consistent implementation pattern:

```javascript
const FormComponent = () => {
  // State management
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  
  // Workflow state
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  
  return (
    <FormPageWrapper
      title="Form Title"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >
      {/* Credit Application Details */}
      <CreditApplicationDetailsSection creditApplication={creditApplication} />
      
      {/* Tab Navigation */}
      <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
        <Tab label="Tab 1" />
        <Tab label="Tab 2" />
      </Tabs>
      
      {/* Tab Content */}
      {activeTab === 0 && (
        <FormSection title="Section Title">
          <FormField ... />
        </FormSection>
      )}
    </FormPageWrapper>
  );
};
```

### Individual Forms

#### 1. **Credit Request Form**
- **Tabs**: Counterparty, Limits, Relationship, Legal & Docs, Prioritisation, Documents
- **Special Features**: Dynamic counterparty selection, limit management, guarantor selection
- **Route**: `/credit-requests/new` or `/credit-requests/:id/edit`

**Sub-Components** (`/frontend/src/components/CreditRequestForm/`):

| Component | Purpose |
|-----------|---------|
| `CounterpartySection.jsx` | Counterparty and guarantor selection with CIF lookup |
| `LimitsSection.jsx` | Dynamic limit rows with type, existing/proposed amounts, tenor |
| `RelationshipSection.jsx` | Revenue metrics (last 12 months, projected) |
| `LegalSection.jsx` | Legal documentation and agreement fields |
| `PrioritisationSection.jsx` | Priority level and required-by date selection |
| `DocumentsSection.jsx` | Document upload and management |
| `FormWizardNav.jsx` | Tab navigation component for form sections |
| `VersionControlHeader.jsx` | Local version control display (duplicated from common) |

#### 2. **Credit Review Form**
- **Sections**: Credit Reviewer Information, Delegated Authority, Additional Information, Rejection Reason
- **Special Features**: Role-based reviewer assignment, DA level selection
- **Route**: `/credit-requests/:id/edit?form_type=credit_review_form`

#### 3. **Business Sponsorship Form**
- **Sections**: Primary Business Sponsor, Second Business Sponsor
- **Special Features**: Approve/Reject buttons, sponsor comments
- **Route**: `/credit-requests/:id/edit?form_type=business_sponsorship_form`

#### 4. **Credit Questionnaire Form**
- **Tabs**: Business Model, Trading Activities, Risk Management, Funding & Liquidity
- **Special Features**: Comprehensive questionnaire fields
- **Route**: `/credit-requests/:id/edit?form_type=credit_questionnaire_form`

#### 5. **Legal Review Form**
- **Tabs**: Agreement Details, Legal Opinions, CSA & Collateral
- **Special Features**: Legal document review fields
- **Route**: `/credit-requests/:id/edit?form_type=legal_review_form`

#### 6. **Credit Analysis Form**
- **Tabs**: Basic Details, Executive Summary, Financial Analysis, Risk Assessment, Climate Scorecard
- **Special Features**: Financial metrics, ESG/climate risk scoring, credit rating recommendation
- **Route**: `/credit-requests/:id/edit?form_type=credit_analysis_form`

#### 7. **Credit Compilation Form**
- **Tabs**: Credit Paper Summary, Risk & Analysis, Legal & Conditions, Compilation Status
- **Special Features**: Document compilation and review
- **Route**: `/credit-requests/:id/edit?form_type=credit_compilation_form`

#### 8. **Credit Approval Form**
- **Tabs**: Approval Decision, Committee Details
- **Special Features**: Final approval/rejection workflow, committee member tracking
- **Route**: `/credit-requests/:id/edit?form_type=credit_approval_form`

## Navigation System

### Application Hub (ApplicationDetails)

The hub page (`/credit-requests/:id/details`) serves as a central navigation point:

```javascript
// Sub-Processes section displays all forms with their status
<Paper sx={{ p: 2 }}>
  <Typography variant="h6" gutterBottom>
    Sub-Processes
  </Typography>
  <List>
    {application.sub_processes.map((process) => (
      <ListItem>
        <ListItemText 
          primary={process.form_name} 
          secondary={`Status: ${process.data?.workflow_instance?.current_state}`}
        />
        <Button variant="contained" onClick={() => handleNavigate(...)}>
          {process.can_edit ? 'Edit' : 'View'}
        </Button>
      </ListItem>
    ))}
  </List>
</Paper>
```

**Features:**
- Lists all available forms for the credit application
- Shows current status of each form
- Edit/View buttons based on user permissions
- Consistent layout with main content padding

### Request Tracking Dashboard

The main dashboard (`/`) provides an overview of all credit applications:

```javascript
// Features:
- Summary cards (Pending, Awaiting My Approval)
- Filterable table of all applications
- Dynamic filters based on actual data (metadata-driven)
- Search functionality across multiple fields
- Actions to view application details
```

**Filter Implementation:**
```javascript
// Metadata-driven filters
const uniqueStatuses = [...new Set(requests.map(r => r.workflow_state?.code))];
const uniquePriorities = [...new Set(requests.map(r => r.priority))];
```

### Prioritization Dashboard

The prioritization dashboard (`/prioritization`) allows credit analysts to manually re-order applications by priority:

```javascript
// Location: /frontend/src/components/PrioritizationDashboard.js

// Features:
- Drag-and-drop row reordering
- Visual rank display (1, 2, 3...)
- Save Rankings button (bulk update)
- Refresh button
- Filters out APPROVED applications automatically
- Drag indicator icons for visual feedback
```

**Table Columns:**
- Rank (updated dynamically as rows are dragged)
- Reference Number
- Title
- Counterparty
- Amount (formatted as currency)
- Priority (High/Medium/Low chips)
- Required By Date
- Status (workflow state)
- Submitted By

**Drag-and-Drop Implementation:**
```javascript
// HTML5 drag-and-drop events
const handleDragStart = (e, index) => {
  setDraggedIndex(index);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (e, dropIndex) => {
  // Reorder array and update state
  const items = Array.from(applications);
  const [reorderedItem] = items.splice(draggedIndex, 1);
  items.splice(dropIndex, 0, reorderedItem);
  setApplications(items);
  setHasChanges(true);
};
```

**API Integration:**
```javascript
// Save ranks via bulk update endpoint
const rankUpdates = applications.map((app, index) => ({
  id: app.id,
  rank: index + 1
}));
await api.post('/api/credit/credit-applications/bulk-update-ranks/', rankUpdates);
```

**Sorting Logic:**
- Applications with existing ranks are sorted first (by rank)
- Unranked applications are sorted by Priority (High → Medium → Low)
- Within same priority, sorted by Required By Date (earliest first)

### My Tasks Page

The My Tasks page (`/my-tasks`) shows applications awaiting the current user's approval:

```javascript
// Location: /frontend/src/components/MyTasks.js

// Features:
- Displays applications requiring user's approval action
- Filters based on user's delegated authority level and role
- Summary card showing count of pending approvals
- Auto-refresh when browser tab becomes visible
```

**Table Columns:**
- ID (Reference Number)
- Title
- Counterparty
- Status (workflow state chip)
- DA Level Required (delegated authority level chip)
- Submitted Date
- Actions ("Review & Approve" button)

**Implementation:**
```javascript
// Fetches applications awaiting approval via dedicated API endpoint
const fetchAwaitingApproval = async () => {
  const { getApplicationsAwaitingMyApproval } = await import('../services/api');
  const approvalApps = await getApplicationsAwaitingMyApproval();
  setAwaitingApproval(approvalApps);
};

// Auto-refresh on tab visibility change
document.addEventListener('visibilitychange', handleVisibilityChange);
```

**Empty State:**
- Displays message: "No applications currently awaiting your approval"
- Explains that applications appear based on DA level and role

### ApplicationLoader (`/frontend/src/components/ApplicationLoader.jsx`)

Central dynamic form router that loads the appropriate form based on URL parameters:

```javascript
// Route: /credit-requests/:id/edit?form_type=<form_key>&mode=<edit|view>

// Form key mapping:
const formComponentMap = {
  'creditrequestform': CreditRequestForm,
  'creditreviewform': CreditReviewForm,
  'businesssponsorshipform': BusinessSponsorshipForm,
  'creditquestionnaireform': CreditQuestionnaireForm,
  'legalreviewform': LegalReviewForm,
  'creditanalysisform': CreditAnalysisForm,
  'creditcompilationform': CreditCompilationForm,
  'creditapprovalform': CreditApprovalForm,
};
```

**Features:**
- Parses `form_type` query parameter to determine which form to load
- Parses `mode` query parameter for edit/view mode (`mode=view` for read-only)
- Fetches credit application data before rendering form
- Passes `creditApplication`, `mainWorkflowStep`, and `editMode` props to form
- Falls back to first sub-process form if no `form_type` specified
- Displays loading/error states appropriately

**Flow:**
1. Extract `id` from URL path, `form_type` and `mode` from query params
2. Fetch credit application data via API
3. Normalize form key (lowercase, remove underscores)
4. Look up form component from map
5. Render form with fetched data and mode props

## Technical Implementation Details

### 1. **State Management**
- React hooks for local state (useState, useEffect)
- Redux for global authentication state
- Form data stored in flat object structure

### 2. **API Integration**
- Axios for HTTP requests
- JWT authentication with token refresh
- Centralized API service layer (`/frontend/src/services/api.js`)

### 3. **Routing**
- React Router v6 for navigation
- Protected routes based on authentication
- Query parameters for form type selection

### 4. **Styling Approach**
- Material-UI components with theme customization
- Tailwind CSS for utility classes
- Inline styles for precise control where needed
- Consistent spacing using theme units

### 5. **Responsive Design**
- Mobile-first approach
- Breakpoints: xs (mobile), sm (tablet), md (desktop)
- Grid layouts that stack on smaller screens
- Responsive navigation with mobile menu

### 6. **Performance Considerations**
- Component lazy loading for large forms
- Memoization for expensive calculations
- Debounced search inputs
- Efficient re-render management

## Code Organization

### Directory Structure

```
frontend/src/
├── components/
│   ├── common/              # Shared components
│   │   ├── FormPageWrapper.jsx
│   │   ├── FormSection.jsx
│   │   ├── FormField.jsx
│   │   ├── WorkflowStatus.jsx
│   │   ├── WorkflowActions.jsx
│   │   └── CreditApplicationDetailsSection.jsx
│   ├── CreditRequestForm/   # Form components
│   ├── CreditReviewForm/
│   ├── BusinessSponsorshipForm/
│   └── ... (other forms)
├── services/
│   └── api.js              # API service layer
├── theme.js                # Material-UI theme configuration
└── App.js                  # Main app component with routing
```

### Component Patterns

1. **Container/Presentational Pattern**
   - Container components handle data and logic
   - Presentational components focus on UI

2. **Composition over Inheritance**
   - FormPageWrapper provides common layout
   - Forms compose sections and fields

3. **Consistent Props Interface**
   - All forms receive similar props structure
   - Workflow-related props standardized

4. **Error Boundaries**
   - Graceful error handling at component level
   - User-friendly error messages

### Best Practices Implemented

1. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader compatibility

2. **Internationalization Ready**
   - Text content separated from logic
   - Date/number formatting considerations

3. **Code Reusability**
   - Common components extracted
   - Shared utilities and helpers
   - Consistent patterns across forms

4. **Maintainability**
   - Clear component boundaries
   - Self-documenting code structure
   - Comprehensive prop types

## Conclusion

The Credit Risk Workflow UI implementation successfully combines the ICBC + Standard Bank design system with modern React development practices. The component-based architecture ensures consistency across all forms while maintaining flexibility for specific requirements. The metadata-driven approach allows the system to adapt dynamically to workflow changes without code modifications, making it both robust and maintainable for future enhancements.