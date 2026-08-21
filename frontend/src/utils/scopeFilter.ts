export interface ScopeContext {
  provinceIds: string[]; // empty = no restriction (sees all provinces)
  siteIds: string[]; // empty = no restriction (sees all sites)
}

/**
 * Determines if a single record is visible to the current user,
 * based on SRS scoping order: site assignment takes priority over
 * province assignment. If both are empty, the user has no restriction.
 */
export function isWithinScope(
  scope: ScopeContext,
  itemProvinceId: string | null | undefined,
  itemSiteId: string | null | undefined
): boolean {
  if (scope.siteIds.length > 0) {
    return itemSiteId ? scope.siteIds.includes(itemSiteId) : false;
  }
  if (scope.provinceIds.length > 0) {
    return itemProvinceId ? scope.provinceIds.includes(itemProvinceId) : false;
  }
  return true;
}
