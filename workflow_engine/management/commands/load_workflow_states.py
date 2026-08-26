from credit_workflow.management.commands.load_credit_workflows import Command as CreditWorkflowCommand


class Command(CreditWorkflowCommand):
    help = (
        "Deprecated compatibility command. "
        "Loads credit workflow definitions via the new source-controlled config loader."
    )
