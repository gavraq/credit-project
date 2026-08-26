# Refactor Status And Next Steps

## Current Status

The workflow refactor is now in a stable post-testing state.

Completed:

- workflow engine/domain boundary cleaned up materially
- source-controlled workflow configuration in place
- artifact-oriented workflow API and persistence in place
- frontend form screens migrated to artifact-native read paths
- active artifact-backed forms fixed to save and reload correctly
- shared workflow actions UI simplified
- manual testing completed successfully across the main credit workflow path

## Outstanding Items

1. `CreditRequestForm` still uses a hybrid save path
   - it updates parent application fields and form fields together
   - this is the main remaining architectural outlier in the active workflow path

2. Additional compatibility naming and cleanup
   - some helper naming and compatibility surfaces still remain

3. Stronger regression coverage
   - artifact save/reopen behavior
   - application hub edit/view routing
   - artifact detail payload contracts by form type

4. Further engine/domain generalization
   - current model is more generic, but still ultimately maps to named credit form models

5. Optional repo/tooling cleanup
   - consolidate implementation notes
   - update frontend Browserslist data

## Immediate Next Step

Start with item 1:

- reduce the `CreditRequestForm` hybrid save path
- for existing applications, split parent-application updates from credit-request artifact updates
- keep new-application creation practical while moving the edit/update flow closer to the artifact-native model
