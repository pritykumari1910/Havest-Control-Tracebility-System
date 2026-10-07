/**
 * @swagger
 * tags:
 *   name: Harvest Assignments
 *   description: Harvest assignment planning and management (Mobile App only creation)
 */

/**
 * @swagger
 * /api/harvest-assignments:
 *   post:
 *     summary: Create a new harvest assignment (Mobile App restricted)
 *     description: |
 *       Assigns daily crew harvesting work to specific farm plots and QR code ranges.
 *       Only accessible when logged in via the **mobile application** (`userportal: 'app'`).
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Harvest Assignments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crewId
 *               - farmId
 *               - plotId
 *               - varietyId
 *               - qrSeriesId
 *               - startQrNumber
 *               - endQrNumber
 *             properties:
 *               crewId:
 *                 type: string
 *                 description: ObjectId of the daily crew (must be in Active status).
 *               farmId:
 *                 type: string
 *                 description: ObjectId of the farm.
 *               plotId:
 *                 type: string
 *                 description: ObjectId of the plot.
 *               valveId:
 *                 type: string
 *                 description: ObjectId of the valve (optional).
 *               parkId:
 *                 type: string
 *                 description: ObjectId of the park/row block (optional).
 *               assignedRows:
 *                 type: string
 *                 description: Row ranges or numbers (optional).
 *               specialZone:
 *                 type: string
 *                 description: Special zone name (optional).
 *               zoneType:
 *                 type: string
 *                 enum: [normal, trial, monitoring, control, other]
 *                 default: normal
 *               varietyId:
 *                 type: string
 *                 description: ObjectId of the avocado variety (must match one of the plot's configured varieties).
 *               qrSeriesId:
 *                 type: string
 *                 description: ObjectId of the QR Series range.
 *               startQrNumber:
 *                 type: number
 *                 description: Starting number of the QR range.
 *               endQrNumber:
 *                 type: number
 *                 description: Ending number of the QR range.
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: Target workdate. Defaults to today. (Optional)
 *               comments:
 *                 type: string
 *                 description: Any custom comments.
 *     responses:
 *       201:
 *         description: Harvest assignment created successfully
 *       400:
 *         description: Bad request (inactive crew, invalid variety configuration, overlapping/unavailable QR codes)
 *       403:
 *         description: Forbidden (insufficient permissions, or user portal is not 'app')
 *       404:
 *         description: Not found (crew, farm, plot, or variety does not exist)
 *   get:
 *     summary: List harvest assignments
 *     description: Retrieve all daily harvest assignments with optional filters.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *         description: Filter by Daily Crew ObjectId
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: Filter by Farm ObjectId
 *       - in: query
 *         name: plotId
 *         schema:
 *           type: string
 *         description: Filter by Plot ObjectId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, closed]
 *         description: Filter by assignment status
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by target date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Results limit per page
 *     responses:
 *       200:
 *         description: Harvest assignments retrieved successfully
 *
 * /api/harvest-assignments/crew/{crewId}:
 *   get:
 *     summary: Get harvest assignments by Crew ID
 *     description: Retrieve all harvest assignments assigned to a specific daily crew with optional status, date, and pagination filters.
 *     tags:
 *       - Harvest Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the daily crew
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, closed]
 *         description: Filter by assignment status
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by target work date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Harvest assignments for crew fetched successfully
 *       400:
 *         description: Invalid crewId or filter parameters
 *       404:
 *         description: Crew not found
 *
 * /api/harvest-assignments/{assignmentId}:
 *   get:
 *     summary: Get harvest assignment details
 *     description: Fetch detailed information about a single harvest assignment.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The assignment ID
 *     responses:
 *       200:
 *         description: Harvest assignment details retrieved successfully
 *       404:
 *         description: Harvest assignment not found
 *
 *   put:
 *     summary: Edit a harvest assignment
 *     description: |
 *       Update details of a harvest assignment (crew, farm, plot, valve, park, variety, zoneType, assignedRows, specialZone, workDate, comments).
 *       Validates plot configuration and variety availability.
 *       If assignment is **closed**, requires **Field Engineer** or **System Administrator** role and a mandatory **changeReason**.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               crewId:
 *                 type: string
 *               farmId:
 *                 type: string
 *               plotId:
 *                 type: string
 *               valveId:
 *                 type: string
 *                 nullable: true
 *               parkId:
 *                 type: string
 *                 nullable: true
 *               varietyId:
 *                 type: string
 *               zoneType:
 *                 type: string
 *                 enum: [normal, trial, monitoring, control, other]
 *               assignedRows:
 *                 type: string
 *               specialZone:
 *                 type: string
 *               workDate:
 *                 type: string
 *                 format: date-time
 *               comments:
 *                 type: string
 *               changeReason:
 *                 type: string
 *                 description: Mandatory reason for change when editing closed records (post-closure correction)
 *     responses:
 *       200:
 *         description: Harvest assignment updated successfully
 *       400:
 *         description: Validation error or missing changeReason for closed record
 *       403:
 *         description: Forbidden (insufficient permissions for post-closure edit)
 *       404:
 *         description: Harvest assignment or related entity not found
 *
 *   patch:
 *     summary: Edit a harvest assignment (PATCH alias)
 *     description: Alias for PUT /api/harvest-assignments/{assignmentId}.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               crewId:
 *                 type: string
 *               farmId:
 *                 type: string
 *               plotId:
 *                 type: string
 *               valveId:
 *                 type: string
 *               parkId:
 *                 type: string
 *               varietyId:
 *                 type: string
 *               zoneType:
 *                 type: string
 *                 enum: [normal, trial, monitoring, control, other]
 *               assignedRows:
 *                 type: string
 *               specialZone:
 *                 type: string
 *               workDate:
 *                 type: string
 *                 format: date-time
 *               comments:
 *                 type: string
 *               changeReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Harvest assignment updated successfully
 *
 * /api/harvest-assignments/{assignmentId}/status:
 *   patch:
 *     summary: Update harvest assignment status
 *     description: Change the status of a harvest assignment (active, paused, or closed).
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, paused, closed]
 *                 description: The new status of the assignment
 *     responses:
 *       200:
 *         description: Harvest assignment status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Harvest assignment not found
 *
 * /api/harvest-assignments/{assignmentId}/qr-range:
 *   put:
 *     summary: Allocate QR code range for a harvest assignment (Mobile App restricted)
 *     description: |
 *       Explicitly allocates a range of QR codes to an existing active harvest assignment.
 *       Only accessible when logged in via the **mobile application** (`userportal: 'app'`).
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The harvest assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrSeriesId
 *               - startQrNumber
 *               - endQrNumber
 *             properties:
 *               qrSeriesId:
 *                 type: string
 *                 description: ObjectId of the QR Series range.
 *               startQrNumber:
 *                 type: number
 *                 description: Starting number of the QR range.
 *               endQrNumber:
 *                 type: number
 *                 description: Ending number of the QR range.
 *     responses:
 *       200:
 *         description: QR range assigned successfully
 *       400:
 *         description: Bad request (invalid range, already assigned/damaged QR codes)
 *       403:
 *         description: Forbidden (insufficient permissions, or user portal is not 'app')
 *       404:
 *         description: Not found (harvest assignment or series does not exist)
 *
 * /api/harvest-assignments/{assignmentId}/return-unused-qrs:
 *   post:
 *     summary: Return assigned but unused QR codes to active inventory (Mobile App restricted)
 *     description: |
 *       Reverts all QR codes associated with this assignment that have not yet been scanned/used back to the Available status.
 *       Only accessible when logged in via the **mobile application** (`userportal: 'app'`).
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The harvest assignment ID
 *     responses:
 *       200:
 *         description: Unused QR codes returned to inventory successfully
 *       403:
 *         description: Forbidden (insufficient permissions, or user portal is not 'app')
 *       404:
 *         description: Not found (harvest assignment does not exist)
 *
 * /api/harvest-assignments/{assignmentId}/variety:
 *   patch:
 *     summary: Update variety mid-day during active harvesting
 *     description: |
 *       Allows updating the variety configuration of a harvest assignment mid-day.
 *       Requires explicit supervisor/user confirmation.
 *       Bins scanned *after* this change inherit the new variety, while previously scanned bins retain their original variety.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The harvest assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newVarietyId
 *               - confirm
 *             properties:
 *               newVarietyId:
 *                 type: string
 *                 description: Valid ObjectId of the new variety.
 *               confirm:
 *                 type: boolean
 *                 description: Explicit confirmation from supervisor. Must be true.
 *     responses:
 *       200:
 *         description: Variety updated successfully for the harvest assignment
 *       400:
 *         description: Bad request (unconfirmed variety change, invalid new variety, variety same as current)
 *       404:
 *         description: Not found (harvest assignment or variety does not exist)
 *
 * /api/harvest-assignments/{assignmentId}/variety-changes:
 *   get:
 *     summary: Retrieve mid-day variety changes audit log
 *     description: |
 *       Lists all mid-day variety changes on the assignment, categorized by bins (QR codes) scanned before and after each change.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The harvest assignment ID
 *     responses:
 *       200:
 *         description: Variety changes audit retrieved successfully
 *       404:
 *         description: Not found (harvest assignment does not exist)
 *
 * /api/harvest-assignments/history:
 *   get:
 *     summary: Fetch Farm Manager harvest history list
 *     description: |
 *       Retrieves historical harvesting sessions grouped by crew, farm, and date.
 *       Includes total pickers count, pallets collected, status, and formatted subtitle.
 *       Also accessible via `/api/farm-manager/history`.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, byFarm, byCrew]
 *           default: all
 *         description: Filter tab selection (all, byFarm, byCrew)
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: Optional ObjectId filter for farm
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *         description: Optional ObjectId filter for crew
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date ISO string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date ISO string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: History list fetched successfully
 *
 * /api/harvest-assignments/history/{id}:
 *   get:
 *     summary: Fetch Farm Manager harvest history detail by ID
 *     description: |
 *       Retrieves detailed breakdown for a specific historical crew/harvest session.
 *       Includes crew status, total pickers, total pallets received, assignment count, and Pallet Summary breakdown by fruit variety.
 *       Also accessible via `/api/farm-manager/history/{id}`.
 *     tags:
 *       - Harvest Assignments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew ID or Harvest Assignment ID
 *     responses:
 *       200:
 *         description: History detail fetched successfully
 *       404:
 *         description: History record not found
 */

export {};
