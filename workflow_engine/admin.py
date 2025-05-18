from django.contrib import admin
from .models import WorkflowDefinition, State, Transition, WorkflowInstance, StateLog

admin.site.register(WorkflowDefinition)
admin.site.register(State)
admin.site.register(Transition)
admin.site.register(WorkflowInstance)
admin.site.register(StateLog)

# Register your models here.
