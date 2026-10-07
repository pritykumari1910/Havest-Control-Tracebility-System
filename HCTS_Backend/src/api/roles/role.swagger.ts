/**
 * @swagger
 * /api/access/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags:
 *       - Access
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
 *       401:
 *         description: Invalid credentials
 *   post:
 *     summary: Create permission
 *     tags:
 *       - Access
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionName
 *               - permissionIdentifier
 *             properties:
 *               permissionName:
 *                 type: string
 *                 description: Descriptive name of the permission. (Required)
 *                 example: Manage Users
 *               permissionIdentifier:
 *                 type: string
 *                 description: Unique string identifier for the permission. (Required)
 *                 example: manage_users
 *     responses:
 *       201:
 *         description: Permission created
 */

/**
 * @swagger
 * /api/access/permissions/{permissionId}:
 *   patch:
 *     summary: Edit permission
 *     tags:
 *       - Access
 *     parameters:
 *       - in: path
 *         name: permissionId
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
 *               permissionName:
 *                 type: string
 *                 description: Descriptive name of the permission. (Optional)
 *                 example: Manage Users
 *               permissionIdentifier:
 *                 type: string
 *                 description: Unique string identifier for the permission. (Optional)
 *                 example: manage_users
 *     responses:
 *       200:
 *         description: Permission updated
 *       404:
 *         description: Permission not found
 *   delete:
 *     summary: Delete permission
 *     tags:
 *       - Access
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted
 *       404:
 *         description: Permission not found
 */

/**
 * @swagger
 * /api/access/roles:
 *   get:
 *     summary: Get all roles
 *     tags:
 *       - Access
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 *       401:
 *         description: Invalid credentials
 *   post:
 *     summary: Create role
 *     tags:
 *       - Access
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - roleType
 *               - createdByAdminId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the role. (Required)
 *                 example: Admin
 *               roleType:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal type where the role is applicable. (Required)
 *                 example: web
 *               createdByAdminId:
 *                 type: string
 *                 description: ObjectId of the admin who created the role. (Required)
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permission ObjectIds. (Optional)
 *               isSystem:
 *                 type: boolean
 *                 description: Whether this is a system-default role. (Optional)
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 description: Whether the role is active. (Optional)
 *                 example: true
 *     responses:
 *       201:
 *         description: Role created
 */

/**
 * @swagger
 * /api/access/roles/{roleId}:
 *   get:
 *     summary: Get role by ID
 *     description: |
 *       Fetches full role details including assigned permissions.
 *     tags:
 *       - Access
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role fetched successfully
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: Role not found
 *   patch:
 *     summary: Edit role
 *     description: |
 *       Edit role fields and replace its permissions array with the provided permissions.
 *     tags:
 *       - Access
 *     parameters:
 *       - in: path
 *         name: roleId
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
 *                 description: Name of the role. (Optional)
 *                 example: Admin
 *               roleType:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal type. (Optional)
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permission ObjectIds. (Optional)
 *               isSystem:
 *                 type: boolean
 *                 description: Whether this is a system role. (Optional)
 *               isActive:
 *                 type: boolean
 *                 description: Whether the role is active. (Optional)
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: Role not found
 *   delete:
 *     summary: Delete role
 *     tags:
 *       - Access
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 *       404:
 *         description: Role not found
 */

export {};
