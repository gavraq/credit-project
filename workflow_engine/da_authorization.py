"""
DA Level Authorization Module

Handles authorization logic for credit approvals based on user's DA (Delegated Authority) level.
Credit Analysts can approve applications based on their DA level without needing a separate role.
"""

import logging

logger = logging.getLogger(__name__)


def extract_da_level_number(da_level_str):
    """
    Extract numeric DA level from string format.
    
    Args:
        da_level_str: String like 'DA5' or '5'
        
    Returns:
        int: Numeric DA level (1-8) or None if invalid
    """
    if not da_level_str:
        return None
        
    # Handle both 'DA5' and '5' formats
    if da_level_str.startswith('DA'):
        try:
            return int(da_level_str[2:])
        except (ValueError, IndexError):
            return None
    else:
        try:
            return int(da_level_str)
        except ValueError:
            return None


def can_user_approve_at_da_level(user, required_da_level):
    """
    Check if user has authority to approve at the required DA level.
    
    DA levels work as follows:
    - DA1 is the highest authority (committee level)
    - DA8 is the lowest authority
    - A user with DA1 can approve anything (DA1-DA8)
    - A user with DA8 can only approve DA8
    
    Args:
        user: User object with role and da_level attributes
        required_da_level: String like 'DA5' indicating required approval level
        
    Returns:
        bool: True if user can approve at this level
    """
    # User must have a role
    if not user.role:
        logger.debug(f"User {user.username} has no role assigned")
        return False
    
    # User must be a Credit Analyst (since we're using DA levels on Credit Analysts)
    if user.role.name != 'Credit Analyst':
        logger.debug(f"User {user.username} is not a Credit Analyst (role: {user.role.name})")
        return False
    
    # User must have a DA level assigned
    if not user.da_level:
        logger.debug(f"Credit Analyst {user.username} has no DA level assigned")
        return False
    
    # Extract numeric levels for comparison
    user_level = extract_da_level_number(user.da_level)
    required_level = extract_da_level_number(required_da_level)
    
    if user_level is None or required_level is None:
        logger.error(f"Invalid DA level format: user={user.da_level}, required={required_da_level}")
        return False
    
    # Validate DA levels are in valid range (1-8)
    if not (1 <= user_level <= 8) or not (1 <= required_level <= 8):
        logger.error(f"DA levels out of range: user={user_level}, required={required_level}")
        return False
    
    # Lower number = higher authority
    # User can approve if their level <= required level
    can_approve = user_level <= required_level
    
    logger.info(
        f"DA authorization check: {user.username} (DA{user_level}) "
        f"{'CAN' if can_approve else 'CANNOT'} approve DA{required_level} level request"
    )
    
    return can_approve


def get_user_max_approval_level(user):
    """
    Get the maximum DA level a user can approve.
    
    Args:
        user: User object
        
    Returns:
        str: Maximum DA level user can approve (e.g., 'DA5') or None
    """
    if not user.role or user.role.name != 'Credit Analyst' or not user.da_level:
        return None
        
    # A user with DA5 can approve DA5, DA6, DA7, DA8
    # So their max approval level is DA8 (the lowest level they can approve)
    return 'DA8'


def get_user_approval_range(user):
    """
    Get the range of DA levels a user can approve.
    
    Args:
        user: User object
        
    Returns:
        tuple: (min_level, max_level) that user can approve, or (None, None)
    """
    if not user.role or user.role.name != 'Credit Analyst' or not user.da_level:
        return (None, None)
    
    user_level = extract_da_level_number(user.da_level)
    if not user_level:
        return (None, None)
    
    # User can approve from their level down to DA8
    return (f'DA{user_level}', 'DA8')


def can_user_approve_credit_application(user, credit_application):
    """
    Check if user can approve a specific credit application.
    
    This checks both the user's role/DA level and the required DA level
    from the credit application's Credit Review Form.
    
    Args:
        user: User object
        credit_application: CreditApplication object
        
    Returns:
        bool: True if user can approve this application
    """
    # Credit application must have a credit review form with DA level set
    if not hasattr(credit_application, 'credit_review_form'):
        logger.debug(f"Credit application {credit_application.reference_number} has no credit review form")
        return False
        
    credit_review = credit_application.credit_review_form
    if not credit_review or not credit_review.delegated_authority_level:
        logger.debug(f"Credit review form has no DA level set")
        return False
    
    required_da_level = credit_review.delegated_authority_level
    return can_user_approve_at_da_level(user, required_da_level)


def is_committee_approval_required(da_level):
    """
    Check if the DA level requires committee approval.
    
    DA1 and DA2 require committee approval.
    
    Args:
        da_level: String like 'DA1' or 'DA2'
        
    Returns:
        bool: True if committee approval is required
    """
    level_num = extract_da_level_number(da_level)
    return level_num is not None and level_num <= 2


def filter_applications_by_approval_authority(user, applications_queryset):
    """
    Filter credit applications to only those the user can approve.
    
    Args:
        user: User object
        applications_queryset: QuerySet of CreditApplication objects
        
    Returns:
        QuerySet: Filtered applications
    """
    if not user.role or user.role.name != 'Credit Analyst' or not user.da_level:
        # User cannot approve anything
        return applications_queryset.none()
    
    user_level = extract_da_level_number(user.da_level)
    if not user_level:
        return applications_queryset.none()
    
    # Filter applications where the required DA level >= user's DA level
    # (Remember: lower number = higher authority)
    approved_da_levels = [f'DA{i}' for i in range(user_level, 9)]  # DA levels user can approve
    
    return applications_queryset.filter(
        credit_review_form__delegated_authority_level__in=approved_da_levels,
        workflow_instance__current_state__code='CREDIT_PAPER_APPROVAL_PENDING'
    )