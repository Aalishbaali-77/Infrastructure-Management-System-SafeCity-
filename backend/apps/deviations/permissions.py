from apps.core.permissions import HasModulePermission


class DeviationPermission(HasModulePermission):
    """
    Adds the custom `transition` action to the base action_map.
    Mapped to 'view' deliberately: the coarse module-level check here only
    confirms the user has *some* access to the deviations module. The real
    per-transition authorization (which role can move which state-machine
    edge) is enforced inline inside ExecutionDeviationViewSet.transition(),
    because DRF's flat action_map can't express "HOD can act at HOD_REVIEW
    but not DIR_REVIEW" — that's inherently stage-conditional, not a static
    CRUD permission.
    """
    action_map = {
        **HasModulePermission.action_map,
        'transition': 'view',
    }
