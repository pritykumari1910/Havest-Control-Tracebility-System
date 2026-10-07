/**
 * @swagger
 * /api/machines:
 *   post:
 *     summary: Register a new harvest machine
 *     description: |
 *       Registers a new machine. The unique internal code is automatically generated (e.g. MAC001, MAC002).
 *       Requires **System Administrator** or **Farm Manager** role.
 *     tags:
 *       - Machines
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - machineType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Identification name of the machine. (Required)
 *               machineType:
 *                 type: string
 *                 description: Type of the machine (e.g. tractor, harvester). (Required)
 *               licensePlateOrInternalId:
 *                 type: string
 *                 description: License plate or custom serial ID. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: Status of the machine. (Optional)
 *     responses:
 *       201:
 *         description: Machine registered successfully
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
 *                     internalCode:
 *                       type: string
 *                     name:
 *                       type: string
 *                     machineType:
 *                       type: string
 *                     licensePlateOrInternalId:
 *                       type: string
 *                     comments:
 *                       type: string
 *                     status:
 *                       type: string
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *
 *   get:
 *     summary: List machines
 *     description: Retrieves list of machines with pagination, pagination info, search, and type filtering. Accessible to all authenticated users.
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: machineType
 *         schema:
 *           type: string
 *         description: Filter by machine type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query (searches internalCode, name, and licensePlateOrInternalId)
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
 *         description: Machines list retrieved successfully
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
 *                     machines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           internalCode:
 *                             type: string
 *                           name:
 *                             type: string
 *                           machineType:
 *                             type: string
 *                           licensePlateOrInternalId:
 *                             type: string
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
 *
 * /api/machines/{machineId}:
 *   get:
 *     summary: Get machine details by ID
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Machine details fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Machine not found
 *
 *   patch:
 *     summary: Update machine details
 *     description: Updates name, type, license plate/internal ID, or comments. Requires **System Administrator** or **Farm Manager** role.
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Identification name of the machine. (Optional)
 *               machineType:
 *                 type: string
 *                 description: Type of the machine. (Optional)
 *               licensePlateOrInternalId:
 *                 type: string
 *                 description: License plate or custom serial ID. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Status of the machine. (Optional)
 *     responses:
 *       200:
 *         description: Machine details updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *       404:
 *         description: Machine not found
 *
 * /api/machines/{machineId}/toggle-status:
 *   patch:
 *     summary: Toggle machine active/inactive status
 *     description: Flips the machine status between active and inactive. Requires **System Administrator** or **Farm Manager** role.
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Machine status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *       404:
 *         description: Machine not found
 *
 * /api/machines/{machineId}/operators:
 *   post:
 *     summary: Assign a worker to a machine's standing operator list
 *     description: |
 *       Registers a worker as an authorized operator for the machine.
 *       Requires the worker to be registered and active.
 *       Requires **System Administrator** or **Farm Manager** role.
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: Array of valid ObjectIds of active workers. (Required)
 *     responses:
 *       201:
 *         description: Operator assigned successfully
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
 *                     machine:
 *                       type: string
 *                     worker:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Invalid input, worker inactive/not found, machine inactive, or duplicate assignment
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Machine not found
 *
 *   get:
 *     summary: Get all standing operators for a machine
 *     description: Retrieves the list of workers authorized to operate the machine. Accessible to all authenticated users.
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Operator list retrieved successfully
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       machine:
 *                         type: string
 *                       worker:
 *                         type: object
 *                       isActive:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Machine not found
 *
 * /api/machines/{machineId}/operators/{workerId}:
 *   delete:
 *     summary: Remove a worker from a machine's standing operator list
 *     description: Deletes the standing operator assignment for the machine. Requires **System Administrator** or **Farm Manager** role.
 *     tags:
 *       - Machines
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Operator removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *       404:
 *         description: Machine or operator assignment not found
 */

export {};
