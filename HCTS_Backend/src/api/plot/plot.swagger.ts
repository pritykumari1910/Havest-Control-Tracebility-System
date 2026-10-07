/**
 * @swagger
 * /api/plots:
 *   post:
 *     summary: Add a new plot
 *     description: |
 *       Creates a new agricultural plot under a parent farm. The plot code is auto-generated sequentially (PLOT001, PLOT002, etc.).
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Plots
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentFarm
 *               - plotName
 *               - totalArea
 *               - avocadoVariety
 *             properties:
 *               parentFarm:
 *                 type: string
 *                 description: ObjectId of the parent Farm. (Required)
 *               plotName:
 *                 type: string
 *                 description: Name of the plot. (Required)
 *               totalArea:
 *                 type: number
 *                 description: Total area of the plot in hectares. (Required)
 *               avocadoVariety:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Avocado varieties assigned to the plot. (Required)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the plot. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       201:
 *         description: Plot created successfully
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
 *                     parentFarm:
 *                       type: string
 *                     plotName:
 *                       type: string
 *                     plotCode:
 *                       type: string
 *                     totalArea:
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
 *         description: Invalid input, parent farm not found, or name duplicate within the same farm
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *
 *   get:
 *     summary: List plots
 *     description: Retrieves a list of plots, optionally filtered by parent farm and status, and searchable by name or plot code. Accessible to all authenticated users.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: query
 *         name: parentFarm
 *         schema:
 *           type: string
 *         description: Filter plots by parent Farm ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter plots by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or plot code
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
 *         description: Plots fetched successfully
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
 *                       parentFarm:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           farmName:
 *                             type: string
 *                           internalCode:
 *                             type: string
 *                       plotName:
 *                         type: string
 *                       plotCode:
 *                         type: string
 *                       totalArea:
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
 * /api/plots/{plotId}:
 *   get:
 *     summary: Get plot details
 *     description: Retrieves details of a specific plot by ID. Accessible to all authenticated users.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: path
 *         name: plotId
 *         required: true
 *         schema:
 *           type: string
 *         description: The plot ID
 *     responses:
 *       200:
 *         description: Plot fetched successfully
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
 *                     parentFarm:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         farmName:
 *                           type: string
 *                     plotName:
 *                       type: string
 *                     plotCode:
 *                       type: string
 *                     totalArea:
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
 *         description: Plot not found
 *
 *   patch:
 *     summary: Update plot
 *     description: |
 *       Edits plot details or updates status.
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: path
 *         name: plotId
 *         required: true
 *         schema:
 *           type: string
 *         description: The plot ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentFarm:
 *                 type: string
 *                 description: ObjectId of the parent Farm. (Optional)
 *               plotName:
 *                 type: string
 *                 description: Name of the plot. (Optional)
 *               totalArea:
 *                 type: number
 *                 description: Total area of the plot in hectares. (Optional)
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
 *                 description: Status of the plot. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       200:
 *         description: Plot updated successfully
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
 *                     parentFarm:
 *                       type: string
 *                     plotName:
 *                       type: string
 *                     plotCode:
 *                       type: string
 *                     totalArea:
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
 *         description: Invalid input, parent farm conflict, or name duplicate within the same farm
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *       404:
 *         description: Plot not found
 *
 * /api/plots/farm/{farmId}:
 *   get:
 *     summary: List plots belonging to a specific farm
 *     description: Retrieves the list of plots configured under a farm ID. Accessible to all authenticated users.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Farm ID
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
 *         description: Plots fetched successfully
 *       400:
 *         description: Invalid Farm ID
 *       404:
 *         description: Farm not found
 */

export {};
