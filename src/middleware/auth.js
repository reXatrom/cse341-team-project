
import { getUserById } from '../models/users.js';

// Check whether the account associated with this session still exists.
async function hasActiveAccount(req) {
  const userId = req.session?.user?.id;

  if (!userId) {
    return false;
  }

  const user = await getUserById(userId);

  return Boolean(user);
}

// Destroy a session when its account no longer exists.
async function destroyInvalidSession(req) {
  if (!req.session) {
    return;
  }

  await new Promise((resolve) => {
    req.session.destroy((error) => {
      if (error) {
        console.error('Error destroying invalid session:', error);
      }

      resolve();
    });
  });
}

// Check whether a user is logged in before accessing an API.
export function requireApiLogin() {
  return async function (req, res, next) {
    if (!req.session?.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    try {
      const active = await hasActiveAccount(req);

      if (!active) {
        await destroyInvalidSession(req);

        return res.status(401).json({
          error: 'Your account is no longer available. Please log in again.'
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Redirect users to login if they are not logged in
// or their account no longer exists.
export function requirePageLogin() {
  return async function (req, res, next) {
    if (!req.session?.user) {
      return res.redirect('/auth/login');
    }

    try {
      const active = await hasActiveAccount(req);

      if (!active) {
        await destroyInvalidSession(req);
        return res.redirect('/auth/login');
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Check whether a logged-in user has the required API role.
export function requireApiRole(role) {
  return async function (req, res, next) {
    if (!req.session?.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    try {
      const active = await hasActiveAccount(req);

      if (!active) {
        await destroyInvalidSession(req);

        return res.status(401).json({
          error: 'Your account is no longer available. Please log in again.'
        });
      }

      if (req.session.user.role !== role) {
        return res.status(403).json({
          error: 'You do not have permission to access this resource.'
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Check whether a logged-in user has the required page role.
export function requirePageRole(role) {
  return async function (req, res, next) {
    if (!req.session?.user) {
      return res.redirect('/auth/login');
    }

    try {
      const active = await hasActiveAccount(req);

      if (!active) {
        await destroyInvalidSession(req);
        return res.redirect('/auth/login');
      }

      if (req.session.user.role !== role) {
        return res.status(403).render('errors/403', {
          title: 'Access Forbidden',
          error: 'You do not have permission to access this page.'
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
