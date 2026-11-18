
import { Router } from 'express';

import {
  loginPage,
  registerPage,
  registerUser,
  loginUser,
  logoutUser
} from '../controllers/auth.js';

const router = Router();

// Display authentication pages.
router.get('/login', loginPage);
router.get('/register', registerPage);

// Process authentication forms.
router.post('/login', loginUser);
router.post('/register', registerUser);

// End the current session.
router.post('/logout', logoutUser);

export default router;
