/**
 * @swagger
 * /api/varieties:
 *   post:
 *     summary: Define a new avocado variety
 *     description: |
 *       Creates a new avocado variety master record. The variety code is auto-generated sequentially (VAR001, VAR002, etc.).
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Varieties
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - varietyName
 *               - varietyType
 *             properties:
 *               varietyName:
 *                 type: string
 *                 description: Unique name of the avocado variety. (Required)
 *               varietyType:
 *                 type: string
 *                 enum:
 *                   - Main
 *                   - Pollinator
 *                   - Other
 *                 description: Classification type of the variety. (Required)
 *               otherVarietyType:
 *                 type: string
 *                 description: Custom variety type if varietyType is Other. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the variety. (Optional)
 *               technicalComments:
 *                 type: string
 *                 description: Additional technical notes about the variety. (Optional)
 *     responses:
 *       201:
 *         description: Variety created successfully
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
 *                     varietyName:
 *                       type: string
 *                     varietyCode:
 *                       type: string
 *                     varietyType:
 *                       type: string
 *                     status:
 *                       type: string
 *                     technicalComments:
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
 *         description: Invalid input or variety name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *
 *   get:
 *     summary: List avocado varieties
 *     description: Retrieves a list of avocado varieties, filterable by type and status. Accessible to all authenticated users.
 *     tags:
 *       - Varieties
 *     parameters:
 *       - in: query
 *         name: varietyType
 *         schema:
 *           type: string
 *           enum:
 *             - Main
 *             - Pollinator
 *             - Other
 *         description: Filter varieties by type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter varieties by status
 *     responses:
 *       200:
 *         description: Varieties fetched successfully
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
 *                       varietyName:
 *                         type: string
 *                       varietyCode:
 *                         type: string
 *                       varietyType:
 *                         type: string
 *                       status:
 *                         type: string
 *                       technicalComments:
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
 * /api/varieties/{varietyId}:
 *   get:
 *     summary: Get variety details
 *     description: Retrieves details of a specific avocado variety by ID. Accessible to all authenticated users.
 *     tags:
 *       - Varieties
 *     parameters:
 *       - in: path
 *         name: varietyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The variety ID
 *     responses:
 *       200:
 *         description: Variety fetched successfully
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
 *                     varietyName:
 *                       type: string
 *                     varietyCode:
 *                       type: string
 *                     varietyType:
 *                       type: string
 *                     status:
 *                       type: string
 *                     technicalComments:
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
 *         description: Variety not found
 *
 *   patch:
 *     summary: Update variety
 *     description: |
 *       Edits avocado variety details or status.
 *       Requires **System Administrator**, **Operations Director**, or **Field Engineer** role.
 *     tags:
 *       - Varieties
 *     parameters:
 *       - in: path
 *         name: varietyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The variety ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               varietyName:
 *                 type: string
 *                 description: Unique name of the avocado variety. (Optional)
 *               varietyType:
 *                 type: string
 *                 enum:
 *                   - Main
 *                   - Pollinator
 *                   - Other
 *                 description: Classification type of the variety. (Optional)
 *               otherVarietyType:
 *                 type: string
 *                 description: Custom variety type if varietyType is Other. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 description: Status of the variety. (Optional)
 *               technicalComments:
 *                 type: string
 *                 description: Additional technical notes about the variety. (Optional)
 *     responses:
 *       200:
 *         description: Variety updated successfully
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
 *                     varietyName:
 *                       type: string
 *                     varietyCode:
 *                       type: string
 *                     varietyType:
 *                       type: string
 *                     status:
 *                       type: string
 *                     technicalComments:
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
 *         description: Invalid input or variety name duplicate
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not an authorized role)
 *       404:
 *         description: Variety not found
 */

export {};
