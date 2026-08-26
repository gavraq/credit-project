import logging

logger = logging.getLogger(__name__)

_ACTION_HANDLERS = {}


def register_action_handler(action_code, handler):
    """Register a handler for a symbolic system action code."""
    _ACTION_HANDLERS[action_code] = handler


def get_action_handler(action_code):
    """Get a registered handler for a system action code."""
    handler = _ACTION_HANDLERS.get(action_code)
    if not handler:
        logger.debug("No action handler registered for '%s'", action_code)
    return handler
