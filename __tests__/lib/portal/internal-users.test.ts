import {
  isInternalPortalUser,
  customerFacingPortalUsers,
  occupiesCustomerSuperUserSlot,
  customerMayRemovePortalUser,
} from '@/lib/portal/internal-users';

describe('portal internal (CircleTel support) users', () => {
  it('treats is_internal true as hidden support, not a customer Team member', () => {
    expect(isInternalPortalUser({ is_internal: true })).toBe(true);
    expect(isInternalPortalUser({ is_internal: false })).toBe(false);
    expect(isInternalPortalUser({})).toBe(false);
  });

  it('omits internal users from the customer-facing Team list', () => {
    const listed = customerFacingPortalUsers([
      { id: '1', email: 'finance@unjani.org', is_internal: false },
      { id: '2', email: 'devadmin@example.com', is_internal: true },
      { id: '3', email: 'nurse@unjani.org' },
    ]);
    expect(listed.map((u) => u.id)).toEqual(['1', '3']);
  });

  it('lets one customer Super User coexist with hidden support admins', () => {
    expect(
      occupiesCustomerSuperUserSlot({ role: 'admin', is_internal: true })
    ).toBe(false);
    expect(
      occupiesCustomerSuperUserSlot({ role: 'admin', is_internal: false })
    ).toBe(true);
    expect(
      occupiesCustomerSuperUserSlot({ role: 'site_user', is_internal: false })
    ).toBe(false);

    const orgUsers = [
      { role: 'admin', is_internal: true },
      { role: 'admin', is_internal: true },
      { role: 'admin', is_internal: false },
      { role: 'site_user', is_internal: false },
    ];
    expect(orgUsers.filter(occupiesCustomerSuperUserSlot)).toHaveLength(1);
  });

  it('blocks customers from removing hidden support users', () => {
    expect(customerMayRemovePortalUser({ is_internal: true, role: 'admin' })).toBe(
      false
    );
    expect(
      customerMayRemovePortalUser({ is_internal: false, role: 'site_user' })
    ).toBe(true);
  });
});
