import logging

logger = logging.getLogger(__name__)

_POST_TRANSITION_HOOKS = {}


def register_post_transition_hook(hook_code, handler):
    """Register a handler invoked after a successful transition."""
    _POST_TRANSITION_HOOKS[hook_code] = handler


def iter_post_transition_hooks():
    """Iterate over post-transition hooks."""
    return list(_POST_TRANSITION_HOOKS.items())
