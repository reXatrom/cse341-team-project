
import mongoose from 'mongoose';
import {
  getPaginatedUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../models/users.js';

// GET /api/users
// Admins can see all users with pagination, role filtering, and search.
// Regular users can only see themselves.
export async function getUsers(req, res) {
  try {
    const pageValue = req.query.page ?? '1';
    const limitValue = req.query.limit ?? '10';
    const sort = req.query.sort ?? 'username';
    const order = req.query.order ?? 'asc';
    const role = req.query.role;
    const q = req.query.q;

    // Validate page number.
    if (!/^\d+$/.test(String(pageValue))) {
      return res.status(400).json({
        error: 'Page must be a positive integer.'
      });
    }

    const page = Number(pageValue);

    if (!Number.isSafeInteger(page) || page < 1) {
      return res.status(400).json({
        error: 'Page must be a positive integer.'
      });
    }

    // Validate limit.
    if (!/^\d+$/.test(String(limitValue))) {
      return res.status(400).json({
        error: 'Limit must be a positive integer.'
      });
    }

    const limit = Number(limitValue);

    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100.'
      });
    }

    // Only allow supported sort fields.
    const allowedSortFields = [
      'username',
      'displayName',
      'email'
    ];

    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({
        error: 'Invalid sort field.',
        allowedSortFields
      });
    }

    // Validate sort order.
    if (!['asc', 'desc'].includes(order)) {
      return res.status(400).json({
        error: 'Order must be either asc or desc.'
      });
    }

    // Validate role filter.
    if (
      role !== undefined &&
      (typeof role !== 'string' || !['user', 'admin'].includes(role.toLowerCase()))
    ) {
      return res.status(400).json({
        error: 'Role must be either user or admin.'
      });
    }

    // Validate keyword search.
    if (
      q !== undefined &&
      (typeof q !== 'string' || q.trim().length > 100)
    ) {
      return res.status(400).json({
        error: 'Search query must be a string of no more than 100 characters.'
      });
    }

    // Admins can view all users with pagination and optional filters.
    if (req.session.user.role === 'admin') {
      const result = await getPaginatedUsers({
        page,
        limit,
        sort,
        order,
        role: role?.toLowerCase(),
        q: q?.trim()
      });

      return res.status(200).json(result);
    }

    // Regular users can only view their own account.
    const user = await getUserById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    return res.status(200).json({
      data: [user],
      meta: {
        page: 1,
        limit: 1,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
  } catch (error) {
    console.error('Error retrieving users:', error);

    return res.status(500).json({
      error: 'Failed to retrieve users.'
    });
  }
}

// PUT /api/users/:id
// Users can update themselves. Admins can update any user.
export async function editUser(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid user ID.'
      });
    }

    const isAdmin = req.session.user.role === 'admin';
    const isOwnAccount = req.session.user.id === id;

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({
        error: 'You cannot update this user.'
      });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        error: 'A valid update object is required.'
      });
    }

    // Regular users must never be able to change their own role.
    if (Object.hasOwn(body, 'role') && !isAdmin) {
      return res.status(403).json({
        error: 'You cannot change your account role.'
      });
    }

    // Only these fields can be updated through this endpoint.
    const allowedFields = [
      'displayName',
      'username',
      'email',
      'password'
    ];

    const invalidFields = Object.keys(body).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `Unsupported update field: ${invalidFields.join(', ')}.`
      });
    }

    if (Object.keys(body).length === 0) {
      return res.status(400).json({
        error: 'Provide at least one field to update.'
      });
    }

    if (body.displayName !== undefined) {
      if (
        typeof body.displayName !== 'string' ||
        body.displayName.trim().length === 0 ||
        body.displayName.trim().length > 100
      ) {
        return res.status(400).json({
          error: 'Display name must be between 1 and 100 characters.'
        });
      }
    }

    if (body.username !== undefined) {
      if (
        typeof body.username !== 'string' ||
        body.username.trim().length < 3 ||
        body.username.trim().length > 30
      ) {
        return res.status(400).json({
          error: 'Username must be between 3 and 30 characters.'
        });
      }
    }

    if (body.email !== undefined) {
      if (
        typeof body.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ) {
        return res.status(400).json({
          error: 'Please provide a valid email address.'
        });
      }
    }

    if (body.password !== undefined && body.password !== '') {
      if (
        typeof body.password !== 'string' ||
        body.password.length < 8
      ) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long.'
        });
      }
    }

    const updatedUser = await updateUser(id, body);

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found.'
      });
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

    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to update user.'
    });
  }
}

// DELETE /api/users/:id
// Users can delete themselves. Admins can delete any user.
export async function removeUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid user ID.'
      });
    }

    const isAdmin = req.session.user.role === 'admin';
    const isOwnAccount = req.session.user.id === id;

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({
        error: 'You cannot delete this user.'
      });
    }

    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({
        error: 'User not found.'
      });
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

    return res.status(500).json({
      error: 'Failed to delete user.'
    });
  }
}
