/**
 * @swagger
 * tags:
 *   name: Unassigned Bin Queue
 *   description: Manual review and resolution of pallet bins that could not be matched to an active harvest assignment at scan time
 */

/**
 * @swagger
 * /api/unassigned-bin-queue/stats:
 *   get:
 *     summary: Get aggregate counts for the unassigned bin queue
 *     tags: [Unassigned Bin Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: Filter by campaign ID (optional — defaults to all campaigns)
 *     responses:
 *       200:
 *         description: Queue stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending:
 *                   type: integer
 *                 resolved:
 *                   type: integer
 *                 rejected:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 hasUnresolved:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/unassigned-bin-queue:
 *   get:
 *     summary: List unassigned bin queue entries (paginated)
 *     tags: [Unassigned Bin Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, resolved, rejected]
 *       - in: query
 *         name: failureReason
 *         schema:
 *           type: string
 *           enum: [no_assignment, assignment_not_found, crew_inactive]
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by scan date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of queue entries
 */

/**
 * @swagger
 * /api/unassigned-bin-queue/{queueItemId}:
 *   get:
 *     summary: Get full detail of a single queue entry
 *     tags: [Unassigned Bin Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueItemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue item detail with full populate
 *       404:
 *         description: Queue item not found
 */

/**
 * @swagger
 * /api/unassigned-bin-queue/{queueItemId}/resolve:
 *   patch:
 *     summary: Manually assign a queued bin to an active harvest assignment
 *     description: |
 *       Resolves a pending bin by linking it to the specified harvest assignment.
 *       Creates a HarvestReceiptScan and updates QrInventory status — bin enters the normal harvest flow.
 *       Every resolution is permanently recorded in the audit trail.
 *     tags: [Unassigned Bin Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueItemId
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
 *               - harvestAssignmentId
 *             properties:
 *               harvestAssignmentId:
 *                 type: string
 *                 description: ID of the active harvest assignment to assign this bin to
 *               note:
 *                 type: string
 *                 description: Optional reason or note for this resolution
 *     responses:
 *       200:
 *         description: Bin resolved and added to harvest flow
 *       400:
 *         description: Item already resolved/rejected, or assignment not active
 *       404:
 *         description: Queue item or harvest assignment not found
 */

/**
 * @swagger
 * /api/unassigned-bin-queue/{queueItemId}/reject:
 *   patch:
 *     summary: Reject a queued bin (will not enter harvest flow)
 *     description: |
 *       Permanently marks a bin as rejected. QR code status is not changed.
 *       A mandatory reason must be provided and is stored in the audit trail.
 *     tags: [Unassigned Bin Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueItemId
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Mandatory reason for rejecting this bin
 *     responses:
 *       200:
 *         description: Queue item rejected
 *       400:
 *         description: Item already resolved/rejected
 *       404:
 *         description: Queue item not found
 */
