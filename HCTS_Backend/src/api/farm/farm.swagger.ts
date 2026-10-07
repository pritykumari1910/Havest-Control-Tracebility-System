/**
 * @swagger
 * /api/farms:
 *   post:
 *     summary: Add a new farm
 *     description: |
 *       Creates a new agricultural farm. The internal code (SIEX code) is auto-generated sequentially (FARM001, FARM002, etc.).
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Farms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmName
 *               - totalHectares
 *             properties:
 *               farmName:
 *                 type: string
 *                 description: Unique name of the farm. (Required)
 *               totalHectares:
 *                 type: number
 *                 description: Total area of the farm in hectares. (Required)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the farm. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       201:
 *         description: Farm created successfully
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
 *                     farmName:
 *                       type: string
 *                     internalCode:
 *                       type: string
 *                     totalHectares:
 *                       type: number
 *                     status:
 *                       type: string
 *                     comments:
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
 *         description: Invalid input or farm name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *
 *   get:
 *     summary: List farms
 *     description: Retrieves a list of farms, optionally filtered by status and searchable by name or internal code. Accessible to all authenticated users.
 *     tags:
 *       - Farms
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter farms by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or internal code
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
 *         description: Farms fetched successfully
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
 *                       farmName:
 *                         type: string
 *                       internalCode:
 *                         type: string
 *                       totalHectares:
 *                         type: number
 *                       status:
 *                         type: string
 *                       comments:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *
 * /api/farms/{farmId}:
 *   get:
 *     summary: Get farm details
 *     description: Retrieves details of a specific farm by ID. Accessible to all authenticated users.
 *     tags:
 *       - Farms
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: The farm ID
 *     responses:
 *       200:
 *         description: Farm fetched successfully
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
 *                     farmName:
 *                       type: string
 *                     internalCode:
 *                       type: string
 *                     totalHectares:
 *                       type: number
 *                     status:
 *                       type: string
 *                     comments:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Farm not found
 *
 *   patch:
 *     summary: Update farm
 *     description: |
 *       Edits farm details or updates status.
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Farms
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: The farm ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               farmName:
 *                 type: string
 *                 description: Unique name of the farm. (Optional)
 *               totalHectares:
 *                 type: number
 *                 description: Total area of the farm in hectares. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 description: Status of the farm. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       200:
 *         description: Farm updated successfully
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
 *                     farmName:
 *                       type: string
 *                     internalCode:
 *                       type: string
 *                     totalHectares:
 *                       type: number
 *                     status:
 *                       type: string
 *                     comments:
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
 *         description: Invalid input or name duplicate
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *       404:
 *         description: Farm not found
 */

export {};
