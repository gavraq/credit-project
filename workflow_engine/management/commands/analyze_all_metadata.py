from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition
from workflow_engine.utils import get_state_relevant_artifacts
import json

class Command(BaseCommand):
    help = 'Analyze all workflow metadata across the system'

    def handle(self, *args, **options):
        self.stdout.write("="*80)
        self.stdout.write("COMPREHENSIVE METADATA ANALYSIS")
        self.stdout.write("="*80)
        
        # 1. Analyze all workflows
        self.stdout.write("\n1. WORKFLOWS OVERVIEW")
        self.stdout.write("-" * 50)
        
        all_workflows = Workflow.objects.all().order_by('code')
        for workflow in all_workflows:
            self.stdout.write(f"\nWorkflow: {workflow.name} ({workflow.code})")
            self.stdout.write(f"Description: {workflow.description or 'None'}")
            
            if workflow.metadata:
                self.stdout.write("Workflow Metadata:")
                self.stdout.write(json.dumps(workflow.metadata, indent=2))
                
                # Check for form_metadata specifically
                if 'form_metadata' in workflow.metadata:
                    form_metadata = workflow.metadata['form_metadata']
                    self.stdout.write(f"\nForms defined in this workflow: {len(form_metadata)}")
                    for form_name, form_config in form_metadata.items():
                        self.stdout.write(f"  - {form_name}:")
                        self.stdout.write(f"    form_key: {form_config.get('form_key', 'Not defined')}")
                        self.stdout.write(f"    title: {form_config.get('title', 'Not defined')}")
                        self.stdout.write(f"    editable_by_roles: {form_config.get('editable_by_roles', [])}")
                        self.stdout.write(f"    viewable_by_roles: {form_config.get('viewable_by_roles', [])}")
            else:
                self.stdout.write("Workflow Metadata: None")
        
        # 2. Analyze all states with their metadata
        self.stdout.write("\n\n2. STATES ANALYSIS")
        self.stdout.write("-" * 50)
        
        for workflow in all_workflows:
            self.stdout.write(f"\n--- States in {workflow.name} ({workflow.code}) ---")
            states = State.objects.filter(workflow=workflow).order_by('code')
            
            for state in states:
                self.stdout.write(f"\nState: {state.name} ({state.code})")
                self.stdout.write(f"  Initial: {state.is_initial}")
                self.stdout.write(f"  Final: {state.is_final}")
                
                if state.metadata:
                    self.stdout.write("  Metadata:")
                    for key, value in state.metadata.items():
                        self.stdout.write(f"    {key}: {value}")
                        if key == 'relevant_artifacts' and not value:
                            self.stdout.write(f"      ⚠️  WARNING: Empty relevant_artifacts list")
                else:
                    self.stdout.write("  Metadata: None")
                    self.stdout.write("    ⚠️  WARNING: No metadata - artifact provisioning may not work!")
        
        # 3. Analyze transitions and their metadata
        self.stdout.write("\n\n3. TRANSITIONS ANALYSIS")
        self.stdout.write("-" * 50)
        
        for workflow in all_workflows:
            self.stdout.write(f"\n--- Transitions in {workflow.name} ({workflow.code}) ---")
            transitions = Transition.objects.filter(workflow=workflow).order_by('code')
            
            for transition in transitions:
                self.stdout.write(f"\nTransition: {transition.name} ({transition.code})")
                self.stdout.write(f"  From: {transition.from_state.name} → To: {transition.to_state.name}")
                self.stdout.write(f"  Allowed roles: {transition.allowed_roles}")
                
                if transition.metadata:
                    self.stdout.write("  Metadata:")
                    self.stdout.write(json.dumps(transition.metadata, indent=4))
                else:
                    self.stdout.write("  Metadata: None")
        
        # 4. Check artifact provisioning compatibility
        self.stdout.write("\n\n4. ARTIFACT PROVISIONING COMPATIBILITY CHECK")
        self.stdout.write("-" * 60)
        
        # Get the parent workflow that drives artifact provisioning
        try:
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            self.stdout.write(f"Parent workflow for artifact provisioning: {parent_workflow.name}")
            
            # Check each state's relevant_artifacts
            states_with_issues = []
            states = State.objects.filter(workflow=parent_workflow)
            
            for state in states:
                self.stdout.write(f"\nState: {state.name} ({state.code})")
                
                if not state.metadata:
                    states_with_issues.append((state, "No metadata"))
                    self.stdout.write("  ❌ No metadata - artifact provisioning will fail")
                    continue
                
                relevant = get_state_relevant_artifacts(state)
                if not relevant:
                    states_with_issues.append((state, "Missing relevant_artifacts"))
                    self.stdout.write("  ❌ Missing 'relevant_artifacts' - artifact provisioning will fallback to default ['credit_request_form']")
                elif not relevant:
                    states_with_issues.append((state, "Empty relevant_artifacts"))
                    self.stdout.write("  ⚠️  Empty relevant_artifacts list")
                else:
                    self.stdout.write(f"  ✅ relevant_artifacts: {relevant}")
            
            if states_with_issues:
                self.stdout.write(f"\n⚠️  FOUND {len(states_with_issues)} STATES WITH ARTIFACT PROVISIONING ISSUES:")
                for state, issue in states_with_issues:
                    self.stdout.write(f"  - {state.name} ({state.code}): {issue}")
            else:
                self.stdout.write("\n✅ All states have proper artifact provisioning metadata!")
                
        except Workflow.DoesNotExist:
            self.stdout.write("❌ Parent workflow 'CREDIT_PAPER' not found - artifact provisioning system broken!")
        
        # 5. Check dynamic artifact mapping compatibility
        self.stdout.write("\n\n5. DYNAMIC ARTIFACT MAPPING CHECK")
        self.stdout.write("-" * 50)
        
        try:
            from workflow_engine.utils import (
                get_dynamic_artifact_model_map,
                get_dynamic_artifact_prefixes,
            )
            
            artifact_model_map = get_dynamic_artifact_model_map()
            artifact_prefixes = get_dynamic_artifact_prefixes()
            
            self.stdout.write(f"Dynamic artifact model mappings: {len(artifact_model_map)}")
            for artifact_key, model_class in artifact_model_map.items():
                self.stdout.write(f"  {artifact_key} → {model_class.__name__}")
            
            self.stdout.write(f"\nDynamic artifact prefixes: {len(artifact_prefixes)}")
            for prefix, artifact_key in artifact_prefixes.items():
                self.stdout.write(f"  {prefix} → {artifact_key}")
                
            if len(artifact_model_map) != len(artifact_prefixes):
                self.stdout.write("\n⚠️  WARNING: Mismatch between artifact model map and prefixes!")
                
        except Exception as e:
            self.stdout.write(f"❌ Error checking dynamic mappings: {e}")
        
        # 6. Summary and recommendations
        self.stdout.write("\n\n6. SUMMARY AND RECOMMENDATIONS")
        self.stdout.write("-" * 50)
        
        self.stdout.write("Based on the analysis above:")
        self.stdout.write("1. Check for states missing 'relevant_artifacts' metadata")
        self.stdout.write("2. Ensure Credit Review forms are included in CREDIT_PAPER_CREDIT_REVIEW_PENDING state")
        self.stdout.write("3. Verify all sub-workflows (CREDIT_REQUEST, CREDIT_REVIEW, etc.) exist")
        self.stdout.write("4. Check that form_metadata in parent workflow matches actual form models")
        self.stdout.write("5. Ensure transitions have proper role-based permissions")
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("ANALYSIS COMPLETE")
        self.stdout.write("="*80)
