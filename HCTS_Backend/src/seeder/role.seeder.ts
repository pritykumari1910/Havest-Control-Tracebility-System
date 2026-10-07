import mongoose from 'mongoose';
import RoleModel from '../models/role.model.ts';
import PermissionModel from '../models/permission.model.ts';

const SYSTEM_ADMIN_ID = new mongoose.Types.ObjectId(
  '000000000000000000000001'
);

export const seedRoles = async () => {
  console.log('\n========================================');
  console.log('Starting Role Seeder...');
  console.log('========================================\n');

  const permissions = await PermissionModel.find().lean();

  const allPermissionIds = permissions.map((p) => p._id);

  const reportPermissionIds = permissions
    .filter((p) =>
      p.permissionName.toLowerCase().includes('report')
    )
    .map((p) => p._id);

  const administrativeTeamPermissions = permissions
    .filter((p) =>
      [
        'User Management and Access Control',
        'Employment Companies and Workers',
        'Operational Dashboard',
        'Operational Parameters',
        'Harvest Forecast',
        'Daily Crew Management',
      ].includes(p.permissionName)
    )
    .map((p) => p._id);

  const rolesToSeed = [
    {
      name: 'System Administrator',
      roleType: 'web' as const,
      isSystem: true,
      permissions: allPermissionIds,
    },
    {
      name: 'Operations Director',
      roleType: 'web' as const,
      isSystem: true,
      permissions: allPermissionIds,
    },
    {
      name: 'Field Engineer',
      roleType: 'web' as const,
      isSystem: true,
      permissions: allPermissionIds,
    },
    {
      name: 'Administrative Team',
      roleType: 'web' as const,
      isSystem: true,
      permissions: administrativeTeamPermissions,
    },
    {
      name: 'Reporting User',
      roleType: 'web' as const,
      isSystem: true,
      permissions: reportPermissionIds,
    },
    {
      name: 'Read-Only User',
      roleType: 'web' as const,
      isSystem: true,
      permissions: reportPermissionIds,
    },
    {
      name: 'Farm Manager',
      roleType: 'app' as const,
      isSystem: true,
      permissions: [],
    },
    {
      name: 'Manijero / Crew Supervisor',
      roleType: 'app' as const,
      isSystem: true,
      permissions: [],
    },
    {
      name: 'Collection Team',
      roleType: 'app' as const,
      isSystem: true,
      permissions: [],
    },
    {
      name: 'Loading Team',
      roleType: 'app' as const,
      isSystem: true,
      permissions: [],
    },
  ];

  let created = 0;

  console.log('Roles:\n');

  for (const role of rolesToSeed) {
    let roleDoc = await RoleModel.findOne({
      name: role.name,
      roleType: role.roleType,
      createdByAdminId: SYSTEM_ADMIN_ID,
    });

    if (!roleDoc) {
      roleDoc = await RoleModel.create({
        ...role,
        createdByAdminId: SYSTEM_ADMIN_ID,
        isActive: true,
      });

      created++;

      console.log(
        `✅ CREATED | ${roleDoc._id} | ${roleDoc.name} | ${role.permissions.length} permissions`
      );
    } else {
      console.log(
        `⏭️  EXISTS  | ${roleDoc._id} | ${roleDoc.name} | ${roleDoc.permissions.length} permissions`
      );
    }
  }

  console.log('\n========================================');
  console.log(`Total Seed Records : ${rolesToSeed.length}`);
  console.log(`Newly Created      : ${created}`);
  console.log(`Already Existing   : ${rolesToSeed.length - created}`);
  console.log('Role Seeder Completed');
  console.log('========================================\n');
};