
// Check whether a user is logged in before accessing an API.
export function requireApiLogin() {
  return function (req, res, next) {
    if (!req.session?.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    return next();
  };
}

// Redirect users to the login page if they are not logged in.
export function requirePageLogin() {
  return function (req, res, next) {
    if (!req.session?.user) {
      return res.redirect('/auth/login');
    }

    return next();
  };
}

// Check whether a logged-in user has the required API role.
export function requireApiRole(role) {
  return function (req, res, next) {
    if (!req.session?.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({
        error: 'You do not have permission to access this resource.'
      });
    }

    return next();
  };
}

// Check whether a logged-in user has the required page role.
export function requirePageRole(role) {
  return function (req, res, next) {
    if (!req.session?.user) {
      return res.redirect('/auth/login');
    }

    if (req.session.user.role !== role) {
      return res.status(403).render('errors/403', {
        title: 'Access Forbidden',
        error: 'You do not have permission to access this page.'
      });
    }

    return next();
  };
}
