
import bcrypt from 'bcryptjs';
import User from './schemas/users.js';

// Create a user with a securely hashed password.
export async function createUser(userData) {
  const passwordHash = await bcrypt.hash(userData.password, 12);

  const user = await User.create({
    displayName: userData.displayName,
    username: userData.username,
    email: userData.email,
    passwordHash,
    role: userData.role
  });

  // Never expose the password hash.
  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  return safeUser;
}

// Find a user by username or email for login.
export async function getUserForLogin(identifier) {
  return User.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() }
    ]
  })
    .select('+passwordHash')
    .populate('role', 'name')
    .lean();
}

// Find a user by their database ID.
export async function getUserById(id) {
  return User.findById(id)
    .populate('role', 'name')
    .lean();
}

// Verify a submitted password against its stored hash.
export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}



// Get all users without exposing their password hashes.
export async function getAllUsers() {
  return User.find({})
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();
}

// Update a user's information.
export async function updateUser(id, userData) {
  const updateData = {};

  if (userData.displayName !== undefined) {
    updateData.displayName = userData.displayName;
  }

  if (userData.username !== undefined) {
    updateData.username = userData.username;
  }

  if (userData.email !== undefined) {
    updateData.email = userData.email;
  }

  // Hash a new password before saving it.
  if (userData.password) {
    updateData.passwordHash = await bcrypt.hash(userData.password, 12);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { returnDocument: 'after', runValidators: true }
  )
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();

  return user;
}

// Delete a user by their database ID.
export async function deleteUser(id) {
  return User.findByIdAndDelete(id)
    .select('-passwordHash')
    .populate('role', 'name')
    .lean();
}
