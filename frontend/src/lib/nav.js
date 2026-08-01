// One place that knows what screens exist and who may see them.
// Both the dashboard and the header nav read from here.
//
// These role arrays mirror the backend's authorisation table. They paint
// navigation only — every read and write is re-authorised server-side.

export const PAGES = [
  {
    key: 'dashboard', label: 'Dashboard', href: '/',
    roles: ['admin', 'chef', 'staff'],
    note: 'Everything you can reach, in one place.'
  },
  {
    key: 'menu', label: 'Menu', href: '/menu',
    roles: ['admin', 'chef', 'staff'],
    note: 'Every costed dish, with its ingredients and amounts.'
  },
  {
    key: 'builder', label: 'Dish builder', href: '/builder',
    roles: ['admin', 'chef'],
    note: 'Cost a new plate from the master foods list.'
  },
  {
    key: 'foods', label: 'Master foods', href: '/foods',
    roles: ['admin', 'chef'],
    note: 'What we pay per ingredient, and the unit price it works out to.'
  },
  {
    key: 'users', label: 'Staff accounts', href: '/users',
    roles: ['admin'],
    note: 'Create accounts, reset passwords, deactivate people.'
  }
];

export const allowed = (role) => PAGES.filter(p => p.roles.indexOf(role || 'staff') !== -1);

export const pageFor = (pathname) =>
  PAGES.find(p => p.href === pathname) || null;
