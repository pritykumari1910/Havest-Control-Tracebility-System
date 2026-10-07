import mongoose from 'mongoose';

import env from '../config/env.ts';
import { seedPermissions } from './permission.seeder.ts';
import { seedRoles } from './role.seeder.ts';
import { seedSystemAdminUser } from './user.seeder.ts';

const runSeeder = async () => {
  try {
    console.clear();

    console.log('========================================');
    console.log('MASTER SEEDER');
    console.log('========================================\n');

    await mongoose.connect(env.MONGODB_URL);

    console.log('✅ MongoDB Connected\n');

    // await seedPermissions();
    // await seedRoles();
    await seedSystemAdminUser();

    console.log('\n========================================');
    console.log('Master Seeding Completed Successfully');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\nSeeder Failed\n');
    console.error(error);
    process.exit(1);
  }
};

runSeeder();
