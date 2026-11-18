
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
