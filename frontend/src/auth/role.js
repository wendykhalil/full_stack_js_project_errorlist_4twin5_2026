export const Roles = {
  ARTISAN: 'ARTISAN',
  PRESCRIPTEUR: 'PRESCRIPTEUR',
  SUPPLIER: 'SUPPLIER',
  ADMIN: 'ADMIN',
};

export function roleToBasePath(role) {
  switch (role) {
    case Roles.ADMIN:
      return '/admin';
    case Roles.ARTISAN:
      return '/artisan';
    case Roles.PRESCRIPTEUR:
      return '/prescripteur';
    case Roles.SUPPLIER:
      return '/fournisseur';
    default:
      return '/login';
  }
}

export function urlRoleToEnum(urlRole) {
  switch ((urlRole || '').toLowerCase()) {
    case 'artisan':
      return Roles.ARTISAN;
    case 'prescripteur':
      return Roles.PRESCRIPTEUR;
    case 'fournisseur':
      return Roles.SUPPLIER;
    case 'admin':
      return Roles.ADMIN;
    default:
      return null;
  }
}
