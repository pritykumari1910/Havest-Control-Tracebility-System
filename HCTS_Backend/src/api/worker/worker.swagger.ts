/**
 * @swagger
 * /api/workers:
 *   post:
 *     summary: Register a new worker
 *     description: |
 *       Registers a new worker linked to an external employment company. The DNI/NIE number must be unique.
 *       Requires **System Administrator** role.
 *     tags:
 *       - Workers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - documentIdType
 *               - documentIdNumber
 *               - employmentCompany
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Worker's first name. (Required)
 *               lastName:
 *                 type: string
 *                 description: Worker's last name. (Required)
 *               documentIdType:
 *                 type: string
 *                 enum:
 *                   - DNI
 *                   - NIE
 *                 description: Type of identity document. (Required)
 *               documentIdNumber:
 *                 type: string
 *                 description: Identity document number (unique). (Required)
 *               employmentCompany:
 *                 type: string
 *                 description: ObjectId of the Employment Company. (Required)
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number. (Optional)
 *               email:
 *                 type: string
 *                 description: Email address. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the worker. (Optional)
 *     responses:
 *       201:
 *         description: Worker created successfully
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     documentIdType:
 *                       type: string
 *                     documentIdNumber:
 *                       type: string
 *                     employmentCompany:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
 *                     registrationDate:
 *                       type: string
 *                       format: date-time
 *                     status:
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
 *         description: Invalid input, employment company not found/inactive, or duplicate DNI/NIE document number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *
 *   get:
 *     summary: List workers
 *     description: Retrieves a paginated list of workers, optionally filtered by company, status, and document type. Accessible to all authenticated users.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: query
 *         name: employmentCompany
 *         schema:
 *           type: string
 *         description: Filter workers by Employment Company ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter workers by status
 *       - in: query
 *         name: documentIdType
 *         schema:
 *           type: string
 *           enum:
 *             - DNI
 *             - NIE
 *         description: Filter workers by identity document type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or document ID number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page (default is 10)
 *     responses:
 *       200:
 *         description: Workers fetched successfully
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
 *                     workers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           documentIdType:
 *                             type: string
 *                           documentIdNumber:
 *                             type: string
 *                           employmentCompany:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               companyName:
 *                                 type: string
 *                           phoneNumber:
 *                             type: string
 *                           email:
 *                             type: string
 *                           registrationDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *
 * /api/workers/company/{companyId}:
 *   get:
 *     summary: List workers by employment company
 *     description: Retrieves a list of active or registered workers for a specific employment company. Supporting pagination.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The employment company ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of workers per page
 *     responses:
 *       200:
 *         description: Workers fetched successfully
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
 *                     workers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *
 * /api/workers/{workerId}:
 *   get:
 *     summary: Get worker details
 *     description: Retrieves details of a specific worker by ID. Accessible to all authenticated users.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The worker ID
 *     responses:
 *       200:
 *         description: Worker fetched successfully
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     documentIdType:
 *                       type: string
 *                     documentIdNumber:
 *                       type: string
 *                     employmentCompany:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         companyName:
 *                           type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
 *                     registrationDate:
 *                       type: string
 *                       format: date-time
 *                     status:
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
 *         description: Worker not found
 *
 *   patch:
 *     summary: Update worker details
 *     description: |
 *       Edits worker registration details or status.
 *       Requires **System Administrator** role.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The worker ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name. (Optional)
 *               lastName:
 *                 type: string
 *                 description: Last name. (Optional)
 *               documentIdType:
 *                 type: string
 *                 enum:
 *                   - DNI
 *                   - NIE
 *                 description: Identity document type. (Optional)
 *               documentIdNumber:
 *                 type: string
 *                 description: Identity document number. (Optional)
 *               employmentCompany:
 *                 type: string
 *                 description: ObjectId of the Employment Company. (Optional)
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number. (Optional)
 *               email:
 *                 type: string
 *                 description: Email address. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 description: Status of the worker. (Optional)
 *     responses:
 *       200:
 *         description: Worker updated successfully
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     documentIdType:
 *                       type: string
 *                     documentIdNumber:
 *                       type: string
 *                     employmentCompany:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
 *                     registrationDate:
 *                       type: string
 *                       format: date-time
 *                     status:
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
 *         description: Invalid input, parent company inactive/not found, or document number duplicate
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *       404:
 *         description: Worker not found
 *
 * /api/workers/qr/booklet:
 *   get:
 *     summary: Download PDF booklet of all active workers
 *     description: |
 *       Generates a printable PDF booklet of all active workers. The booklet groups workers by employment company
 *       and sorts them alphabetically by last name (then first name).
 *       Accessible to all authenticated users.
 *     tags:
 *       - Workers
 *     responses:
 *       200:
 *         description: Booklet PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active workers found to generate booklet
 *
 * /api/workers/qr/scan/{qrCode}:
 *   get:
 *     summary: Scan and lookup active worker by QR code value
 *     description: |
 *       Searches the database for an active worker matching the provided unique QR code value.
 *       Returns the worker's full details (with populated employment company details).
 *       Accessible to all authenticated users.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique QR code value (e.g. WQR-550e8400-e29b-41d4-a716-446655440000)
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Target date to verify duplicate crew or satellite staff assignment (defaults to today). (Optional)
 *     responses:
 *       200:
 *         description: Worker scanned successfully and available for crew assignment
 *       400:
 *         description: Validation Error - Worker is already assigned to another crew or satellite staff today
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     documentIdType:
 *                       type: string
 *                     documentIdNumber:
 *                       type: string
 *                     employmentCompany:
 *                       type: object
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker not found or inactive

 *
 * /api/workers/{workerId}/qr:
 *   get:
 *     summary: Get worker QR code metadata & base64 image
 *     description: |
 *       Retrieves information about a worker's QR card, including details like name, company, unique QR code string,
 *       and a base64 encoded data URI representation of the QR code image.
 *       Accessible to all authenticated users.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The worker ID
 *     responses:
 *       200:
 *         description: Worker QR card details fetched successfully
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
 *                     worker:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         documentIdType:
 *                           type: string
 *                         documentIdNumber:
 *                           type: string
 *                         employmentCompany:
 *                           type: string
 *                         qrCode:
 *                           type: string
 *                         qrDataUri:
 *                           type: string
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker not found
 *
 * /api/workers/{workerId}/qr/download:
 *   get:
 *     summary: Download individual printable PDF QR card
 *     description: |
 *       Generates and streams a printable individual A6-sized PDF QR card showing the worker's name, DNI/NIE, company, and QR code.
 *       Accessible to all authenticated users.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The worker ID
 *     responses:
 *       200:
 *         description: Worker PDF QR Card generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker not found
 *
 * /api/workers/{workerId}/qr/regenerate:
 *   post:
 *     summary: Regenerate worker's permanent QR code identifier
 *     description: |
 *       Invalidates the worker's current permanent QR code identifier and generates a brand new one.
 *       Requires **System Administrator** role.
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The worker ID
 *     responses:
 *       200:
 *         description: Worker QR code regenerated successfully
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
 *                 statusCode:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *       404:
 *         description: Worker not found
 */

export {};
