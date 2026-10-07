/**
 * @swagger
 * /api/valves:
 *   post:
 *     summary: Add a new valve
 *     description: |
 *       Creates a new irrigation valve under a parent plot. The parent farm is inherited automatically from the plot.
 *       The valve code is auto-generated sequentially (VAL001, VAL002, etc.).
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Valves
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentPlot
 *               - valveName
 *               - avocadoVariety
 *             properties:
 *               parentPlot:
 *                 type: string
 *                 description: ObjectId of the parent Plot. (Required)
 *               valveName:
 *                 type: string
 *                 description: Name of the valve. (Required)
 *               irrigationArea:
 *                 type: number
 *                 description: Initial irrigation area in Hectares. (Optional)
 *               avocadoVariety:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Avocado varieties assigned to the valve. (Required)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the valve. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       201:
 *         description: Valve created successfully
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
 *                     parentPlot:
 *                       type: string
 *                     parentFarm:
 *                       type: string
 *                     valveName:
 *                       type: string
 *                     valveCode:
 *                       type: string
 *                     irrigationArea:
 *                       type: number
 *                     avocadoVariety:
 *                       type: array
 *                       items:
 *                         type: string
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
 *         description: Invalid input, parent plot not found, or name duplicate within the same plot
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *
 *   get:
 *     summary: List irrigation valves
 *     description: Retrieves a list of irrigation valves, filterable by plot, farm, and status. Accessible to all authenticated users.
 *     tags:
 *       - Valves
 *     parameters:
 *       - in: query
 *         name: parentPlot
 *         schema:
 *           type: string
 *         description: Filter valves by parent Plot ID
 *       - in: query
 *         name: parentFarm
 *         schema:
 *           type: string
 *         description: Filter valves by parent Farm ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter valves by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or valve code
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
 *         description: Valves fetched successfully
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
 *                       parentPlot:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           plotName:
 *                             type: string
 *                           plotCode:
 *                             type: string
 *                       parentFarm:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           farmName:
 *                             type: string
 *                           internalCode:
 *                             type: string
 *                       valveName:
 *                         type: string
 *                       valveCode:
 *                         type: string
 *                       irrigationArea:
 *                         type: number
 *                       avocadoVariety:
 *                         type: array
 *                         items:
 *                           type: string
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
 * /api/valves/{valveId}:
 *   get:
 *     summary: Get valve details
 *     description: Retrieves details of a specific irrigation valve by ID. Accessible to all authenticated users.
 *     tags:
 *       - Valves
 *     parameters:
 *       - in: path
 *         name: valveId
 *         required: true
 *         schema:
 *           type: string
 *         description: The valve ID
 *     responses:
 *       200:
 *         description: Valve fetched successfully
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
 *                     parentPlot:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         plotName:
 *                           type: string
 *                     parentFarm:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         farmName:
 *                           type: string
 *                     valveName:
 *                       type: string
 *                     valveCode:
 *                       type: string
 *                     irrigationArea:
 *                       type: number
 *                     avocadoVariety:
 *                       type: array
 *                       items:
 *                         type: string
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
 *         description: Valve not found
 *
 *   patch:
 *     summary: Update valve
 *     description: |
 *       Edits valve details or updates status. Re-evaluates area aggregation automatically if parents or area properties change.
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Valves
 *     parameters:
 *       - in: path
 *         name: valveId
 *         required: true
 *         schema:
 *           type: string
 *         description: The valve ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentPlot:
 *                 type: string
 *                 description: ObjectId of the parent Plot. (Optional)
 *               valveName:
 *                 type: string
 *                 description: Name of the valve. (Optional)
 *               irrigationArea:
 *                 type: number
 *                 description: Irrigation area in Hectares. (Optional)
 *               avocadoVariety:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Avocado varieties assigned. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 description: Status of the valve. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       200:
 *         description: Valve updated successfully
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
 *                     parentPlot:
 *                       type: string
 *                     parentFarm:
 *                       type: string
 *                     valveName:
 *                       type: string
 *                     valveCode:
 *                       type: string
 *                     irrigationArea:
 *                       type: number
 *                     avocadoVariety:
 *                       type: array
 *                       items:
 *                         type: string
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
 *         description: Invalid input, parent plot conflict, or name duplicate within the same plot
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *       404:
 *         description: Valve not found
 *
 * /api/valves/plot/{plotId}:
 *   get:
 *     summary: List valves belonging to a specific plot
 *     description: Retrieves the list of irrigation valves configured under a plot ID. Accessible to all authenticated users.
 *     tags:
 *       - Valves
 *     parameters:
 *       - in: path
 *         name: plotId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Plot ID
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
 *         description: Valves fetched successfully
 *       400:
 *         description: Invalid Plot ID
 *       404:
 *         description: Plot not found
 */

export {};
