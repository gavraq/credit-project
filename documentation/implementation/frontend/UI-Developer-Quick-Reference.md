# UI Developer Quick Reference

## Essential Imports for New Forms

```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FormPageWrapper from '../common/FormPageWrapper';
import FormSection from '../common/FormSection';
import FormField from '../common/FormField';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
```

## Form Template Starter

```javascript
const MyNewForm = ({ creditApplication: initialCreditApplication }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Form state
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Workflow state
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Note: WorkflowStatus only uses currentStep - other props for future expansion
  const workflowStatusProps = {
    currentStep: 1, // Set appropriate step number (1-6 for workflow stages)
  };

  const workflowActionsProps = {
    allowedTransitions,
    handleTransition,
    transitionLoading: false,
    transitionError: null,
  };

  return (
    <FormPageWrapper
      title="My New Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >
      <CreditApplicationDetailsSection creditApplication={creditApplication} />
      
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
        <Tab label="Tab 1" />
        <Tab label="Tab 2" />
      </Tabs>
      
      {activeTab === 0 && (
        <FormSection title="Section Title" description="Optional description">
          <FormField
            label="Field Label"
            name="fieldName"
            value={formData.fieldName || ''}
            onChange={handleChange}
            required
          />
        </FormSection>
      )}
    </FormPageWrapper>
  );
};
```

## Common Patterns

### 1. Grid Layouts

```javascript
// 2-column layout
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
  <FormField ... />
  <FormField ... />
</div>

// 3-column layout  
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing(3) }}>
  <FormField ... />
  <FormField ... />
  <FormField ... />
</div>

// Responsive grid
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4}>
    <FormField ... />
  </Grid>
</Grid>
```

### 2. Select Fields

```javascript
<FormField
  label="Select Field"
  name="selectField"
  type="select"
  value={formData.selectField || ''}
  onChange={handleChange}
  options={[
    { value: '', label: 'Select an option' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
/>
```

### 3. Checkbox/Boolean Fields

```javascript
// Option A: Native checkbox (recommended for simple toggle)
<FormField
  label="Checkbox Label"
  name="checkboxField"
  type="checkbox"
  value={formData.checkboxField || false}
  onChange={handleChange}
  placeholder="Check to confirm" // Shows next to checkbox
/>

// Option B: Select dropdown (for Yes/No/Not answered pattern)
<FormField
  label="Checkbox Label"
  name="checkboxField"
  type="select"
  value={formData.checkboxField || ''}
  onChange={handleChange}
  options={[
    { value: '', label: 'Select answer' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ]}
/>
```

### 4. Radio Button Fields

```javascript
<FormField
  label="Select One Option"
  name="radioField"
  type="radio"
  value={formData.radioField || ''}
  onChange={handleChange}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]}
/>
```

### 5. Textarea Fields

```javascript
<FormField
  label="Comments"
  name="comments"
  type="textarea"
  value={formData.comments || ''}
  onChange={handleChange}
  placeholder="Enter your comments here"
  rows={4}
/>
```

## Theme Colors Quick Reference

```javascript
const theme = useTheme();

// Primary colors
theme.palette.primary.main    // #0c4da2 - Standard Bank Blue
theme.palette.secondary.main  // #e31937 - ICBC Red

// Status colors
theme.palette.success.main    // #38B2AC - Approval/Success
theme.palette.error.main      // #E53E3E - Rejection/Error
theme.palette.warning.main    // #F6AD55 - Pending/Warning

// Grays
theme.palette.grey[200]       // #F5F7FA - Light backgrounds
theme.palette.grey[300]       // #E4E7EB - Borders
theme.palette.grey[500]       // #9AA5B1 - Muted text
theme.palette.grey[700]       // #4A5568 - Body text
theme.palette.grey[900]       // #1F2933 - Headings
```

## Spacing Quick Reference

```javascript
theme.spacing(1)  // 4px
theme.spacing(2)  // 8px
theme.spacing(3)  // 12px
theme.spacing(4)  // 16px
theme.spacing(6)  // 24px
theme.spacing(8)  // 32px
theme.spacing(12) // 48px
```

## API Pattern

```javascript
// Import API functions
import { fetchCreditRequest, saveYourForm } from '../../services/api';

// Fetch data
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetchCreditRequest(id);
      populateFormData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [id]);

// Save data
const handleSave = async () => {
  const payload = {
    form_field_prefix_field1: formData.field1,
    form_field_prefix_field2: formData.field2,
    // ... other fields
  };
  
  try {
    await saveYourForm(id, payload);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};
```

## Workflow Transition Pattern

```javascript
const handleTransition = async (transition, comments = '') => {
  // Save form first
  const saved = await handleSave();
  if (!saved) return;
  
  // Perform transition
  try {
    await performWorkflowTransition(workflowInstanceId, {
      transition_code: transition.code,
      comments: comments
    });
    
    // Navigate based on transition
    if (transition.metadata?.ui_behavior?.navigate_on_success) {
      navigate(transition.metadata.ui_behavior.navigate_on_success);
    }
  } catch (error) {
    console.error('Transition failed:', error);
  }
};
```

## Common Props for Components

### FormPageWrapper Props
```javascript
{
  title: string,              // Page title
  workflowStatusProps: {      // Workflow status bar config
    currentStep: number       // 1-6 (only currentStep is used by WorkflowStatus)
  },
  workflowActionsProps: {     // Workflow actions config
    allowedTransitions: array,     // Array of transition objects with code, name
    handleTransition: function,    // Async function(transition, comments)
    transitionLoading: boolean,    // Shows loading state on buttons
    transitionError: string,       // Error message to display
    isNewForm: boolean,            // Shows "Save as Draft" for new forms
    handleSubmit: function,        // For new forms - save handler
    currentState: string           // Current workflow state name for display
  },
  children: ReactNode         // Form content
}
```

### FormField Props
```javascript
{
  label: string,              // Field label
  name: string,               // Field name (for form data)
  type: string,               // 'text', 'select', 'textarea', 'number', 'date', 'checkbox', 'radio'
  value: any,                 // Current value
  onChange: function,         // Change handler
  required: boolean,          // Required field (shows red asterisk)
  placeholder: string,        // Placeholder text (or checkbox label text)
  options: array,             // For select/radio fields: [{ value, label }]
  rows: number,               // For textarea (default: 3)
  disabled: boolean,          // Disable field
  readOnly: boolean,          // Read-only field (visible but not editable)
  helperText: string,         // Helper text below field
}
```

### FormSection Props
```javascript
{
  title: string,              // Section title
  description: string,        // Optional description
  children: ReactNode         // Section content
}
```

### CreditApplicationDetailsSection Props
```javascript
{
  creditApplication: object,  // Full credit application object (optional)
  // OR individual overrides:
  requestNumber: string,      // Override reference number
  requestTitle: string,       // Override title
  counterpartyName: string,   // Override counterparty name
  priority: string,           // Override priority
  requiredByDate: string,     // Override required by date
}
```
*Note: Individual props take precedence over creditApplication properties.*

### WorkflowStatus Props
```javascript
{
  currentStep: number         // Step 1-6 in the workflow progression
                              // 1=Credit Request, 2=Credit Review, 3=Business Sponsorship,
                              // 4=Analysis, 5=Credit Paper, 6=Approval
}
```
*Note: WorkflowStatus displays a 6-step visual progress indicator with the step names hardcoded.*

## Responsive Design Patterns

```javascript
// Hide on mobile
sx={{ display: { xs: 'none', md: 'block' } }}

// Stack on mobile, row on desktop
sx={{ flexDirection: { xs: 'column', md: 'row' } }}

// Full width on mobile, auto on desktop
sx={{ width: { xs: '100%', md: 'auto' } }}

// Different padding on different screens
sx={{ padding: { xs: 2, sm: 3, md: 4 } }}
```

## Common CSS Classes (Tailwind)

```css
/* Flexbox */
flex flex-col flex-row items-center justify-between gap-4

/* Spacing */
p-4 px-6 py-2 m-4 mx-auto mt-4 mb-6

/* Typography */
text-xl font-bold text-gray-800

/* Layout */
w-full max-w-5xl min-h-screen

/* Background & Borders */
bg-white bg-gray-100 border rounded-lg shadow-lg

/* Grid */
grid grid-cols-2 gap-4
```

## Debug Tips

1. **Check Theme Access**: 
   ```javascript
   console.log('Theme:', theme);
   console.log('Primary color:', theme.palette.primary.main);
   ```

2. **Check Form Data**:
   ```javascript
   console.log('Form data:', formData);
   console.log('Workflow state:', currentWorkflowState);
   ```

3. **Check API Responses**:
   ```javascript
   console.log('API response:', response.data);
   ```

4. **Component Re-renders**:
   ```javascript
   useEffect(() => {
     console.log('Component rendered/updated');
   });
   ```

## Common Gotchas

1. **Boolean Fields**: Always convert to string for select fields
   ```javascript
   value={formData.booleanField !== null ? String(formData.booleanField) : ''}
   ```

2. **Object Fields**: Check if object before accessing properties
   ```javascript
   {creditApplication?.counterparty?.name || 'Not set'}
   ```

3. **Date Formatting**: Use consistent date format
   ```javascript
   {date ? new Date(date).toLocaleDateString() : ''}
   ```

4. **Empty States**: Always provide fallbacks
   ```javascript
   {data || 'No data available'}
   ```

5. **Material-UI Imports**: Import from specific paths
   ```javascript
   import { Button } from '@mui/material';  // ✓ Good
   import Button from '@mui/material/Button'; // ✓ Also good
   import * as MUI from '@mui/material';  // ✗ Avoid
   ```

This quick reference should help developers quickly understand and implement UI components following the established patterns in the Credit Risk Workflow system.