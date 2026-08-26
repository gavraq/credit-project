import logging

logger = logging.getLogger(__name__)

_CONDITION_HANDLERS = {}


def register_condition_handler(condition_code, handler):
    """Register a boolean condition handler."""
    _CONDITION_HANDLERS[condition_code] = handler


def iter_condition_handlers():
    """Iterate over registered condition handlers."""
    return list(_CONDITION_HANDLERS.items())
