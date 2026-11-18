
import {
  createUser,
  getUserForLogin,
  verifyPassword
} from '../models/users.js';

import { getRoleByName } from '../models/roles.js';

// Display the login page.
export function loginPage(req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }

  return res.render('auth/login', {
    title: 'Sign In',
    error: null,
    identifier: ''
  });
}

// Display the registration page.
export function registerPage(req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }

  return res.render('auth/register', {
    title: 'Create Account',
    error: null,
    formData: {}
  });
}

// Register a new user.
export async function registerUser(req, res) {
  const formData = {
    displayName: req.body.displayName?.trim() || '',
    username: req.body.username?.trim().toLowerCase() || '',
    email: req.body.email?.trim().toLowerCase() || ''
  };

  const password = req.body.password || '';

  if (
    !formData.displayName ||
    !formData.username ||
    !formData.email ||
    !password
  ) {
    return res.status(400).render('auth/register', {
      title: 'Create Account',
      error: 'Please complete all required fields.',
      formData
    });
  }

  if (formData.username.length < 3 || formData.username.length > 30) {
    return res.status(400).render('auth/register', {
      title: 'Create Account',
      error: 'Your username must be between 3 and 30 characters.',
      formData
    });
  }

  if (password.length < 8) {
    return res.status(400).render('auth/register', {
      title: 'Create Account',
      error: 'Your password must contain at least 8 characters.',
      formData
    });
  }

  try {
    // New registrations always receive the standard user role.
    const userRole = await getRoleByName('user');

    if (!userRole) {
      return res.status(503).render('auth/register', {
        title: 'Create Account',
        error: 'Registration is temporarily unavailable. Please try again later.',
        formData
      });
    }

    await createUser({
      ...formData,
      password,
      role: userRole._id
    });

    return res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(409).render('auth/register', {
        title: 'Create Account',
        error: 'That username or email address is already registered.',
        formData
      });
    }

    return res.status(500).render('auth/register', {
      title: 'Create Account',
      error: 'Unable to create your account. Please try again.',
      formData
    });
  }
}

// Process a login request.
export async function loginUser(req, res) {
  const identifier = req.body.identifier?.trim().toLowerCase() || '';
  const password = req.body.password || '';

  if (!identifier || !password) {
    return res.status(400).render('auth/login', {
      title: 'Sign In',
      error: 'Please enter your username or email and password.',
      identifier
    });
  }

  try {
    const user = await getUserForLogin(identifier);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).render('auth/login', {
        title: 'Sign In',
        error: 'Invalid username/email or password.',
        identifier
      });
    }

    // Regenerate the session to prevent session fixation.
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Store only the information needed by the application.
    req.session.user = {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      role: user.role.name
    };

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).render('auth/login', {
      title: 'Sign In',
      error: 'Unable to sign in right now. Please try again.',
      identifier
    });
  }
}

// Log out the current user.
export function logoutUser(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('connect.sid');
    return res.redirect('/auth/login');
  });
}
