/**
 * CircleTel support / operator portal accounts.
 * Hidden from the customer Team page; login and Super User APIs still work.
 */

export function isInternalPortalUser(user: {
  is_internal?: boolean | null;
}): boolean {
  return user.is_internal === true;
}

export function customerFacingPortalUsers<T extends { is_internal?: boolean | null }>(
  users: T[]
): T[] {
  return users.filter((user) => !isInternalPortalUser(user));
}

/** Customer Super User uniqueness ignores hidden support admins. */
export function occupiesCustomerSuperUserSlot(user: {
  role: string;
  is_internal?: boolean | null;
}): boolean {
  return user.role === 'admin' && !isInternalPortalUser(user);
}

export function customerMayRemovePortalUser(target: {
  is_internal?: boolean | null;
  role?: string;
}): boolean {
  return !isInternalPortalUser(target);
}
