/**
 * @swagger
 * tags:
 *   name: QR Series Management
 *   description: Defining, generating, exporting, and tracking QR ranges for harvesting pallet bins.
 */

/**
 * @swagger
 * /api/qr-series:
 *   get:
 *     summary: List QR code series
 *     description: Retrieves a list of all QR code series. Accessible to all authenticated users.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - Draft
 *             - Generated
 *             - Sent to Printer
 *             - Received
 *             - Active
 *             - Exhausted
 *             - Cancelled
 *         description: (Optional) Filter series by lifecycle status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: (Optional) Search by series name or codes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: (Optional) Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: (Optional) Page limit
 *     responses:
 *       200:
 *         description: QR code series list retrieved successfully
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     summary: Generate sequential QR code series
 *     description: Creates a new QR code series, validating that there is no overlap in ranges. Restricted to System Administrator and Farm Manager.
 *     tags:
 *       - QR Series Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seriesName
 *               - startNumber
 *               - endNumber
 *             properties:
 *               seriesName:
 *                 type: string
 *                 description: "* (Required) Unique identifier/name of the series"
 *               startNumber:
 *                 type: integer
 *                 description: "* (Required) Lower bound index (positive integer >= 1)"
 *               endNumber:
 *                 type: integer
 *                 description: "* (Required) Upper bound index (must be >= startNumber)"
 *               comments:
 *                 type: string
 *                 description: "(Optional) Additional comments or instructions"
 *     responses:
 *       201:
 *         description: Series generated successfully (Draft)
 *       400:
 *         description: Overlapping range or invalid range numbers
 *       403:
 *         description: Forbidden (insufficient permissions)
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}:
 *   get:
 *     summary: Get QR code series details
 *     description: Retrieves the detailed record of a specific QR code series by its ID.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: Series details retrieved successfully
 *       404:
 *         description: Series not found
 *
 *   patch:
 *     summary: Update QR code series details
 *     description: Updates the series name, comments, and/or printer name. Restricted to System Administrator and Farm Manager.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seriesName:
 *                 type: string
 *                 description: "New unique name for the series"
 *               comments:
 *                 type: string
 *                 description: "Updated comments"
 *               printerName:
 *                 type: string
 *                 description: "Updated printer/provider name"
 *     responses:
 *       200:
 *         description: QR code series updated successfully
 *       400:
 *         description: Invalid input or duplicate series name
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/printer-order:
 *   put:
 *     summary: Track print supplier order
 *     description: Updates tracking information for printing order. Restricted to System Administrator and Farm Manager.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sentToPrinterDate:
 *                 type: string
 *                 format: date-time
 *                 description: "(Optional) Date sent to print supplier"
 *               printerName:
 *                 type: string
 *                 description: "(Optional) Name of the printer/provider"
 *               fileReference:
 *                 type: string
 *                 description: "(Optional) External file reference or order index"
 *               printerStatus:
 *                 type: string
 *                 enum:
 *                   - sent
 *                   - in production
 *                   - received
 *                   - with issue
 *                 description: "(Optional) Print supplier tracking status"
 *     responses:
 *       200:
 *         description: Printer order tracking updated successfully
 *       400:
 *         description: Invalid state transitions
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/receipt:
 *   put:
 *     summary: Register receipt of printed stickers
 *     description: Logs details of quality checks and receipt quantities for printed labels. Restricted to System Administrator and Farm Manager.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateReceived:
 *                 type: string
 *                 format: date-time
 *                 description: "(Optional) Date received"
 *               quantityReceived:
 *                 type: integer
 *                 description: "(Optional) Quantity of labels received"
 *               responsiblePerson:
 *                 type: string
 *                 description: "(Optional) Personnel who received the shipment"
 *               printingIssues:
 *                 type: string
 *                 description: "(Optional) Description of print defects/issues"
 *               qualityCheckResult:
 *                 type: string
 *                 description: "(Optional) Status of visual/quality checks"
 *     responses:
 *       200:
 *         description: Receipt logged successfully
 *       400:
 *         description: Invalid state transitions
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/activate:
 *   patch:
 *     summary: Activate QR series
 *     description: Activates the series, making all individual QR codes available for field assignment. Restricted to System Administrator and Farm Manager.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: Series activated successfully
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/cancel:
 *   patch:
 *     summary: Cancel QR series
 *     description: Cancels the series and marks all unassigned QR codes as Cancelled. Restricted to System Administrator and Farm Manager.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: Series cancelled successfully
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/export/csv:
 *   get:
 *     summary: Export QR codes as CSV
 *     description: Downloads a CSV sheet listing the range of generated alphanumeric codes. Web-only feature.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: CSV file download stream
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/export/pdf:
 *   get:
 *     summary: Export QR codes as print-ready PDF
 *     description: Generates a PDF sheet containing layout labels (2 identical stickers per QR code). Web-only feature.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: PDF file download stream
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/export/zip:
 *   get:
 *     summary: Export QR codes as ZIP archive of PNGs
 *     description: Generates a ZIP archive containing individual PNG graphics of each code in the series. Web-only feature.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: ZIP file download stream
 *       404:
 *         description: Series not found
 */

/**
 * @swagger
 * /api/qr-series/dashboard/inventory:
 *   get:
 *     summary: QR Code Inventory Status Dashboard
 *     description: Filterable inventory dashboard to track every individual QR code's status and assignment.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: query
 *         name: seriesId
 *         schema:
 *           type: string
 *         description: "(Optional) Filter items belonging to a specific series"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - Generated
 *             - Available
 *             - Assigned
 *             - Used
 *             - Scanned at Collection Point
 *             - Assigned to Dispatch Note
 *             - Dispatched
 *             - Returned
 *             - Damaged
 *             - Lost
 *             - Cancelled
 *         description: "(Optional) Filter by individual QR lifecycle status"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "(Optional) Lower boundary creation date filter"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "(Optional) Upper boundary creation date filter"
 *       - in: query
 *         name: harvestAssignmentId
 *         schema:
 *           type: string
 *         description: "(Optional) Search by specific harvest event or bin assignment"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "(Optional) Page index"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "(Optional) Page size"
 *     responses:
 *       200:
 *         description: Inventory list fetched successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/qr-series/{seriesId}/dashboard/summary:
 *   get:
 *     summary: QR Series status summary counters
 *     description: Returns aggregated status summaries (available, used, lost, etc.) for a series.
 *     tags:
 *       - QR Series Management
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The series ID"
 *     responses:
 *       200:
 *         description: Summary counters retrieved successfully
 *       404:
 *         description: Series not found
 */
