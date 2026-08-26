from django.core.management.base import BaseCommand, CommandError

from credit_workflow.loaders import (
    DEFAULT_CONFIG_PATH,
    WorkflowConfigError,
    load_credit_workflow_config,
    sync_credit_workflow_config,
)


class Command(BaseCommand):
    help = "Load credit workflow definitions from source-controlled config"

    def add_arguments(self, parser):
        parser.add_argument(
            "--config",
            default=str(DEFAULT_CONFIG_PATH),
            help="Path to the credit workflow config file",
        )
        parser.add_argument(
            "--validate-only",
            action="store_true",
            help="Validate config without writing to the database",
        )

    def handle(self, *args, **options):
        config_path = options["config"]
        validate_only = options["validate_only"]

        try:
            workflows = load_credit_workflow_config(config_path)
        except (OSError, ValueError, WorkflowConfigError) as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Validated {len(workflows)} workflow definitions from {config_path}"
            )
        )

        if validate_only:
            return

        sync_credit_workflow_config(workflows)
        self.stdout.write(self.style.SUCCESS("Credit workflow definitions loaded successfully"))
