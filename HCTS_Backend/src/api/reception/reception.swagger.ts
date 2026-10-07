/**
 * @swagger
 * tags:
 *   name: Collection Point Reception
 *   description: Session-based reception batches and harvested pallet bin QR scanning at the collection point
 */

/**
 * @swagger
 * /api/reception/batches:
 *   post:
 *     summary: Open a new collection point reception batch
 *     description: |
 *       Opens a new reception session batch for receiving bins from the field.
 *       Requires choosing a machine (from active machine master) and actual operator (from user master).
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Collection Point Reception
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - machineId
 *               - operatorId
 *             properties:
 *               machineId:
 *                 type: string
 *                 description: ObjectId of the transporting machine
 *               operatorId:
 *                 type: string
 *                 description: User ObjectId of the machine operator for this batch
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of reception (defaults to today)
 *     responses:
 *       201:
 *         description: Reception batch opened successfully
 *       400:
 *         description: Validation error or inactive campaign/machine/operator
 *
 *   get:
 *     summary: List reception batches
 *     tags:
 *       - Collection Point Reception
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
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
 *         description: List of reception batches retrieved successfully
 *
 * /api/reception/batches/{batchId}/scan:
 *   post:
 *     summary: Scan and receive a harvested bin QR code
 *     description: |
 *       Scans each pallet bin's QR code using camera or Bluetooth handheld scanner.
 *       Registers the bin as received at the collection point and auto-records: `machine`, `operator`, `campaign`, `workDate`, `crew`, `harvestAssignment`, `farm`, `plot`, `valve`, `workZone`, and `variety` — all inherited from the QR-to-assignment mapping and reception batch context.
 *       Each pallet bin carries a single variety (mixed variety bins do not occur). Variety is permanently fixed at scan time and cannot be changed after receipt.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Collection Point Reception
 *     parameters:
 *       - in: path
 *         name: batchId
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
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *                 description: The raw QR code text scanned from the pallet bin
 *     responses:
 *       201:
 *         description: Harvest bin received and logged successfully
 *       400:
 *         description: |
 *           Scan validation failed. Error messages:
 *           - "QR code does not exist in system inventory."
 *           - "QR code is not assigned to a harvest assignment."
 *           - "QR code is [status] and cannot be received."
 *           - "Duplicate Scan: QR '[qrCode]' was already scanned in batch '[batchCode]' by operator '[operatorName]' on '[scannedAt]'."
 *           - "QR code is already in a closed dispatch note."
 *           - "QR code has already been scanned in this reception batch."
 *
 * /api/reception/batches/{batchId}/close:
 *   post:
 *     summary: Close a reception batch
 *     description: |
 *       Closes an open reception session batch. No further bins can be scanned into it.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Collection Point Reception
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reception batch closed successfully
 *       400:
 *         description: Batch already closed
 *
 * /api/reception/batches/{batchId}/scans:
 *   get:
 *     summary: Get all successfully received scans inside a batch
 *     tags:
 *       - Collection Point Reception
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of scanned bin receipt logs retrieved successfully
 *
 * /api/reception/batches/{batchId}:
 *   patch:
 *     summary: Update a reception batch
 *     description: |
 *       Updates the machine, operator, workDate, or status of an existing reception batch.
 *       A closed batch can only be re-opened via this endpoint (set `status: open`).
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Collection Point Reception
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId of the reception batch to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               machineId:
 *                 type: string
 *                 description: New machine ObjectId (must be an active machine)
 *               operatorId:
 *                 type: string
 *                 description: New operator ObjectId (must be an active operator)
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: New work date for this batch
 *               status:
 *                 type: string
 *                 enum: [open, closed]
 *                 description: Set to 'open' to reopen a closed batch
 *     responses:
 *       200:
 *         description: Reception batch updated successfully
 *       400:
 *         description: Validation error or batch is closed (and not being reopened)
 *       404:
 *         description: Reception batch not found
 */

/**
 * @swagger
 * /api/reception/received-inventory:
 *   get:
 *     summary: View received bin inventory with running totals and filters
 *     description: |
 *       Returns a paginated list of all received harvested bins for a batch, crew, machine, variety, or date.
 *       Includes running totals: total pallet count, pallet count per variety, total estimated weight (kg), and weight breakdown per variety.
 *     tags:
 *       - Collection Point Reception
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: Filter by reception batch ObjectId
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *         description: Filter by crew ObjectId
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by machine ObjectId
 *       - in: query
 *         name: varietyId
 *         schema:
 *           type: string
 *         description: Filter by avocado variety ObjectId
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
 *         description: Received bin inventory retrieved successfully
 *
 * /api/reception/incidents:
 *   post:
 *     summary: Log an operational incident against a pallet bin
 *     description: |
 *       Records an operational issue encountered during reception or loading against a specific pallet bin QR code.
 *       Supports categories such as missing QR label, damaged label, damaged bin, dirty fruit, mixed varieties, etc.
 *       Mixed varieties category automatically flags the incident for supervisor review.
 *     tags:
 *       - Collection Point Reception
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *               - category
 *             properties:
 *               qrCode:
 *                 type: string
 *                 description: Pallet bin QR code
 *                 example: QR-000247
 *               receptionBatchId:
 *                 type: string
 *                 description: Optional reception batch ObjectId
 *               category:
 *                 type: string
 *                 enum:
 *                   - missing_qr_label
 *                   - damaged_unreadable_label
 *                   - single_label_present
 *                   - damaged_pallet_bin
 *                   - damaged_dirty_fruit
 *                   - mixed_varieties
 *                   - pallet_outside_assigned_zone
 *                   - handling_issue
 *                   - other
 *                 description: Category of the incident
 *               comments:
 *                 type: string
 *                 description: Optional free-text comment describing the issue
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: -12.046374
 *                   longitude:
 *                     type: number
 *                     example: -77.042793
 *                 description: Optional geolocation coordinates where the incident was logged
 *     responses:
 *       201:
 *         description: Pallet bin incident logged successfully
 *       400:
 *         description: Validation error or invalid category
 *
 *   get:
 *     summary: List logged pallet bin incidents
 *     description: Returns a paginated list of logged incidents, filterable by QR code, reception batch, category, or date.
 *     tags:
 *       - Collection Point Reception
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: qrCode
 *         schema:
 *           type: string
 *         description: Filter by QR code
 *       - in: query
 *         name: receptionBatchId
 *         schema:
 *           type: string
 *         description: Filter by reception batch ObjectId
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by incident category
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by incident date (YYYY-MM-DD)
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
 *         description: Incidents retrieved successfully
 */

export {};
