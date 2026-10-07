import User from '../models/user.model.ts';
import RoleModel from '../models/role.model.ts';
import emailService from '../services/email.service.ts';

export const seedSystemAdminUser = async () => {
  console.log('\n========================================');
  console.log('Starting System Admin User Seeder...');
  console.log('========================================\n');

  const ADMIN_FIRST_NAME = 'Akshit';
  const ADMIN_LAST_NAME = 'Kamboj';
  const ADMIN_EMAIL = 'akshit@yopmail.com';
  const TEMP_PASSWORD = 'Admin@123';

  const existingAdmin = await User.findOne({
    email: ADMIN_EMAIL.toLowerCase(),
  });

  if (existingAdmin) {
    if (!existingAdmin.firstName || !existingAdmin.lastName) {
      existingAdmin.firstName = ADMIN_FIRST_NAME;
      existingAdmin.lastName = ADMIN_LAST_NAME;
      await existingAdmin.save();
    }

    console.log(`⏭️  System Administrator already exists : ${ADMIN_EMAIL}`);
    console.log('System Admin User Seeder Completed.\n');
    return existingAdmin;
  }

  const systemAdminRole = await RoleModel.findOne({
    name: 'System Administrator',
    roleType: 'web',
  });

  if (!systemAdminRole) {
    throw new Error(
      'System Administrator role not found. Please run Role Seeder first.'
    );
  }

  const admin = await User.create({
    firstName: ADMIN_FIRST_NAME,
    lastName: ADMIN_LAST_NAME,
    email: ADMIN_EMAIL,
    password: TEMP_PASSWORD,
    roleIds: [systemAdminRole._id],
    userportal: 'web',
    isActive: true,
    isEmailVerified: true,
  });

  console.log(`✅ System Administrator created with ID: ${admin._id}`);

  try {
    await emailService.sendWelcomeEmail(
      `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
      ADMIN_EMAIL,
      TEMP_PASSWORD
    );

    console.log('📧 Welcome email sent successfully.');
  } catch (error) {
    console.error('⚠️ User created, but failed to send welcome email.');
    console.error(error);
  }

  console.log('----------------------------------------');
  console.log(`Name     : ${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`);
  console.log(`Email    : ${ADMIN_EMAIL}`);
  console.log(`Role     : ${systemAdminRole.name}`);
  console.log(`Portal   : web`);
  console.log('----------------------------------------\n');

  return admin;
};
