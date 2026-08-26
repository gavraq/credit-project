"""Compatibility wrapper around the workflow engine action registry."""

from workflow_engine.registries.actions import get_action_handler


def get_system_action_handler(action_code):
    return get_action_handler(action_code)
