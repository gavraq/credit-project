from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition

class Command(BaseCommand):
    help = 'Prints current workflow definitions from the database for comparison.'

    def handle(self, *args, **options):
        self.stdout.write("Current Workflow Definitions in Database:")
        
        workflows = Workflow.objects.all()
        if not workflows.exists():
            self.stdout.write("No workflow definitions found in the database.")
            return

        for wf_def in workflows:
            self.stdout.write(self.style.SUCCESS(f"\n--- Workflow: {wf_def.name} (Code: {wf_def.code}) ---"))
            
            states = State.objects.filter(workflow_definition=wf_def).order_by('name')
            self.stdout.write(self.style.HTTP_INFO("\n  States:"))
            if states.exists():
                for state in states:
                    self.stdout.write(f"    - Code: {state.code}, Name: {state.name}, Initial: {state.is_initial}, Terminal: {state.is_terminal}")
            else:
                self.stdout.write("    No states found for this workflow.")

            transitions = Transition.objects.filter(workflow_definition=wf_def).order_by('name')
            self.stdout.write(self.style.HTTP_INFO("\n  Transitions:"))
            if transitions.exists():
                for trans in transitions:
                    from_state_code = trans.from_state.code if trans.from_state else "N/A"
                    to_state_code = trans.to_state.code if trans.to_state else "N/A"
                    self.stdout.write(f"    - Code: {trans.code}, Name: {trans.name}")
                    self.stdout.write(f"      From: {from_state_code} -> To: {to_state_code}")
                    self.stdout.write(f"      Allowed Roles: {trans.allowed_roles}")
            else:
                self.stdout.write("    No transitions found for this workflow.")
        
        self.stdout.write(self.style.SUCCESS("\n--- End of Database Workflow Definitions ---"))
