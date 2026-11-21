
export function dashboardPathForRole(role) {
    return role === 'admin'
        ? '/admin/dashboard'
        : '/user/dashboard';
}
