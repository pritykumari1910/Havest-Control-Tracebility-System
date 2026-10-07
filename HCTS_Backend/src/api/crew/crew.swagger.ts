/**
 * @swagger
 * /api/crews/unassigned-workers:
 *   get:
 *     summary: Get list of active workers NOT assigned to any crew or satellite staff on workDate
 *     description: |
 *       Returns active workers who are not assigned to any daily crew or registered as satellite staff for the specified date (defaults to today).
 *       Used by Web UI to populate unassigned worker list during crew creation and picker management.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check unassigned worker status (defaults to today). (Optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search worker by name, document ID, or QR code. (Optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Unassigned workers fetched successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/crews:
 *   post:
 *     summary: Create a daily crew record
 *     description: |
 *       Creates a new daily crew linked to the active campaign. Validates pickers, leader, and supervisor.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Daily Crews
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crewName
 *               - assignedPickers
 *               - supervisor
 *             properties:
 *               crewName:
 *                 type: string
 *                 description: Unique name of the crew. (Required)
 *               assignedPickers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of active worker ObjectIds. (Required)
 *               supervisor:
 *                 type: string
 *                 description: User ObjectId of the supervisor/manijero. (Required)
 *               leader:
 *                 type: string
 *                 description: Worker ObjectId of the crew leader. (Optional)
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the crew's daily assignment. Defaults to today. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - draft
 *                   - active
 *                   - closed
 *                 default: draft
 *                 description: Status of the crew. (Optional)
 *     responses:
 *       201:
 *         description: Daily crew created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     campaign:
 *                       type: string
 *                     workDate:
 *                       type: string
 *                       format: date-time
 *                     crewName:
 *                       type: string
 *                     crewCode:
 *                       type: string
 *                     assignedPickers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     leader:
 *                       type: string
 *                     supervisor:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Invalid input, no active campaign found, or invalid pickers/leader/supervisor
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *
 *   get:
 *     summary: List daily crews
 *     description: Retrieves a paginated list of daily crews, optionally filtered. Accessible to all authenticated users.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: query
 *         name: campaign
 *         schema:
 *           type: string
 *         description: Filter by campaign ObjectId
 *       - in: query
 *         name: supervisor
 *         schema:
 *           type: string
 *         description: Filter by supervisor User ObjectId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - draft
 *             - active
 *             - closed
 *         description: Filter by crew status
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by work date (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by crew name or crew code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page limit
 *     responses:
 *       200:
 *         description: Daily crews fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: object
 *                   properties:
 *                     crews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           campaign:
 *                             type: object
 *                           workDate:
 *                             type: string
 *                             format: date-time
 *                           crewName:
 *                             type: string
 *                           crewCode:
 *                             type: string
 *                           assignedPickers:
 *                             type: array
 *                             items:
 *                               type: object
 *                           leader:
 *                             type: object
 *                           supervisor:
 *                             type: object
 *                           status:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/crews/supervisor/{supervisorId}:
 *   get:
 *     summary: Get all crews assigned to a specific Manijero / Supervisor
 *     description: Returns all crew records where supervisor matches the provided supervisorId. Supports filtering and pagination.
 *     tags:
 *       - Daily Crews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supervisorId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId of the supervisor/manijero
 *       - in: query
 *         name: campaign
 *         schema:
 *           type: string
 *         description: Filter by campaign ObjectId
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by work date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, closed]
 *         description: Filter by crew status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by crew name or code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Crews retrieved successfully
 *       400:
 *         description: Invalid supervisorId or query parameters
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/crews/manijero/{manijeroId}:
 *   get:
 *     summary: Get all crews assigned to a specific Manijero (Alias)
 *     description: Alias for /api/crews/supervisor/{supervisorId}. Returns all crew records for the specified manijero/supervisor.
 *     tags:
 *       - Daily Crews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manijeroId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId of the manijero/supervisor
 *       - in: query
 *         name: campaign
 *         schema:
 *           type: string
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, closed]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Crews retrieved successfully
 *       400:
 *         description: Invalid manijeroId
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/crews/{crewId}:
 *   get:
 *     summary: Get daily crew details
 *     description: Retrieves details of a specific daily crew by ID. Accessible to all authenticated users.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The crew ID
 *     responses:
 *       200:
 *         description: Daily crew fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     campaign:
 *                       type: object
 *                     workDate:
 *                       type: string
 *                       format: date-time
 *                     crewName:
 *                       type: string
 *                     crewCode:
 *                       type: string
 *                     assignedPickers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     leader:
 *                       type: object
 *                     supervisor:
 *                       type: object
 *                     status:
 *                       type: string
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Daily crew not found
 *
 *   patch:
 *     summary: Update daily crew details
 *     description: |
 *       Edits details of a daily crew or changes its status.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The crew ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               crewName:
 *                 type: string
 *                 description: Unique name of the crew. (Optional)
 *               assignedPickers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of active worker ObjectIds. (Optional)
 *               supervisor:
 *                 type: string
 *                 description: User ObjectId of the supervisor. (Optional)
 *               leader:
 *                 type: string
 *                 description: Worker ObjectId of the leader. (Optional)
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of crew daily assignment. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - draft
 *                   - active
 *                   - closed
 *                 description: Status of the crew. (Optional)
 *     responses:
 *       200:
 *         description: Daily crew updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: object
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Invalid input, or validation failures
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Daily crew not found
 *
 * /api/crews/{crewId}/toggle-status:
 *   patch:
 *     summary: Toggle crew active / inactive status
 *     description: |
 *       Flips the crew status between **active** and **inactive** with a single call — no request body needed.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The crew ID
 *     responses:
 *       200:
 *         description: Daily crew activated or deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Daily crew activated successfully
 *                 responseObject:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     crewCode:
 *                       type: string
 *                     crewName:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum:
 *                         - Draft
 *                         - Active
 *                         - Closed
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Daily crew not found
 */

/**
 * @swagger
 * /api/crews/previous-day:
 *   get:
 *     summary: Preview all crews and linked workers from the previous workday
 *     description: |
 *       Finds the most recent previous workday before today and returns all crews created on that day.
 *       Each crew is returned with its fully populated linked workers (`assignedPickers`, `leader`, `supervisor`).
 *       Frontend can use this list to display all available previous crews and allow the user to select specific crews to copy.
 *     tags:
 *       - Daily Crews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supervisorId
 *         schema:
 *           type: string
 *         description: Optional filter by supervisor/manijero ObjectId
 *     responses:
 *       200:
 *         description: Previous day crews retrieved successfully with linked workers
 *       404:
 *         description: No previous crew assignments found in the system
 *
 * /api/crews/copy-previous:
 *   post:
 *     summary: Copy previous day's crew composition to today
 *     description: |
 *       Copies crews from the most recent workday into new Today records.
 *       Supports copying specific crew(s) by passing `crewIds: ["<crewId1>", "<crewId2>"]` or copying all previous crews if omitted/empty.
 *       Returns all created crews with their fully populated linked workers (`assignedPickers`, `leader`, `supervisor`).
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Daily Crews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               crewIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional list of specific crew ObjectIds to copy. If omitted, copies all crews from the previous date.
 *     responses:
 *       201:
 *         description: Crew composition copied successfully with linked workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: array
 *                   items:
 *                     type: object
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Bad request or worker conflict (already assigned to another crew on the target day)
 *       404:
 *         description: No previous crews found to copy from
 *
 * /api/crews/{crewId}/attendance/check-in:
 *   post:
 *     summary: Record worker attendance check-in
 *     description: |
 *       Explicit check-in for a list of workers in the crew.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The crew ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerIds
 *             properties:
 *               workerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of worker ObjectIds to check in.
 *               entryTime:
 *                 type: string
 *                 format: date-time
 *                 description: Explicit entry time. Defaults to now. (Optional)
 *     responses:
 *       200:
 *         description: Workers checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: array
 *                   items:
 *                     type: object
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Bad request or invalid payload
 *       404:
 *         description: Crew not found
 *
 * /api/crews/{crewId}/attendance/check-out:
 *   post:
 *     summary: Record worker attendance check-out and calculate shift fraction
 *     description: |
 *       Explicit check-out for a list of workers in the crew.
 *       Computes shift fraction based on hours worked relative to an 8-hour shift.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The crew ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerIds
 *             properties:
 *               workerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of worker ObjectIds to check out.
 *               exitTime:
 *                 type: string
 *                 format: date-time
 *                 description: Explicit exit time. Defaults to now. (Optional)
 *     responses:
 *       200:
 *         description: Workers checked out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: array
 *                   items:
 *                     type: object
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Bad request or invalid payload
 *       404:
 *         description: Crew not found
 *
 * /api/crews/{crewId}/attendance:
 *   get:
 *     summary: Get attendance logs for a crew
 *     description: |
 *       Retrieve check-in/check-out logs and shift fractions for all workers in the crew.
 *     tags:
 *       - Daily Crews
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The crew ID
 *     responses:
 *       200:
 *         description: Attendance logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 responseObject:
 *                   type: array
 *                   items:
 *                     type: object
 *                 statusCode:
 *                   type: number
 *       404:
 *         description: Crew not found
 */

export {};
