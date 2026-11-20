
import mongoose from 'mongoose';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../models/users.js';

// GET /api/users
// Admins can see all users. Regular users can only see themselves.
export async function getUsers(req, res) {
  try {
    if (req.session.user.role === 'admin') {
      const users = await getAllUsers();
      return res.status(200).json(users);
    }

    const user = await getUserById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json([user]);
  } catch (error) {
    console.error('Error retrieving users:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

// PUT /api/users/:id
// Users can update themselves. Admins can update any user.
export async function editUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const isAdmin = req.session.user.role === 'admin';
    const isOwnAccount = req.session.user.id === id;

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'You cannot update this user.' });
    }

    const updatedUser = await updateUser(id, req.body);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Username or email already exists.'
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to update user.' });
  }
}

// DELETE /api/users/:id
// Users can delete themselves. Admins can delete any user.
export async function removeUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const isAdmin = req.session.user.role === 'admin';
    const isOwnAccount = req.session.user.id === id;

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'You cannot delete this user.' });
    }

    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // End the session if the user deleted their own account.
    if (isOwnAccount) {
      return req.session.destroy((error) => {
        if (error) {
          console.error('Error destroying session:', error);
          return res.status(500).json({
            error: 'Account deleted, but session could not be ended.'
          });
        }

        return res.status(200).json({
          message: 'User deleted successfully.',
          redirect: '/auth/login'
        });
      });
    }

    return res.status(200).json({
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
}
