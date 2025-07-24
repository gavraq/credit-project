
## Current State Button Rendering

### Credit Request Form

Credit Request Form on first creation:
Fill out form fields
There is a dedicated Form Actions Section at the bottom which has:
Save as Draft button - I think it is hard coded
Submit for Review button - also possible hard-coded
Click on "Save as Draft"

Re-open form from dashboard and hub page shows:
Edit button active
Credit Request: "Status: Draft"

Re-open Credit Request Form using Edit button on the Hub Page
Dedicated Form actions section shows:
Save as Draft button - I think it is hard coded but should be dynamically rendered like on the other forms (see below)
Submit for Review button - also possible hard-coded and needs dynamic rendering
Click on "Submit for Review"

This should transition to the next state: Credit Review....but I think there might be some error where you have to go in and submit for review a second time (to validate later)

### Credit Review Form

Re-login as a Credit Reviewer

Re-open form from dashboard and hub page shows:
Credit Request:
View button active - this is correct
Status: Draft - this is incorrect as it should have moved to Submitted status

Credit Review:
Edit button active
Status" Draft - this is correct

Re-open Credit Review Form using Edit button on the Hub Page
Fill out form fields
There is no dedicated Form Actions section, only buttons per below.  I think we should have it consistent.  The available buttons are:
"Back to Dashboard" button - should have this consistent on all but it currently redirects to /dashboard rather than /
"Save as Draft" button - dynamically rendered
"Update Credit Paper" button - dynamically rendered
Click on "Save as Draft"

Re-open form from dashboard and hub page shows:
Credit Request:
View button active - this is correct
Status: Draft - this is incorrect as it should have moved to Submitted status (noted above already)

Credit Review:
Edit button active
Status" Draft - this is correct

Re-open Credit Review Form using Edit button on the Hub Page
There is no dedicated Form Actions section, only buttons per below.  I think we should have it consistent (noted above already).  The available buttons are:
"Back to Dashboard" button - should have this consistent on all but it currently redirects to /dashboard rather than /
"Save as Draft" button - dynamically rendered
"Update Credit Paper" button - dynamically rendered
Click on "Update Credit Paper"
Special console box is rendered at the bottom with text saying "Action 'CRV_TR_2' performed successfully!" - I think this should be consistent for all the forms to show action logging responses.
Dynamic button now appears to show "Submit for Business Sponsorship" - I think it would be better if the dynamic rendering worked slightly differently as outlined in the Desired State Button Rendering section below

### Business Sponsorship Form, Credit Questionnaire Form & Legal Review Form

These forms should follow the same pattern as outlined in the desired state below

## Desired State Button Rendering

Each Form should have a Workflow Actions section at the bottom.  This section should dynamically render buttons named according to the "name" field in the Credit Risk Workflow - Transition State Model (v3).md file in the Credit Review Sub-Process Transitions section based on the specific form.  For example the Credit Request Form should have the following buttons per the name field in the table below:

| Transition ID | Name                                 | From State                 | To State                   |
| ------------- | ------------------------------------ | -------------------------- | -------------------------- |
| CR_TR_1       | Save as Draft                        | CREDIT_REQUEST_DRAFT       | CREDIT_REQUEST_DRAFT       |
| CR_TR_2       | Update Credit Paper                  | CREDIT_REQUEST_DRAFT       | CREDIT_REQUEST_IN_PROGRESS |
| CR_TR_3       | Save as Draft from In Progress       | CREDIT_REQUEST_IN_PROGRESS | CREDIT_REQUEST_DRAFT       |
| CR_TR_4       | Update Credit Paper from In Progress | CREDIT_REQUEST_IN_PROGRESS | CREDIT_REQUEST_IN_PROGRESS |
| CR_TR_5       | Submit for Credit Review             | CREDIT_REQUEST_IN_PROGRESS | CREDIT_REQUEST_SUBMITTED   |

When the button is clicked then the workflow engine should be called to transition the sub-process which then allows the state to be updated and the Dashboard Hub-page can reflect the status based on this updated status.

All of the buttons should be visible, but some are greyed out if not active.  The active status is dependent on the current state and only the button which has an allowable transition should be in blue.

There should be a message which appears when the button is clicked to give feedback on whether successful or not (like the console box on the current Credit Review Form) if there are errors these are rendered here e.g. on the Credit Request Form if not all of the mandatory fields have been filled in.




