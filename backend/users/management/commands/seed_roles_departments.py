from django.core.management.base import BaseCommand
from backend.users.models import Department, Role
from django.db import transaction

# Role to Department mapping for reference:
# (Role, Department, Description)
ROLE_DEPT = [
    ("Credit Analyst", "Credit Risk", "Reviews requests, performs analysis, creates credit papers."),
    ("Credit Approver", "Credit Risk", "Reviews and approves credit limits (DA3-DA8)."),
    ("Committee Approver", "Credit Risk", "Participates in approval for higher-risk requests (DA1-DA2)."),
    ("Relationship Manager", "Front Office", "Submits initial limit requests, completes questionnaires."),
    ("Business Sponsor", "Front Office", "Senior stakeholder who supports the credit limit request."),
    ("Legal Reviewer", "Legal Department", "Provides legal documentation analysis."),
    ("System Administrator", "IT Department", "Manages system settings, workflows, and user access."),
]

class Command(BaseCommand):
    help = "Seeds the Department and Role tables with required entries."

    def handle(self, *args, **options):
        with transaction.atomic():
            # Seed departments
            depts = set(dept for _, dept, _ in ROLE_DEPT)
            for dept in depts:
                Department.objects.get_or_create(name=dept, defaults={"description": f"Department: {dept}"})
            # Seed roles
            for role, dept, desc in ROLE_DEPT:
                role_obj, created = Role.objects.get_or_create(
                    name=role,
                    defaults={
                        "description": desc,
                        "can_view_all_applications": False,
                        "can_view_department_applications": False,
                        "can_approve_applications": False,
                        "can_reject_applications": False,
                        "can_view_reports": False,
                        "can_export_data": False,
                        "visible_fields": {},
                        "available_dropdown_options": {},
                    },
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created role '{role}'. (Department: {dept})"))
                else:
                    self.stdout.write(f"Role '{role}' already exists. (Department: {dept})")
        self.stdout.write(self.style.SUCCESS("Departments and roles seeding complete."))
