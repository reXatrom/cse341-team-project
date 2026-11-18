
import Role from './schemas/roles.js';

// Find a role by its name.
export async function getRoleByName(name) {
  return Role.findOne({ name: name.toLowerCase() }).lean();
}

// Create standard roles if they do not already exist.
export async function seedStandardRoles() {
  const standardRoles = [
    {
      name: 'user',
      description: 'Standard registered user'
    },
    {
      name: 'admin',
      description: 'Application administrator'
    }
  ];

  for (const role of standardRoles) {
    await Role.updateOne(
      { name: role.name },
      { $setOnInsert: role },
      { upsert: true }
    );
  }

  return Role.find({ name: { $in: ['user', 'admin'] } }).lean();
}
