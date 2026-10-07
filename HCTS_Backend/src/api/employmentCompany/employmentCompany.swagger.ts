/**
 * @swagger
 * /api/employment-companies:
 *   post:
 *     summary: Register an external labour company
 *     description: |
 *       Creates a new external employment company record.
 *       Requires **System Administrator** role.
 *     tags:
 *       - Employment Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - taxId
 *               - contactPerson
 *               - phoneNumber
 *             properties:
 *               companyName:
 *                 type: string
 *                 description: Unique name of the company. (Required)
 *               taxId:
 *                 type: string
 *                 description: CIF/NIF of the company. (Required)
 *               contactPerson:
 *                 type: string
 *                 description: Name of the contact person. (Required)
 *               phoneNumber:
 *                 type: string
 *                 description: Contact phone number. (Required)
 *               email:
 *                 type: string
 *                 description: Email address of the company. (Optional)
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 description: Status of the company. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       201:
 *         description: Employment company created successfully
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
 *                     companyName:
 *                       type: string
 *                     taxId:
 *                       type: string
 *                     contactPerson:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
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
 *         description: Invalid input, company name already exists, or tax ID duplicate
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *
 *   get:
 *     summary: List external labour companies
 *     description: Retrieves a list of registered external labour companies. Accessible to all authenticated users.
 *     tags:
 *       - Employment Companies
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *         description: Filter companies by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or tax ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number (Optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: The number of companies per page (Optional)
 *     responses:
 *       200:
 *         description: Employment companies fetched successfully
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
 *                     companies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           companyName:
 *                             type: string
 *                           taxId:
 *                             type: string
 *                           contactPerson:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                           comments:
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
 * /api/employment-companies/{companyId}:
 *   get:
 *     summary: Get employment company details
 *     description: Retrieves details of a specific employment company by ID. Accessible to all authenticated users.
 *     tags:
 *       - Employment Companies
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The company ID
 *     responses:
 *       200:
 *         description: Employment company fetched successfully
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
 *                     companyName:
 *                       type: string
 *                     taxId:
 *                       type: string
 *                     contactPerson:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
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
 *         description: Employment company not found
 *
 *   patch:
 *     summary: Update employment company details
 *     description: |
 *       Edits details of an employment company or changes its status.
 *       Requires **System Administrator** role.
 *     tags:
 *       - Employment Companies
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The company ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *                 description: Unique name of the company. (Optional)
 *               taxId:
 *                 type: string
 *                 description: CIF/NIF of the company. (Optional)
 *               contactPerson:
 *                 type: string
 *                 description: Contact person. (Optional)
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
 *                 description: Status of the company. (Optional)
 *               comments:
 *                 type: string
 *                 description: Additional notes. (Optional)
 *     responses:
 *       200:
 *         description: Employment company updated successfully
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
 *                     companyName:
 *                       type: string
 *                     taxId:
 *                       type: string
 *                     contactPerson:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     email:
 *                       type: string
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
 *         description: Invalid input, name duplicate, or tax ID duplicate
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission or not a System Administrator)
 *       404:
 *         description: Employment company not found
 */

export {};
