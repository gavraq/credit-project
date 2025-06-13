# Credit Risk Workflow System - Form Data Lifecycle

This document provides a comprehensive overview of the form data lifecycle within the Credit Risk Workflow System, detailing the journey of data from the frontend user interface to the backend database. It covers the unified architecture for handling all major forms, including the Credit Request, Business Sponsorship, Credit Questionnaire, and Legal Review forms.

## 1. Guiding Principles

The form implementation is guided by the following principles to ensure consistency, maintainability, and scalability:

1.  **Unified State Management**: Each form utilizes a single state object (`formData`) in React to hold all its data, simplifying state updates and data handling.
2.  **Generic Event Handlers**: Reusable `handleChange` functions dynamically update the `formData` object based on user input, reducing boilerplate code.
3.  **Flat Data Payload**: The frontend sends a single, flat JSON object to the backend for saving. There is no complex nesting of `form_data` objects in the payload.
4.  **Serializer-Led Orchestration**: The backend's `CreditApplicationSerializer` is the single point of entry for all form data. It is responsible for validating the incoming flat payload and orchestrating the creation or update of the primary `CreditApplication` and all its related sub-form models (e.g., `CreditRequestForm`, `BusinessSponsorshipForm`).
5.  **Dynamic Workflow Actions**: All forms use a common `WorkflowActions` component (or a similar pattern) that dynamically renders buttons based on the `allowed_transitions` provided by the backend, ensuring a consistent user experience for workflow progression.

## 2. Frontend Implementation

The frontend for each form follows a consistent structure and pattern.

### 2.1. Component Structure

Each form (e.g., `CreditRequestForm/index.jsx`) is responsible for:
- Fetching all necessary data on load (e.g., the `CreditApplication` object, dropdown options).
- Initializing a single `formData` state object.
- Rendering the form fields and passing them the `formData` and a `handleChange` function.
- Handling form submission via a generic `handleSubmit` function.
- Managing and displaying the workflow state and available actions.

### 2.2. State Management

A single `useState` hook manages all data for the form.

```jsx
// Example from a generic form component
const [formData, setFormData] = useState({
  // Direct fields from CreditApplication model
  title: '',
  counterparty_id: null,
  // Fields from the specific sub-form model (e.g., CreditRequestForm)
  senior_business_sponsor_id: null,
  // ... and so on for all fields on the form
});

// Populate formData on initial load
useEffect(() => {
  if (data) { // data fetched from API
    setFormData({
      title: data.title || '',
      counterparty_id: data.counterparty_id || null,
      senior_business_sponsor_id: data.credit_request_form?.senior_business_sponsor_id || null,
      // ... merge data from the main application and the relevant sub-form
    });
  }
}, [data]);
```

### 2.3. Event Handling

A generic `handleChange` function handles updates for all input types.

```jsx
const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData(prevData => ({
    ...prevData,
    [name]: type === 'checkbox' ? checked : value,
  }));
};
```

### 2.4. Form Submission (`handleSubmit`)

The `handleSubmit` function assembles a flat payload and sends it to the appropriate API service function.

```jsx
// Generic handleSubmit logic
const handleSubmit = async () => {
  // The formData state object is already in the flat structure required by the backend.
  // It includes fields for CreditApplication and the specific sub-form.
  
  let response;
  if (editMode) {
    // The save function is a generic API service call, e.g., saveCreditRequestForm
    response = await saveForm(id, formData); 
  } else {
    response = await createForm(formData);
  }
  // Handle success or error
};
```

## 3. API Service Layer

The frontend `api.js` service provides generic functions for saving each form type. These functions simply pass the flat `formData` object to the backend endpoint.

```jsx
// frontend/src/services/api.js

// Example for saving a Business Sponsorship form
export const saveBusinessSponsorshipForm = async (id, data) => {
  const response = await patch(`/api/credit-applications/${id}/save_business_sponsorship_form/`, data);
  return response.data;
};

// Similar functions exist for other forms:
// - saveCreditRequestForm
// - saveCreditQuestionnaireForm
// - saveLegalReviewForm
```

## 4. Backend Implementation

The backend is designed to receive the flat payload and use the serializer layer to correctly distribute the data.

### 4.1. Models

The database schema consists of a central `CreditApplication` model linked to various sub-form models via `OneToOneField` or `ForeignKey`.

```python
# credit_applications/models.py

class CreditApplication(models.Model):
    # Core fields like title, counterparty, status, etc.
    title = models.CharField(max_length=255)
    counterparty = models.ForeignKey(Counterparty, on_delete=models.PROTECT)
    # ...

class CreditRequestForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE)
    # Direct fields for this form
    senior_business_sponsor_id = models.ForeignKey(User, ...)
    # JSON blob for less structured data
    form_data = models.JSONField(default=dict)

class BusinessSponsorshipForm(models.Model):
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE)
    # Fields for this form
    form_data = models.JSONField(default=dict)

# ... and so on for CreditQuestionnaireForm, LegalReviewForm
```

### 4.2. Views (`CreditApplicationViewSet`)

The `CreditApplicationViewSet` provides dedicated `@action` endpoints for saving each form type. This approach allows for tailored logic per form while keeping the URL structure clean.

```python
# credit_applications/views.py

class CreditApplicationViewSet(viewsets.ModelViewSet):
    # ... standard queryset, serializer_class, etc.

    @action(detail=True, methods=['patch'])
    def save_credit_request_form(self, request, pk=None):
        instance = self.get_object()
        # The main CreditApplicationSerializer handles everything
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def save_business_sponsorship_form(self, request, pk=None):
        # This action also uses the main serializer
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    # ... similar actions for other forms
```

### 4.3. Serializer Orchestration (`CreditApplicationSerializer`)

The `CreditApplicationSerializer` is the heart of the backend form handling logic. Its `update` method intelligently inspects the incoming `validated_data` and delegates the creation or update of sub-form models.

```python
# credit_applications/serializers.py

class CreditApplicationSerializer(serializers.ModelSerializer):
    # ... field definitions ...

    # Nested serializers for reading data
    credit_request_form = CreditRequestFormSerializer(read_only=True)
    business_sponsorship_form = BusinessSponsorshipFormSerializer(read_only=True)
    # ... etc.

    class Meta:
        model = CreditApplication
        fields = [
            # list of all fields, including nested ones for reading
        ]

    def update(self, instance, validated_data):
        # Pop data for each potential sub-form from the flat payload
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        business_sponsorship_form_data = validated_data.pop('business_sponsorship_form', None)
        # ... and so on for other forms

        # Update the parent CreditApplication instance first
        instance = super().update(instance, validated_data)

        # If data for a sub-form exists, update or create it
        if credit_request_form_data is not None:
            # Handle any ForeignKey relationships (e.g., converting UUID to User instance)
            sbs_id = credit_request_form_data.pop('senior_business_sponsor_id', None)
            if sbs_id:
                credit_request_form_data['senior_business_sponsor_id'] = User.objects.get(id=sbs_id)
            
            CreditRequestForm.objects.update_or_create(
                credit_application=instance,
                defaults=credit_request_form_data
            )

        if business_sponsorship_form_data is not None:
            BusinessSponsorshipForm.objects.update_or_create(
                credit_application=instance,
                defaults={'form_data': business_sponsorship_form_data}
            )
        
        # ... logic for other forms ...

        return instance
```

This architecture ensures a clean separation of concerns, simplifies the frontend logic, and provides a robust, scalable pattern for managing complex, multi-model forms.
