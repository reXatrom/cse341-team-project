
import { connectMongoose, closeMongoose } from './mongoose.js';
import { seedStandardRoles } from '../models/roles.js';

try {
  await connectMongoose();

  const roles = await seedStandardRoles();

  console.log('Standard roles are ready:');
  for (const role of roles) {
    console.log(`- ${role.name}`);
  }
} catch (error) {
  console.error('Role seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeMongoose();
}
