from django.contrib import admin
from .models import Workflow, State, Transition, WorkflowInstance, StateLog

admin.site.register(Workflow)
admin.site.register(State)
admin.site.register(Transition)
admin.site.register(WorkflowInstance)
admin.site.register(StateLog)

# Register your models here.
