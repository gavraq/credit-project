from django.apps import AppConfig


class CreditWorkflowConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "credit_workflow"

    def ready(self):
        from . import registry

        registry.register()
