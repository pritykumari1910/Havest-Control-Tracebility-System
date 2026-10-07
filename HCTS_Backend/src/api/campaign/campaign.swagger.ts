/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     description: |
 *       Creates a new agricultural campaign. Enforces the single active campaign rule.
 *       Requires `campaign_management` permission and **System Administrator** role.
 *     tags:
 *       - Campaigns
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignName
 *               - startDate
 *               - estimatedEndDate
 *             properties:
 *               campaignName:
 *                 type: string
 *                 description: Unique name of the campaign. (Required)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the campaign. (Required)
 *               estimatedEndDate:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated end date of the campaign. (Required)
 *               status:
 *                 type: string
 *                 enum:
 *                   - draft
 *                   - active
 *                   - closed
 *                   - historical
 *                 default: draft
 *                 description: Status of the campaign. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       201:
 *         description: Campaign created successfully
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
 *                   nullable: true
 *                 statusCode:
 *                   type: number
 *       400:
 *         description: Invalid input or another active campaign already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *
 *   get:
 *     summary: List campaigns
 *     description: Retrieves a list of campaigns, optionally filtered by status, search query, with pagination. Accessible to all authenticated users.
 *     tags:
 *       - Campaigns
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - draft
 *             - active
 *             - closed
 *             - historical
 *         description: "(Optional) Filter campaigns by status"
 *       - in: query
 *         name: campaignName
 *         schema:
 *           type: string
 *         description: "(Optional) Search campaigns by campaignName (case-insensitive)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "(Optional) Page number"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "(Optional) Page limit"
 *     responses:
 *       200:
 *         description: Campaigns fetched successfully
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
 *                       campaignName:
 *                         type: string
 *                       campaignCode:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       estimatedEndDate:
 *                         type: string
 *                         format: date-time
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
 * /api/campaigns/{campaignId}:
 *   get:
 *     summary: Get campaign details
 *     description: Retrieves details of a specific campaign by ID. Accessible to all authenticated users.
 *     tags:
 *       - Campaigns
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *     responses:
 *       200:
 *         description: Campaign fetched successfully
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
 *                     campaignName:
 *                       type: string
 *                     campaignCode:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     estimatedEndDate:
 *                       type: string
 *                       format: date-time
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
 *         description: Campaign not found
 *
 *   patch:
 *     summary: Update campaign
 *     description: |
 *       Edits campaign details or updates status. Enforces the single active campaign rule.
 *       Requires `campaign_management` permission and **System Administrator** role.
 *     tags:
 *       - Campaigns
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campaignName:
 *                 type: string
 *                 description: Unique name of the campaign. (Optional)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the campaign. (Optional)
 *               estimatedEndDate:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated end date of the campaign. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - draft
 *                   - active
 *                   - closed
 *                   - historical
 *                 description: Status of the campaign. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       200:
 *         description: Campaign updated successfully
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
 *                     campaignName:
 *                       type: string
 *                     campaignCode:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     estimatedEndDate:
 *                       type: string
 *                       format: date-time
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
 *         description: Invalid input or active campaign conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *       404:
 *         description: Campaign not found
 */

export {};
