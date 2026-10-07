/**
 * @swagger
 * tags:
 *   name: Satellite Staff Registration
 *   description: Daily satellite staff registrations and offline synchronization management
 */

/**
 * @swagger
 * /api/satellite-staff:
 *   post:
 *     summary: Register daily satellite support staff
 *     description: |
 *       Registers support workers (e.g. Loading, tractor operators, incident loggers) assisting the harvesting crew for a specific farm, campaign, and date.
 *       Automatically captures supervisor identity and registration timestamp.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Staff Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workDate
 *               - workerId
 *               - satelliteRoleId
 *               - farmId
 *             properties:
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of support duty
 *                 example: "2026-07-21T00:00:00.000Z"
 *               workerId:
 *                 type: string
 *                 description: Worker's ObjectId (must be an active worker)
 *               satelliteRoleId:
 *                 type: string
 *                 description: Satellite Role's ObjectId (must be active)
 *               farmId:
 *                 type: string
 *                 description: Farm's ObjectId
 *               plotId:
 *                 type: string
 *                 description: Plot's ObjectId (optional)
 *               valveId:
 *                 type: string
 *                 description: Valve's ObjectId (optional)
 *               workZone:
 *                 type: string
 *                 description: Geographic or row zone description (optional)
 *               shiftType:
 *                 type: string
 *                 enum: [full, partial]
 *                 default: full
 *               shiftFraction:
 *                 type: number
 *                 minimum: 0.0
 *                 maximum: 1.0
 *                 default: 1.0
 *               partialReason:
 *                 type: string
 *                 description: Reason for partial shift (required if shiftType is partial)
 *     responses:
 *       201:
 *         description: Daily satellite staff registered successfully
 *       400:
 *         description: Validation error or inactive worker/role/farm
 *
 *   get:
 *     summary: List daily satellite staff registrations
 *     description: Retrieves the list of support staff registrations filtered by date, campaign, role, or farm.
 *     tags:
 *       - Satellite Staff Registration
 *     parameters:
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *         description: Filter registrations by date (ISO date string)
 *       - in: query
 *         name: satelliteRoleId
 *         schema:
 *           type: string
 *         description: Filter registrations by support role ID
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: Filter registrations by farm ID
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: Filter registrations by campaign ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Daily satellite staff list retrieved successfully
 *
 * /api/satellite-staff/sync:
 *   post:
 *     summary: Bulk sync offline satellite staff registrations
 *     description: |
 *       Processes a batch array of satellite staff registration records captured while offline.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Staff Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - workDate
 *                     - workerId
 *                     - satelliteRoleId
 *                     - farmId
 *                   properties:
 *                     workDate:
 *                       type: string
 *                       format: date-time
 *                     workerId:
 *                       type: string
 *                     satelliteRoleId:
 *                       type: string
 *                     farmId:
 *                       type: string
 *                     plotId:
 *                       type: string
 *                     valveId:
 *                       type: string
 *                     workZone:
 *                       type: string
 *                     shiftType:
 *                       type: string
 *                       enum: [full, partial]
 *                     shiftFraction:
 *                       type: number
 *                     partialReason:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk offline synchronization processed
 * 
 * /api/satellite-staff/{id}:
 *   patch:
 *     summary: Update daily satellite staff registration details
 *     description: |
 *       Edits details of an existing satellite support staff registration.
 *       Includes exclusivity check validations to ensure no picker conflicts exist on the workDate.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Staff Registration
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The satellite staff registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workDate:
 *                 type: string
 *                 format: date-time
 *               workerId:
 *                 type: string
 *               satelliteRoleId:
 *                 type: string
 *               farmId:
 *                 type: string
 *               plotId:
 *                 type: string
 *                 nullable: true
 *               valveId:
 *                 type: string
 *                 nullable: true
 *               workZone:
 *                 type: string
 *               shiftType:
 *                 type: string
 *                 enum: [full, partial]
 *               shiftFraction:
 *                 type: number
 *               partialReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Satellite staff registration updated successfully
 *       400:
 *         description: Validation error or inactive worker/role/farm, or exclusivity conflict
 *       404:
 *         description: Registration not found
 * 
 * /api/satellite-staff/report:
 *   get:
 *     summary: Retrieve Daily Satellite Staff Report
 *     description: |
 *       Generates daily aggregated report on satellite support staff registrations.
 *       Includes:
 *       - List of daily support staff registrations with campaign, farm, role, and company details.
 *       - Shift fraction equivalence and total headcount per role.
 *       - Picker-to-satellite ratios (overall and per farm).
 *       - Midday role change transitions from audit logs.
 *     tags:
 *       - Satellite Staff Registration
 *     parameters:
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *         description: Date of the report (ISO8601 date string, e.g. 2026-07-22)
 *     responses:
 *       200:
 *         description: Daily satellite staff report retrieved successfully
 *       400:
 *         description: Validation error
 * 
 * /api/satellite-staff/{id}/check-in:
 *   post:
 *     summary: Check-in daily satellite staff
 *     description: |
 *       Records check-in time for daily satellite support staff.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Staff Registration
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The satellite staff registration ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time of check-in (optional, defaults to current time)
 *     responses:
 *       200:
 *         description: Satellite staff checked in successfully
 *       400:
 *         description: Validation or operation error
 *       404:
 *         description: Registration not found
 * 
 * /api/satellite-staff/{id}/check-out:
 *   post:
 *     summary: Check-out daily satellite staff
 *     description: |
 *       Records check-out time for daily satellite support staff and computes shiftFraction automatically.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Staff Registration
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The satellite staff registration ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exitTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time of check-out (optional, defaults to current time)
 *     responses:
 *       200:
 *         description: Satellite staff checked out successfully
 *       400:
 *         description: Validation or operation error
 *       404:
 *         description: Registration not found
 */

export {};
