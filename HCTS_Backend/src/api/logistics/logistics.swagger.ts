/**
 * @swagger
 * tags:
 *   name: Logistics Management
 *   description: Managing Buyers, Shipment Destinations, Transport Providers, and Dispatch/Transfer Validations.
 */

/**
 * @swagger
 * /api/logistics/buyers:
 *   get:
 *     summary: List all buyers
 *     description: Retrieves the list of registered buyers. Accessible to all authenticated users.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "(Optional) Search by name, internalCode, or email"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: "(Optional) Filter buyers by status"
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
 *         description: Buyers list retrieved successfully
 *
 *   post:
 *     summary: Register a new buyer
 *     description: Enters a new buyer. Restricted to authorized logistics/admin users.
 *     tags:
 *       - Logistics Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: "* (Required) The unique name of the buyer"
 *               internalCode:
 *                 type: string
 *                 description: "(Optional) Unique code. If omitted, it will be automatically generated (e.g. BYR-XXXXXX)."
 *               contactDetails:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     description: "(Optional) Buyer contact email"
 *                   phone:
 *                     type: string
 *                     description: "(Optional) Buyer contact phone"
 *                   address:
 *                     type: string
 *                     description: "(Optional) Buyer address"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: "(Optional) The lifecycle status"
 *     responses:
 *       201:
 *         description: Buyer created successfully
 *       400:
 *         description: Duplicate name or validation error
 */

/**
 * @swagger
 * /api/logistics/buyers/{buyerId}:
 *   put:
 *     summary: Update buyer details
 *     description: Modifies contact info or status of a registered buyer.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: "* (Required) The Buyer ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "(Optional) Unique buyer name"
 *               internalCode:
 *                 type: string
 *                 description: "(Optional) Unique internal code"
 *               contactDetails:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Buyer updated successfully
 *       404:
 *         description: Buyer not found
 */

/**
 * @swagger
 * /api/logistics/destinations:
 *   get:
 *     summary: List all shipment destination centers
 *     description: Retrieves the list of registered destination centers.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "(Optional) Search by name, internalCode, or email"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: "(Optional) Filter by status"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Destinations retrieved successfully
 *
 *   post:
 *     summary: Register a new shipment destination center
 *     description: Registers a destination center.
 *     tags:
 *       - Logistics Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: "* (Required) Unique name of the center"
 *               internalCode:
 *                 type: string
 *                 description: "(Optional) Unique code. If omitted, it will be automatically generated (e.g. DST-XXXXXX)."
 *               contactDetails:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Destination center registered successfully
 */

/**
 * @swagger
 * /api/logistics/destinations/{destId}:
 *   put:
 *     summary: Update destination center details
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: destId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               internalCode:
 *                 type: string
 *               contactDetails:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Destination center updated successfully
 */

/**
 * @swagger
 * /api/logistics/transport-providers:
 *   get:
 *     summary: List transport providers
 *     description: Retrieves the list of active transport companies responsible for dispatch transfers.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "(Optional) Search by legalName or email"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transport list retrieved successfully
 *
 *   post:
 *     summary: Register a new transport provider company
 *     tags:
 *       - Logistics Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - legalName
 *             properties:
 *               legalName:
 *                 type: string
 *                 description: "* (Required) Unique legal name of the transport company"
 *               contactDetails:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Transport provider registered successfully
 */

/**
 * @swagger
 * /api/logistics/transport-providers/{providerId}:
 *   put:
 *     summary: Update transport company details
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               legalName:
 *                 type: string
 *               contactDetails:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Transport provider updated successfully
 */

/**
 * @swagger
 * /api/logistics/dispatch-notes:
 *   get:
 *     summary: List all internal dispatch notes
 *     description: Returns paginated dispatch notes. Filterable by status, campaign, and buyer.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, closed, associated_to_load_order, dispatched, pending_buyer_note, reconciled]
 *         description: Filter by dispatch note status
 *       - in: query
 *         name: campaign
 *         schema:
 *           type: string
 *         description: Filter by campaign ObjectId
 *       - in: query
 *         name: buyer
 *         schema:
 *           type: string
 *         description: Filter by buyer ObjectId
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dispatch notes list retrieved successfully
 *
 *   post:
 *     summary: Create an internal dispatch note
 *     description: |
 *       Creates a new internal Qultiva dispatch note. Auto-generates `internalNoteNumber` (IDN-0001, IDN-0002, ...).
 *       Validates that the campaign, buyer, and destination center exist and are active.
 *       Single buyer and single destination per note — this flows up to the transfer order level.
 *     tags:
 *       - Logistics Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign
 *               - buyer
 *               - destination
 *             properties:
 *               campaign:
 *                 type: string
 *                 description: "* (Required) ObjectId of the Campaign"
 *               buyer:
 *                 type: string
 *                 description: "* (Required) ObjectId of the active Buyer"
 *               destination:
 *                 type: string
 *                 description: "* (Required) ObjectId of the active Destination Center"
 *               noteDate:
 *                 type: string
 *                 format: date
 *                 description: "(Optional) Dispatch note date. Defaults to today."
 *     responses:
 *       201:
 *         description: Dispatch note created successfully
 *       400:
 *         description: Validation error — inactive buyer/destination or campaign not found
 *
 * /api/logistics/dispatch-notes/{noteId}:
 *   get:
 *     summary: Get a single dispatch note by ID
 *     description: Returns the full dispatch note with all associated bins populated (variety, crew, farm, plot, assignment, machine, operator).
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the dispatch note
 *     responses:
 *       200:
 *         description: Dispatch note retrieved successfully
 *       404:
 *         description: Dispatch note not found
 *
 *   put:
 *     summary: Edit / Update dispatch note details
 *     description: |
 *       Updates top-level details of an internal dispatch note (buyer, destination, campaign, noteDate).
 *       Validates active buyer & destination centers, and preserves Transfer Order single-buyer & single-destination invariants.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the dispatch note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campaign:
 *                 type: string
 *                 description: "(Optional) ObjectId of Campaign"
 *               buyer:
 *                 type: string
 *                 description: "(Optional) ObjectId of active Buyer"
 *               destination:
 *                 type: string
 *                 description: "(Optional) ObjectId of active Destination Center"
 *               noteDate:
 *                 type: string
 *                 format: date-time
 *                 description: "(Optional) Dispatch note date"
 *     responses:
 *       200:
 *         description: Dispatch note updated successfully
 *       400:
 *         description: Validation error or Transfer Order invariant error
 *       403:
 *         description: Forbidden — dispatch note is locked or associated with buyer delivery note
 *       404:
 *         description: Dispatch note not found
 *
 * /api/logistics/dispatch-notes/{noteId}/bins:
 *   post:
 *     summary: Associate pallet bins to a dispatch note
 *     description: |
 *       Adds one or more received pallet bins to an open (draft or closed pre-buyer) dispatch note.
 *       Rules enforced:
 *       - Bins must have QR status `Scanned at Collection Point`.
 *       - A bin can only be associated with ONE dispatch note (system blocks duplicates).
 *       - Blocked when `isAssociatedWithBuyerDeliveryNote = true` (permanently locked).
 *       - QR status updated to `Assigned to Dispatch Note` upon association.
 *       - If note is already `closed` (pre-buyer), the addition is logged in `editAuditTrail`.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
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
 *               - binIds
 *             properties:
 *               binIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Array of HarvestReceiptScan ObjectIds to associate"
 *     responses:
 *       200:
 *         description: Bins associated successfully (may include warnings for skipped bins)
 *       400:
 *         description: Validation error or all bins blocked
 *       403:
 *         description: Dispatch note is permanently locked
 *
 * /api/logistics/dispatch-notes/{noteId}/bins/{binId}:
 *   delete:
 *     summary: Remove a bin from a dispatch note (pre-buyer edit)
 *     description: |
 *       Removes a pallet bin from a dispatch note.
 *       Only allowed when `isAssociatedWithBuyerDeliveryNote = false` (pre-buyer).
 *       Edit is logged in `editAuditTrail` with user identity, timestamp, action, and reason.
 *       QR status is reversed from `Assigned to Dispatch Note` back to `Scanned at Collection Point`.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: binId
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
 *                 description: "* (Required) Reason for removing the bin (logged in audit trail)"
 *     responses:
 *       200:
 *         description: Bin removed successfully
 *       403:
 *         description: Dispatch note is permanently locked (buyer delivery note associated)
 *       404:
 *         description: Dispatch note or bin not found
 *
 * /api/logistics/dispatch-notes/{noteId}/close:
 *   post:
 *     summary: Close a dispatch note
 *     description: |
 *       Locks the dispatch note status to `closed`. Note must be in `draft` status and have at least 1 bin.
 *       After closure, bins can still be added/removed if not yet associated with a buyer delivery note.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispatch note closed successfully
 *       400:
 *         description: Note is not in draft status or has no bins
 *       403:
 *         description: Note is permanently locked
 *
 * /api/logistics/dispatch-notes/{noteId}/reopen:
 *   post:
 *     summary: Reopen a closed dispatch note (switch back to draft)
 *     description: |
 *       Switches a closed dispatch note back to `draft` status.
 *       Only permitted if `isAssociatedWithBuyerDeliveryNote === false` (pre-buyer).
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispatch note reopened successfully
 *       400:
 *         description: Note is not in closed status
 *       403:
 *         description: Note is permanently locked (associated with buyer delivery note)
 *
 * /api/logistics/dispatch-notes/{noteId}/summary:
 *   get:
 *     summary: Get dispatch note summary (JSON)
 *     description: |
 *       Computes and returns running totals for the dispatch note:
 *       pallet count by variety, estimated total weight by variety (using standard bin weight from SystemConfig),
 *       breakdown by farm/plot, by crew, by assignment, machine and operator details.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *       404:
 *         description: Dispatch note not found
 *
 * /api/logistics/dispatch-notes/{noteId}/export:
 *   get:
 *     summary: Export dispatch note summary as PDF, Excel, or CSV
 *     description: |
 *       Downloads the dispatch note summary as a printable/shareable file.
 *       - `pdf`: A4 PDF via pdfkit
 *       - `excel`: .xlsx workbook via exceljs
 *       - `csv`: Comma-separated file (variety breakdown)
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel, csv]
 *         description: Export format
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Dispatch note not found
 */

/**
 * @swagger
 * /api/logistics/transfer-orders:
 *   get:
 *     summary: List all transfer orders
 *     tags:
 *       - Logistics Management
 *     responses:
 *       200:
 *         description: Transfer orders list retrieved successfully
 *
 *   post:
 *     summary: Create a load transfer order (groups internal dispatch notes)
 *     description: |
 *       Creates a Load Transfer Order for a truck departure.
 *       Calculates **Stage 1 Forecasted Weight** (`totalPallets * estimatedAvgWeightPerPallet`).
 *       Enforces **Single Buyer & Destination Center**: All included dispatch notes must share the exact same buyer & destination.
 *     tags:
 *       - Logistics Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transportProvider
 *               - dispatchNotes
 *             properties:
 *               loadingDate:
 *                 type: string
 *                 format: date
 *                 description: Loading date
 *               departureDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Departure date and time
 *               truckLicensePlate:
 *                 type: string
 *                 description: Truck license plate number
 *               driverName:
 *                 type: string
 *                 description: "(Optional) Driver name"
 *               originCollectionPoint:
 *                 type: string
 *                 description: "(Optional) Origin collection point"
 *               transportProvider:
 *                 type: string
 *                 description: "* (Required) ObjectId of the active Transport Provider"
 *               dispatchNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "* (Required) Array of Dispatch Note ObjectIds. Must share the exact same buyer & destination center."
 *               totalPallets:
 *                 type: integer
 *                 description: "(Optional) Total pallets in shipment. If omitted, calculated from attached bins."
 *               estimatedAvgWeightPerPallet:
 *                 type: number
 *                 description: "(Optional) Custom estimated average weight per pallet in kg. If omitted, backend automatically uses live SystemConfig weight parameter."
 *     responses:
 *       201:
 *         description: Load Transfer Order created successfully with Stage 1 forecasted weight
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Transfer Order created successfully"
 *               responseObject:
 *                 _id: "6a69e1c289fce8d3e9e58901"
 *                 transferOrderNumber: "TRF-119567"
 *                 transferCode: "TRF-119567"
 *                 loadingDate: "2026-08-03T00:00:00.000Z"
 *                 departureDateTime: "2026-08-03T10:00:00.000Z"
 *                 truckLicensePlate: "TRK-001"
 *                 driverName: "Ramesh Kumar"
 *                 totalPallets: 10
 *                 estimatedAvgWeightPerPallet: 800
 *                 forecastedWeight: 8000
 *                 definitiveWeight: null
 *                 definitiveAvgWeightPerPallet: null
 *                 weightStatus: "pending_definitive"
 *                 status: "open"
 *               statusCode: 201
 *       400:
 *         description: Validation error (e.g. dispatch notes belong to different buyers/destinations or already assigned)
 *
 * /api/logistics/transfer-orders/{id}:
 *   get:
 *     summary: Get load transfer order details by ID
 *     description: Returns full details of a Transfer Order including populated buyer, destination center, transport provider, and included dispatch notes with bins.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the Transfer Order
 *     responses:
 *       200:
 *         description: Transfer Order details retrieved successfully
 *       404:
 *         description: Transfer Order not found
 *
 * /api/logistics/transfer-orders/{id}/status:
 *   patch:
 *     summary: Update transfer order status and propagate to dispatch notes
 *     description: |
 *       Updates status (`open`, `loaded`, `dispatched`, `partially_reconciled`, `reconciled`, `closed`).
 *       When updated to `dispatched`, `reconciled`, or `closed`, all included dispatch notes automatically inherit the status.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the Transfer Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, loaded, dispatched, partially_reconciled, reconciled, closed]
 *     responses:
 *       200:
 *         description: Status updated and inherited successfully
 *       400:
 *         description: Invalid status value
 *
 * /api/logistics/transfer-orders/{id}/weight:
 *   patch:
 *     summary: Record Stage 2 Definitive Scale Weight
 *     description: |
 *       Enters the scale weight from the buyer/provider delivery note (*albarán*).
 *       Updates `definitiveAvgWeightPerPallet` and sets `weightStatus` to `'definitive'`, superseding the preliminary forecasted weight.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the Transfer Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - definitiveWeight
 *             properties:
 *               definitiveWeight:
 *                 type: number
 *                 description: Total scale weight of the shipment in kg
 *     responses:
 *       200:
 *         description: Definitive weight recorded successfully and supersedes forecasted weight
 *       400:
 *         description: Invalid weight value
 *
 * /api/logistics/transfer-orders/{id}/export:
 *   get:
 *     summary: Export / Download Albarán de Entrega (Delivery Note PDF)
 *     description: |
 *       Generates and streams the official PDF delivery note ("Albarán de Entrega") for a Transfer Order upon departure.
 *       Includes Header (Qultiva Farms), Date/Departure, Vehicle & Driver info, Recipient details, Included Dispatch Notes table, Total summary, and Signature blocks.
 *     tags:
 *       - Logistics Management
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the Transfer Order
 *     responses:
 *       200:
 *         description: PDF file stream of Albarán de Entrega
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Transfer Order not found
 */
