from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition
from workflow_engine.utils import get_state_relevant_artifacts
import json

class Command(BaseCommand):
    help = 'Step 1: Comprehensive audit of all metadata across the system'

    def handle(self, *args, **options):
        self.stdout.write("="*80)
        self.stdout.write("STEP 1: COMPREHENSIVE METADATA AUDIT")
        self.stdout.write("="*80)
        
        # Track issues found
        issues_found = []
        
        # 1. AUDIT ALL WORKFLOWS
        self.stdout.write("\n📋 AUDITING ALL WORKFLOWS")
        self.stdout.write("-" * 50)
        
        workflows = Workflow.objects.all().order_by('code')
        self.stdout.write(f"Found {workflows.count()} workflows:")
        
        for workflow in workflows:
            self.stdout.write(f"\n🔹 {workflow.name} ({workflow.code})")
            
            # Check workflow metadata
            if workflow.metadata:
                if 'form_metadata' in workflow.metadata:
                    form_count = len(workflow.metadata['form_metadata'])
                    self.stdout.write(f"   ✅ Has form_metadata with {form_count} forms")
                    
                    # List all forms
                    for form_name, form_config in workflow.metadata['form_metadata'].items():
                        form_key = form_config.get('form_key', 'MISSING')
                        workflow_code = form_config.get('workflow_code', 'MISSING')
                        self.stdout.write(f"      - {form_name}: form_key='{form_key}', workflow_code='{workflow_code}'")
                else:
                    self.stdout.write("   ⚠️  Has metadata but no form_metadata")
                    issues_found.append(f"Workflow {workflow.code}: Missing form_metadata")
            else:
                self.stdout.write("   ❌ No metadata")
                issues_found.append(f"Workflow {workflow.code}: No metadata at all")
        
        # 2. AUDIT ALL STATES
        self.stdout.write("\n\n📋 AUDITING ALL STATES")
        self.stdout.write("-" * 50)
        
        for workflow in workflows:
            states = State.objects.filter(workflow=workflow).order_by('code')
            self.stdout.write(f"\n🔹 States in {workflow.code} ({states.count()} total):")
            
            for state in states:
                self.stdout.write(f"\n   🔸 {state.name} ({state.code})")
                # Check what attributes exist on the state model
                has_is_final = hasattr(state, 'is_final')
                has_is_terminal = hasattr(state, 'is_terminal')
                
                if has_is_final:
                    self.stdout.write(f"      Initial: {state.is_initial}, Final: {state.is_final}")
                elif has_is_terminal:
                    self.stdout.write(f"      Initial: {state.is_initial}, Terminal: {state.is_terminal}")
                else:
                    self.stdout.write(f"      Initial: {state.is_initial}")
                
                if state.metadata:
                    relevant = get_state_relevant_artifacts(state)
                    if relevant:
                        source = 'relevant_artifacts' if 'relevant_artifacts' in state.metadata else 'legacy metadata'
                        self.stdout.write(f"      ✅ {source}: {relevant}")
                        if 'relevant_artifacts' not in state.metadata:
                            issues_found.append(f"State {state.code}: Falling back to legacy metadata")
                    else:
                        self.stdout.write(f"      ⚠️  No relevant_artifacts configured")
                        issues_found.append(f"State {state.code}: No relevant_artifacts defined")

                    other_keys = [k for k in state.metadata.keys() if k != 'relevant_artifacts']
                    if other_keys:
                        self.stdout.write(f"      📝 Other metadata: {other_keys}")
                else:
                    self.stdout.write(f"      ❌ No metadata")
                    issues_found.append(f"State {state.code}: No metadata")
        
        # 3. AUDIT CRITICAL CREDIT REVIEW STATE
        self.stdout.write("\n\n📋 DETAILED AUDIT: CREDIT_PAPER_CREDIT_REVIEW_PENDING")
        self.stdout.write("-" * 50)
        
        try:
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            try:
                credit_review_state = State.objects.get(
                    workflow=parent_workflow,
                    code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
                )
                
                self.stdout.write(f"✅ Found: {credit_review_state.name}")
                
                if credit_review_state.metadata:
                    self.stdout.write("📄 Complete metadata:")
                    self.stdout.write(json.dumps(credit_review_state.metadata, indent=4))
                    
                    relevant = get_state_relevant_artifacts(credit_review_state)
                    if 'credit_review_form' in relevant:
                        self.stdout.write("✅ credit_review_form is in relevant_artifacts")
                    else:
                        self.stdout.write("❌ credit_review_form NOT in relevant_artifacts")
                        issues_found.append("CRITICAL: credit_review_form missing from CREDIT_REVIEW_PENDING state")
                else:
                    self.stdout.write("❌ No metadata on critical state")
                    issues_found.append("CRITICAL: CREDIT_REVIEW_PENDING state has no metadata")
                    
            except State.DoesNotExist:
                self.stdout.write("❌ CREDIT_PAPER_CREDIT_REVIEW_PENDING state not found")
                issues_found.append("CRITICAL: CREDIT_REVIEW_PENDING state does not exist")
                
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_PAPER workflow not found")
            issues_found.append("CRITICAL: CREDIT_PAPER workflow does not exist")
        
        # 4. AUDIT SUB-WORKFLOWS
        self.stdout.write("\n\n📋 AUDITING SUB-WORKFLOWS")
        self.stdout.write("-" * 50)
        
        expected_sub_workflows = [
            'CREDIT_REQUEST', 'CREDIT_REVIEW', 'BUSINESS_SPONSORSHIP',
            'LEGAL_REVIEW', 'CREDIT_QUESTIONNAIRE', 'CREDIT_ANALYSIS',
            'CREDIT_COMPILATION', 'CREDIT_APPROVAL'
        ]
        
        for workflow_code in expected_sub_workflows:
            try:
                sub_workflow = Workflow.objects.get(code=workflow_code)
                initial_states = State.objects.filter(workflow=sub_workflow, is_initial=True)
                
                if initial_states.exists():
                    initial_state = initial_states.first()
                    self.stdout.write(f"✅ {workflow_code}: Initial state = {initial_state.name}")
                else:
                    self.stdout.write(f"⚠️  {workflow_code}: No initial state")
                    issues_found.append(f"Sub-workflow {workflow_code}: Missing initial state")
                    
            except Workflow.DoesNotExist:
                self.stdout.write(f"❌ {workflow_code}: Workflow missing")
                issues_found.append(f"Sub-workflow {workflow_code}: Does not exist")
        
        # 5. AUDIT TRANSITIONS
        self.stdout.write("\n\n📋 AUDITING TRANSITIONS (SAMPLE)")
        self.stdout.write("-" * 50)
        
        # Check a few key transitions
        try:
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            key_transitions = Transition.objects.filter(
                workflow=parent_workflow,
                to_state__code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
            )
            
            if key_transitions.exists():
                self.stdout.write(f"✅ Found {key_transitions.count()} transition(s) to CREDIT_REVIEW_PENDING:")
                for transition in key_transitions:
                    self.stdout.write(f"   - {transition.name} ({transition.code})")
                    self.stdout.write(f"     From: {transition.from_state.name}")
                    self.stdout.write(f"     Roles: {transition.allowed_roles}")
            else:
                self.stdout.write("⚠️  No transitions found to CREDIT_REVIEW_PENDING state")
                issues_found.append("No transitions to CREDIT_REVIEW_PENDING state")
                
        except Workflow.DoesNotExist:
            pass  # Already reported above
        
        # 6. SUMMARY
        self.stdout.write("\n\n📊 AUDIT SUMMARY")
        self.stdout.write("-" * 50)
        
        if issues_found:
            self.stdout.write(f"❌ FOUND {len(issues_found)} ISSUES:")
            for i, issue in enumerate(issues_found, 1):
                self.stdout.write(f"   {i}. {issue}")
                
            self.stdout.write("\n🔧 RECOMMENDED NEXT STEPS:")
            self.stdout.write("   - Review issues above")
            self.stdout.write("   - Run step 2 to check what metadata should exist")
            self.stdout.write("   - Run step 3 to fix missing metadata")
        else:
            self.stdout.write("✅ NO ISSUES FOUND - Metadata appears complete!")
            self.stdout.write("\n🔍 RECOMMENDED NEXT STEPS:")
            self.stdout.write("   - Check if artifact provisioning is working")
            self.stdout.write("   - Test with a real workflow transition")
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("STEP 1 AUDIT COMPLETE")
        self.stdout.write("="*80)
