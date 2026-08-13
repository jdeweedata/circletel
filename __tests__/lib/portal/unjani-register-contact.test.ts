import {
  allRegisterContactsByClinicKey,
  registerContactForClinic,
} from '@/lib/portal/unjani-register-contact';

describe('registerContactForClinic', () => {
  it('returns nurse, phone, and email for a prefixed clinic name', () => {
    expect(registerContactForClinic('Unjani Clinic - Lens ext 10')).toEqual({
      name: 'Tsabeng Ramalope',
      phone: '071 898 8722',
      email: 'lensext10@unjani.org',
    });
  });

  it('covers the full Unjani register', () => {
    const all = allRegisterContactsByClinicKey();
    expect(Object.keys(all).length).toBe(253);
    expect(Object.values(all).filter((c) => !c.name).length).toBe(0);
    expect(Object.values(all).filter((c) => !c.email).length).toBe(0);
    expect(Object.values(all).filter((c) => !c.phone).length).toBe(1);
  });
});
