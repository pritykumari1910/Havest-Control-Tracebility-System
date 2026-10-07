/**
 * @swagger
 * tags:
 *   name: Reports & Analytics
 *   description: Harvest progress reports, multi-format exports (Excel, CSV, PDF), and forecast vs actual analytics.
 */

/**
 * @swagger
 * /api/reports/harvest-progress:
 *   get:
 *     summary: Get harvest progress report data
 *     description: |
 *       Detailed harvested weight (kg) breakdown grouped by crew, harvest assignment, variety, farm, plot, valve, park, or campaign.
 *       Supports multi-criteria filtering by date range, farm, plot, variety, crew, and supervisor.
 *       Restricted to **System Administrator**, **Field Engineer**, and **Farm Manager** roles.
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: Filter by farm ObjectId
 *       - in: query
 *         name: plotId
 *         schema:
 *           type: string
 *         description: Filter by plot ObjectId
 *       - in: query
 *         name: varietyId
 *         schema:
 *           type: string
 *         description: Filter by variety ObjectId
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *         description: Filter by crew ObjectId
 *       - in: query
 *         name: supervisorId
 *         schema:
 *           type: string
 *         description: Filter by supervisor/manijero User ObjectId
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [crew, assignment, variety, farm, plot, valve, park, campaign]
 *           default: assignment
 *         description: Field to group report calculations by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Harvest progress report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */

/**
 * @swagger
 * /api/reports/harvest-progress/export:
 *   get:
 *     summary: Export harvest progress report file (Excel, CSV, PDF)
 *     description: |
 *       Download structured harvest progress report as Excel (.xlsx), CSV (.csv), or printable PDF (.pdf).
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv, pdf]
 *           default: excel
 *         description: Export file format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *       - in: query
 *         name: plotId
 *         schema:
 *           type: string
 *       - in: query
 *         name: varietyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [crew, assignment, variety, farm, plot, valve, park, campaign]
 *     responses:
 *       200:
 *         description: File stream attachment (.xlsx, .csv, or .pdf)
 */

/**
 * @swagger
 * /api/reports/forecast-vs-actual:
 *   get:
 *     summary: Forecast vs. Actual harvest yield comparison
 *     description: |
 *       Comparison of forecasted target yield (kg) vs. actual harvested weight (kg) by period (daily, weekly, monthly) and geographic unit (farm, plot).
 *       Calculates Variance (kg) and Fulfillment Percentage.
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *       - in: query
 *         name: plotId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Forecast vs Actual comparison retrieved successfully
 */

/**
 * @swagger
 * /api/reports/harvest-receipt-scans:
 *   get:
 *     summary: pallet bin traceability report
 *     description: |
 *       Lists received QR scans with reception batch, harvest assignment, machine, operator,
 *       crew, farm, plot, valve, zone type, variety, timestamp, and campaign dispatch note details.
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: qrCode
 *         schema:
 *           type: string
 *         description: Partial QR code filter
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *         description: Filter by crew ObjectId
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by reception batch machine ObjectId
 *       - in: query
 *         name: varietyId
 *         schema:
 *           type: string
 *         description: Filter by harvest assignment variety ObjectId
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: Filter by harvest assignment farm ObjectId
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Exact scan date filter. Takes precedence over startDate/endDate.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Scan start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Scan end date filter
 *       - in: query
 *         name: dispatchNoteStatus
 *         schema:
 *           type: string
 *           enum: [draft, closed, associated_to_load_order, dispatched, pending_buyer_note, reconciled]
 *         description: Filter by dispatch note status matched through harvest assignment campaign
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Harvest receipt scan report retrieved successfully
 */

/**
 * @swagger
 * /api/reports/transfer-orders:
 *   get:
 *     summary: Get transfer order report
 *     description: |
 *       Lists transfer orders with buyer, destination, transport provider, status, timestamp,
 *       related dispatch note statuses, dispatch note bin counts, total bins, and flags for
 *       dispatch notes edited after closure.
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Exact transfer order creation date. Takes precedence over startDate/endDate.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Transfer order creation start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Transfer order creation end date
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ObjectId
 *       - in: query
 *         name: destinationId
 *         schema:
 *           type: string
 *         description: Filter by destination center ObjectId
 *       - in: query
 *         name: transportProviderId
 *         schema:
 *           type: string
 *         description: Filter by transport provider ObjectId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by transfer order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Transfer order report retrieved successfully
 */

/**
 * @swagger
 * /api/reports/dispatch-notes:
 *   get:
 *     summary: Get dispatch notes report & analytics
 *     description: |
 *       Retrieves comprehensive Dispatch Note reports with KPI aggregates (total dispatch notes,
 *       total pallet bins, total estimated weight, status breakdown counts) and paginated records.
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by exact note date (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by Buyer ObjectId
 *       - in: query
 *         name: destinationId
 *         schema:
 *           type: string
 *         description: Filter by Destination Center ObjectId
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: Filter by Campaign ObjectId
 *       - in: query
 *         name: transportProviderId
 *         schema:
 *           type: string
 *         description: Filter by Transport Provider ObjectId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, closed, associated_to_load_order, dispatched, pending_buyer_note, reconciled]
 *         description: Filter by Dispatch Note status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by note number / code
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
 *         description: Dispatch note report retrieved successfully
 *
 * /api/reports/dispatch-notes/export:
 *   get:
 *     summary: Export dispatch notes report (Excel / CSV)
 *     description: |
 *       Exports aggregated Dispatch Note report data to Excel (.xlsx) or CSV format.
 *     tags: [Reports & Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *           default: excel
 *         description: Export file format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: destinationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, closed, associated_to_load_order, dispatched, pending_buyer_note, reconciled]
 *     responses:
 *       200:
 *         description: Report file exported successfully
 */
