/**
 * Check if user is admin
 * Tries multiple possible role fields since different backends might use different naming
 */
export function isUserAdmin(user) {
  if (!user) return false;

  // Try multiple possible role fields
  return (
    user.role === 'admin' ||
    user.is_admin === true ||
    user.admin === true ||
    user.role_id === 1 ||
    user.roleId === 1 ||
    (Array.isArray(user.roles) && user.roles.includes('admin')) ||
    (user.role && user.role.name === 'admin')
  );
}
