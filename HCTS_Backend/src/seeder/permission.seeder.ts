import PermissionModel from '../models/permission.model.ts';

export const seedPermissions = async () => {
  console.log('\n========================================');
  console.log('Starting Permission Seeder...');
  console.log('========================================\n');

  const permissions = [
    {
      permissionName: 'User Management and Access Control',
      permissionIdentifier: 'user_management_access_control',
    },
    {
      permissionName: 'Campaign Management',
      permissionIdentifier: 'campaign_management',
    },
    {
      permissionName: 'Geographic Master Data',
      permissionIdentifier: 'geographic_master_data',
    },
    {
      permissionName: 'Variety Master and Plot Assignment',
      permissionIdentifier: 'variety_master_plot_assignment',
    },
    {
      permissionName: 'Employment Companies and Workers',
      permissionIdentifier: 'employment_companies_workers',
    },
    {
      permissionName: 'Satellite Roles Configuration',
      permissionIdentifier: 'satellite_roles_configuration',
    },
    {
      permissionName: 'Machines and Operator Administration',
      permissionIdentifier: 'machines_operator_administration',
    },
    {
      permissionName: 'Buyers, Destinations and Transport Providers',
      permissionIdentifier: 'buyers_destinations_transport_providers',
    },
    {
      permissionName: 'Operational Parameters',
      permissionIdentifier: 'operational_parameters',
    },
    {
      permissionName: 'QR Code Series Management',
      permissionIdentifier: 'qr_code_series_management',
    },
    {
      permissionName: 'Harvest Forecast',
      permissionIdentifier: 'harvest_forecast',
    },
    {
      permissionName: 'Operational Dashboard',
      permissionIdentifier: 'operational_dashboard',
    },
    {
      permissionName: 'Harvest Progress Reports',
      permissionIdentifier: 'harvest_progress_reports',
    },
    {
      permissionName: 'Satellite Staff Reports',
      permissionIdentifier: 'satellite_staff_reports',
    },
    {
      permissionName: 'Pallet Bin Traceability Report',
      permissionIdentifier: 'pallet_bin_traceability_report',
    },
    {
      permissionName: 'Dispatch and Transfer Status Report',
      permissionIdentifier: 'dispatch_transfer_status_report',
    },
    {
      permissionName: 'Audit Trail Report',
      permissionIdentifier: 'audit_trail_report',
    },
    {
      permissionName: 'Post-Closure Record Correction',
      permissionIdentifier: 'post_closure_record_correction',
    },
    {
      permissionName: 'Unassigned Bin Queue Management (Web)',
      permissionIdentifier: 'unassigned_bin_queue_management_web',
    },
    {
      permissionName: 'Mid-Day Variety Change Review',
      permissionIdentifier: 'mid_day_variety_change_review',
    },
    {
      permissionName: 'Daily Crew Management',
      permissionIdentifier: 'daily_crew_management',
    },
    {
      permissionName: 'Harvest Assignments',
      permissionIdentifier: 'harvest_assignments',
    },
    {
      permissionName: 'Operational Status Monitor',
      permissionIdentifier: 'operational_status_monitor',
    },
    {
      permissionName: 'Satellite Staff Registration',
      permissionIdentifier: 'satellite_staff_registration',
    },
    {
      permissionName: 'Collection Point Reception',
      permissionIdentifier: 'collection_point_reception',
    },
    {
      permissionName: 'Received Bin Inventory and Incident Logging',
      permissionIdentifier: 'received_bin_inventory_incident_logging',
    },
    {
      permissionName: 'Internal Dispatch Notes',
      permissionIdentifier: 'internal_dispatch_notes',
    },
    {
      permissionName: 'Load Transfer Orders',
      permissionIdentifier: 'load_transfer_orders',
    },
  ];

  let createdCount = 0;

  console.log('Permissions:\n');

  for (const permission of permissions) {
    let permissionDoc = await PermissionModel.findOne({
      permissionIdentifier: permission.permissionIdentifier,
    });

    if (!permissionDoc) {
      permissionDoc = await PermissionModel.create(permission);
      createdCount++;

      console.log(
        `✅ CREATED  | ${permissionDoc._id} | ${permissionDoc.permissionName}`
      );
    } else {
      console.log(
        `⏭️  EXISTS   | ${permissionDoc._id} | ${permissionDoc.permissionName}`
      );
    }
  }

  console.log('\n========================================');
  console.log(`Total Seed Records : ${permissions.length}`);
  console.log(`Newly Created      : ${createdCount}`);
  console.log(`Already Existing   : ${permissions.length - createdCount}`);
  console.log('Permission Seeder Completed');
  console.log('========================================\n');
};