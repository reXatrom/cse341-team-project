
export function adminDashboard(req, res) {
    return res.render('admin/dashboard', {
        title: 'Admin Dashboard'
    });
}

export function usersAdminPage(req, res) {
    return res.render('users/admin', {
        title: 'User Management'
    });
}

export function tripsAdminPage(req, res) {
    return res.render('admin/trips-admin', {
        title: 'Trips Management'
    });
}

export function bookingsAdminPage(req, res) {
    return res.render('admin/bookings-admin', {
        title: 'Bookings Management'
    });
}
