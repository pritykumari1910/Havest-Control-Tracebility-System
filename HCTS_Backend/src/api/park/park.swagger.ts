/**
 * @swagger
 * /api/parks:
 *   post:
 *     summary: Add a new park/row block
 *     description: |
 *       Creates a new agricultural park or row block under a parent valve. The parent plot and farm are inherited automatically.
 *       The park code is auto-generated sequentially (PARK001, PARK002, etc.).
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Parks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentValve
 *               - parkName
 *               - rowRange
 *               - area
 *               - avocadoVariety
 *             properties:
 *               parentValve:
 *                 type: string
 *                 description: ObjectId of the parent Valve. (Required)
 *               parkName:
 *                 type: string
 *                 description: Name of the park. (Required)
 *               rowRange:
 *                 type: string
 *                 description: Physical rows covered by the park (e.g. Rows 1-20). (Required)
 *               area:
 *                 type: number
 *                 description: Area of the park in Hectares. (Required)
 *               avocadoVariety:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Avocado varieties assigned to the park. (Required)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the park. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       201:
 *         description: Park created successfully
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
 *                     parentValve:
 *                       type: string
 *                     parentPlot:
 *                       type: string
 *                     parentFarm:
 *                       type: string
 *                     parkName:
 *                       type: string
 *                     parkCode:
 *                       type: string
 *                     rowRange:
 *                       type: string
 *                     area:
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
 *         description: Invalid input, parent valve not found, or name duplicate within the same valve
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *
 *   get:
 *     summary: List parks/row blocks
 *     description: Retrieves a list of parks, filterable by valve, plot, farm, and status. Accessible to all authenticated users.
 *     tags:
 *       - Parks
 *     parameters:
 *       - in: query
 *         name: parentValve
 *         schema:
 *           type: string
 *         description: Filter parks by parent Valve ID
 *       - in: query
 *         name: parentPlot
 *         schema:
 *           type: string
 *         description: Filter parks by parent Plot ID
 *       - in: query
 *         name: parentFarm
 *         schema:
 *           type: string
 *         description: Filter parks by parent Farm ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter parks by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or park code
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
 *         description: Parks fetched successfully
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
 *                       parentValve:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           valveName:
 *                             type: string
 *                           valveCode:
 *                             type: string
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
 *                       parkName:
 *                         type: string
 *                       parkCode:
 *                         type: string
 *                       rowRange:
 *                         type: string
 *                       area:
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
 * /api/parks/{parkId}:
 *   get:
 *     summary: Get park details
 *     description: Retrieves details of a specific park by ID. Accessible to all authenticated users.
 *     tags:
 *       - Parks
 *     parameters:
 *       - in: path
 *         name: parkId
 *         required: true
 *         schema:
 *           type: string
 *         description: The park ID
 *     responses:
 *       200:
 *         description: Park fetched successfully
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
 *                     parentValve:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         valveName:
 *                           type: string
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
 *                     parkName:
 *                       type: string
 *                     parkCode:
 *                       type: string
 *                     rowRange:
 *                       type: string
 *                     area:
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
 *         description: Park not found
 *
 *   patch:
 *     summary: Update park
 *     description: |
 *       Edits park details or updates status. Automatically triggers area aggregation upwards if parent or area properties are changed.
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Parks
 *     parameters:
 *       - in: path
 *         name: parkId
 *         required: true
 *         schema:
 *           type: string
 *         description: The park ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentValve:
 *                 type: string
 *                 description: ObjectId of the parent Valve. (Optional)
 *               parkName:
 *                 type: string
 *                 description: Name of the park. (Optional)
 *               rowRange:
 *                 type: string
 *                 description: Physical rows covered by the park. (Optional)
 *               area:
 *                 type: number
 *                 description: Area of the park in Hectares. (Optional)
 *               avocadoVariety:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Avocado varieties. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 description: Status of the park. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       200:
 *         description: Park updated successfully
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
 *                     parentValve:
 *                       type: string
 *                     parentPlot:
 *                       type: string
 *                     parentFarm:
 *                       type: string
 *                     parkName:
 *                       type: string
 *                     parkCode:
 *                       type: string
 *                     rowRange:
 *                       type: string
 *                     area:
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
 *         description: Invalid input, parent valve conflict, or name duplicate within the same valve
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *       404:
 *         description: Park not found
 *
 * /api/parks/valve/{valveId}:
 *   get:
 *     summary: List parks belonging to a specific valve
 *     description: Retrieves the list of parks/rows blocks configured under a valve ID. Accessible to all authenticated users.
 *     tags:
 *       - Parks
 *     parameters:
 *       - in: path
 *         name: valveId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Valve ID
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
 *         description: Parks fetched successfully
 *       400:
 *         description: Invalid Valve ID
 *       404:
 *         description: Valve not found
 */

export {};
