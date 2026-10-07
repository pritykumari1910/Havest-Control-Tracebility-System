/**
 * @swagger
 * /api/satellite-roles:
 *   post:
 *     summary: Create a new satellite (support) role
 *     description: |
 *       Creates a new satellite role configuration.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name of the satellite role (e.g. Loading). (Required)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Activation status of the satellite role. (Optional)
 *     responses:
 *       201:
 *         description: Satellite role created successfully
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
 *                     name:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Invalid input or duplicate satellite role name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *
 *   get:
 *     summary: List all satellite (support) roles
 *     description: Retrieves the list of satellite roles sorted alphabetically by name. Accessible to all authenticated users.
 *     tags:
 *       - Satellite Roles
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Optional filter by status (true for active, false for inactive)
 *     responses:
 *       200:
 *         description: Satellite roles fetched successfully
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
 *                       name:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *
 * /api/satellite-roles/{roleId}:
 *   patch:
 *     summary: Update satellite role details
 *     description: |
 *       Edits details (renames) or updates the status of a satellite role.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Roles
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The satellite role ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name of the satellite role. (Optional)
 *               isActive:
 *                 type: boolean
 *                 description: Activation status of the satellite role. (Optional)
 *     responses:
 *       200:
 *         description: Satellite role updated successfully
 *       400:
 *         description: Invalid input or duplicate name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *       404:
 *         description: Satellite role not found
 *
 * /api/satellite-roles/{roleId}/toggle-status:
 *   patch:
 *     summary: Toggle satellite role active / inactive status
 *     description: |
 *       Flips the role status between **active** and **inactive** with a single call — no request body needed.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Satellite Roles
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The satellite role ID
 *     responses:
 *       200:
 *         description: Satellite role status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *       404:
 *         description: Satellite role not found
 */

export {};
