/**
 * @swagger
 * tags:
 *   name: Harvest Forecast Management
 *   description: Managing geographic harvest forecasts, bulk uploads, and comparative progress views.
 */

/**
 * @swagger
 * /api/harvest-forecast:
 *   get:
 *     summary: List harvest forecasts
 *     description: Retrieves a list of harvest forecasts, optionally filtered by campaign, farm, plot, and variety. Accessible to all authenticated users.
 *     tags:
 *       - Harvest Forecast Management
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter by campaign ID"
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter by farm ID"
 *       - in: query
 *         name: plotId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter by plot ID"
 *       - in: query
 *         name: varietyId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter by variety ID"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - draft
 *             - validated
 *             - closed
 *             - revised
 *         description: "(Optional) Filter by status"
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
 *         description: Forecasts list retrieved successfully
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     summary: Create harvest forecast manually
 *     description: Enters a new expected production estimate, validating geographic hierarchy rules. Restricted to Farm Manager and Operations Director.
 *     tags:
 *       - Harvest Forecast Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign
 *               - farm
 *               - plot
 *               - variety
 *               - surfaceArea
 *               - estimatedKg
 *             properties:
 *               campaign:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Campaign"
 *               farm:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Farm"
 *               plot:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Plot (must belong to Farm)"
 *               valve:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Valve (must belong to Plot)"
 *                 nullable: true
 *               park:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Park (must match hierarchy)"
 *                 nullable: true
 *               variety:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Variety (must match Plot configurations)"
 *               surfaceArea:
 *                 type: number
 *                 description: "* (Required) Associated surface area in hectares (ha)"
 *               estimatedKg:
 *                 type: number
 *                 description: "* (Required) Estimated weight in kilograms (kg)"
 *               recordDate:
 *                 type: string
 *                 format: date-time
 *                 description: "(Optional) Date of registration record"
 *               responsiblePerson:
 *                 type: string
 *                 description: "(Auto-populated) ID of the user who created or updated the forecast record"
 *               status:
 *                 type: string
 *                 enum:
 *                   - draft
 *                   - validated
 *                   - closed
 *                   - revised
 *                 default: draft
 *                 description: "(Optional) Lifecycle status of the forecast record"
 *               comments:
 *                 type: string
 *                 description: "(Optional) Explanatory comments"
 *     responses:
 *       201:
 *         description: Forecast created successfully
 *       400:
 *         description: Hierarchy validation failed or duplicate entry combination
 *       403:
 *         description: Forbidden (insufficient permissions)
 */

/**
 * @swagger
 * /api/harvest-forecast/{forecastId}:
 *   put:
 *     summary: Update harvest forecast details
 *     description: Modifies forecast parameters manually, re-checking hierarchy constraints. Restricted to Farm Manager and Operations Director.
 *     tags:
 *       - Harvest Forecast Management
 *     parameters:
 *       - in: path
 *         name: forecastId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The forecast ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campaign:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Campaign"
 *               farm:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Farm"
 *               plot:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Plot"
 *               valve:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Valve"
 *                 nullable: true
 *               park:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Park"
 *                 nullable: true
 *               variety:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Variety"
 *               surfaceArea:
 *                 type: number
 *                 description: "(Optional) Surface area in hectares (ha)"
 *               estimatedKg:
 *                 type: number
 *                 description: "(Optional) Estimated weight in kg"
 *               recordDate:
 *                 type: string
 *                 format: date-time
 *                 description: "(Optional) Record date"
 *               responsiblePerson:
 *                 type: string
 *                 description: "(Optional) Responsible staff"
 *               status:
 *                 type: string
 *                 enum:
 *                   - draft
 *                   - validated
 *                   - closed
 *                   - revised
 *                 description: "(Optional) Lifecycle status"
 *               comments:
 *                 type: string
 *                 description: "(Optional) Comments"
 *     responses:
 *       200:
 *         description: Forecast updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Forecast not found
 */

/**
 * @swagger
 * /api/harvest-forecast/bulk-upload:
 *   post:
 *     summary: Bulk upload forecasts
 *     description: Uploads and validates bulk forecast records via Excel/CSV templates. Restricted to Farm Manager and Operations Director.
 *     tags:
 *       - Harvest Forecast Management
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "* (Required) Excel or CSV template file to upload"
 *     responses:
 *       201:
 *         description: Bulk upload parsed and saved successfully
 *       400:
 *         description: Validation errors report (lists row-by-row failures; partial uploads rejected)
 */

/**
 * @swagger
 * /api/harvest-forecast/progress-dashboard:
 *   get:
 *     summary: Forecast vs. Actual Progress Dashboard
 *     description: Compares forecasted weights against actual harvested receipt weights, calculating percentage progresses per Campaign, Farm, Plot, and Variety.
 *     tags:
 *       - Harvest Forecast Management
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter progress results by campaign ID"
 *     responses:
 *       200:
 *         description: Dashboard progress analytics fetched successfully
 */

/**
 * @swagger
 * /api/harvest-forecast/mock-receipts:
 *   post:
 *     summary: Seed mock harvested weights
 *     description: Helper to log actual harvested weights (pallet receipts) to verify comparative progress dashboard charts. Restricted to Farm Manager and Operations Director.
 *     tags:
 *       - Harvest Forecast Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign
 *               - farm
 *               - plot
 *               - variety
 *               - harvestedKg
 *             properties:
 *               campaign:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Campaign"
 *               farm:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Farm"
 *               plot:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Plot"
 *               valve:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Valve"
 *                 nullable: true
 *               park:
 *                 type: string
 *                 description: "(Optional) ObjectId of the Park"
 *                 nullable: true
 *               variety:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Variety"
 *               harvestedKg:
 *                 type: number
 *                 description: "* (Required) Actual weight of harvested fruit in kilograms (kg)"
 *     responses:
 *       201:
 *         description: Mock receipt logged successfully
 */
