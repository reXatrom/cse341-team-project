
import bcrypt from 'bcryptjs';
import User from './schemas/users.js';
import { getRoleByName } from './roles.js';

// Create a new user.
export async function createUser(userData) {
  const passwordHash = await bcrypt.hash(userData.password, 10);

  const user = new User({
    displayName: userData.displayName,
    username: userData.username,
    email: userData.email,
    passwordHash,
    role: userData.role
  });

  return user.save();
}

// Find a user by username for login.
export async function getUserForLogin(username) {
  return User.findOne({ username: username.toLowerCase() })
    .select('+passwordHash')
    .populate('role', 'name')
    .lean();
}

// Find a user by ID.
export async function getUserById(id) {
  return User.findById(id)
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();
}

// Verify a user's password.
export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Get all users.
export async function getAllUsers() {
  return User.find({})
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();
}

// Get paginated users with optional role filtering and keyword search.
export async function getPaginatedUsers({
  page,
  limit,
  sort = 'username',
  order = 'asc',
  role,
  q
}) {
  const sortDirection = order === 'desc' ? -1 : 1;
  const sortOptions = { [sort]: sortDirection };
  const skip = (page - 1) * limit;

  const filter = {};

  // Filter users by role name.
  if (role) {
    const roleDocument = await getRoleByName(role);

    if (!roleDocument) {
      return {
        data: [],
        meta: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }

    filter.role = roleDocument._id;
  }

  // Search display name, username, and email.
  if (q) {
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');

    filter.$or = [
      { displayName: searchRegex },
      { username: searchRegex },
      { email: searchRegex }
    ];
  }

  const [users, totalItems] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .populate('role', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: users,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

// Update a user.
export async function updateUser(id, updateData) {
  const updates = {};

  if (updateData.displayName !== undefined) {
    updates.displayName = updateData.displayName;
  }

  if (updateData.username !== undefined) {
    updates.username = updateData.username;
  }

  if (updateData.email !== undefined) {
    updates.email = updateData.email;
  }

  if (updateData.password) {
    updates.passwordHash = await bcrypt.hash(updateData.password, 10);
  }

  if (updateData.role !== undefined) {
    updates.role = updateData.role;
  }

  return User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  })
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();
}

// Delete a user.
export async function deleteUser(id) {
  return User.findByIdAndDelete(id).lean();
}
