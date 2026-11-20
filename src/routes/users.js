
import { Router } from 'express';
import {
  getUsers,
  editUser,
  removeUser
} from '../controllers/users.js';
import { requireApiLogin } from '../middleware/auth.js';

const router = Router();

// All user API endpoints require authentication.
router.use(requireApiLogin());

// Retrieve users.
router.get('/', getUsers);

// Update a user.
router.put('/:id', editUser);

// Delete a user.
router.delete('/:id', removeUser);

export default router;
