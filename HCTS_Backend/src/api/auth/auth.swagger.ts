/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: User registration
 *     description: |
 *       Register a user account for web or app portal. Requires User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - userportal
 *               - roleIds
 *               - phoneNumber
 * 
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the user. (Required)
 *                 example: Akshit
 *               lastName:
 *                 type: string
 *                 description: Last name of the user. (Required)
 *                 example: Kamboj
 *               email:
 *                 type: string
 *                 description: Unique email address. (Required)
 *                 example: akshit@yopmail.com
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number. (Required)
 *                 example: "+919876543210"
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                   - both
 *                 description: Portal access (web, app, or both). (Required)
 *                 example: both
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of role ObjectIds. (Required)
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or email already exists
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Login API for web or app user accounts.
 *     security: []
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - userportal
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered email address. (Required)
 *                 example: akshit@yopmail.com
 *               password:
 *                 type: string
 *                 description: User password. (Required)
 *                 example: Admin@123
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal to log in to. (Required)
 *                 example: web
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation or authentication error
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/user/add-user:
 *   post:
 *     summary: Add user
 *     description: |
 *       Creates a user account. Requires a bearer token from a user with User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - userportal
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the user. (Required)
 *                 example: New
 *               lastName:
 *                 type: string
 *                 description: Last name of the user. (Required)
 *                 example: User
 *               email:
 *                 type: string
 *                 description: Unique email address. (Required)
 *                 example: newuser@yopmail.com
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number. (Optional)
 *                 example: "+919876543211"
 *               password:
 *                 type: string
 *                 description: Initial login password. (Required)
 *                 example: User@123
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal where the user has access. (Required)
 *                 example: web
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of role ObjectIds. (Optional)
 *                 example:
 *                   - 65f1234567890abcdef12345
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/user/all-users:
 *   get:
 *     summary: Get all users
 *     description: |
 *       Public endpoint that returns all non-deleted users. Optional query params can filter users by role or portal.
 *     security: []
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *         description: Filter users assigned to this role ObjectId.
 *       - in: query
 *         name: roleName
 *         schema:
 *           type: string
 *         description: Filter users assigned to a role with this exact name, case-insensitive.
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum:
 *             - "true"
 *             - "false"
 *         description: Filter users by active (true) or deactivated (false) status.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name (first/last) or email.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Page size
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       400:
 *         description: Validation error

 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get logged-in user details
 *     description: |
 *       Returns the authenticated user's details using the bearer token or accessToken cookie.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *   put:
 *     summary: Edit logged-in user details
 *     description: |
 *       Updates the authenticated user's editable profile fields using the bearer token or accessToken cookie.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Updated
 *               lastName:
 *                 type: string
 *                 example: User
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 example: "+919876543212"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: |
 *       Fetches user details by ObjectId. Requires User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Permission denied
 *       404:
 *         description: User not found
 *   put:
 *     summary: Edit user
 *     description: |
 *       Updates user details. Requires User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the user. (Optional)
 *                 example: Updated
 *               lastName:
 *                 type: string
 *                 description: Last name of the user. (Optional)
 *                 example: User
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 description: Phone number of the user. (Optional)
 *                 example: "+919876543212"
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal access update. (Optional)
 *                 example: web
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of role ObjectIds. (Optional)
 *                 example:
 *                   - 65f1234567890abcdef12345
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Permission denied
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/{userId}/activate:
 *   patch:
 *     summary: Activate user
 *     description: |
 *       Sets isActive to true for a user. Requires User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User activated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Permission denied
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/{userId}/deactivate:
 *   patch:
 *     summary: Deactivate user
 *     description: |
 *       Sets isActive to false and logs the user out from all devices. Requires User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Permission denied
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/{userId}/force-logout:
 *   post:
 *     summary: Logout user from all devices
 *     description: |
 *       Invalidates the selected user's active sessions without deactivating the account. Requires User Management and Access Control permission.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User logged out from all devices successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Permission denied
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/send-password-otp:
 *   post:
 *     summary: Send password OTP
 *     description: |
 *       Sends a password reset OTP to the user's email and stores it for 10 minutes.
 *     security: []
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userportal
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered user email. (Required)
 *                 example: akshit@yopmail.com
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal type. (Required)
 *                 example: web
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: |
 *       Initiates password reset process. Generates a reset token and sends it to the user's email.
 *     security: []
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userportal
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered user email. (Required)
 *                 example: akshit@yopmail.com
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal type. (Required)
 *                 example: web
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/verify-otp:
 *   post:
 *     summary: Verify password OTP
 *     description: |
 *       Verifies OTP against email and marks the OTP status as used.
 *     security: []
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userportal
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered user email. (Required)
 *                 example: akshit@yopmail.com
 *               userportal:
 *                 type: string
 *                 enum:
 *                   - web
 *                   - app
 *                 description: Portal type. (Required)
 *                 example: web
 *               otp:
 *                 type: string
 *                 description: 6-digit numeric OTP sent via email. (Required)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or expired OTP
 */

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: User logout
 *     description: |
 *       Logs out the authenticated user and records the logout event.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset password
 *     description: |
 *       Resets user password. Requires valid reset token from email and the new password.
 *       Note: newPassword cannot be same as the current password.
 *     security: []
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token received from the forgot-password email. (Required)
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 description: New password (must contain letter & number, min length 8). (Required)
 *                 example: NewAdmin@123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error or same password as current
 *       401:
 *         description: Invalid or expired reset token
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change password
 *     description: |
 *       Changes the password for the authenticated user. Requires valid old password and new password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Current active password. (Required)
 *                 example: Admin@123
 *               newPassword:
 *                 type: string
 *                 description: New password (must contain letter & number, min length 8). (Required)
 *                 example: NewAdmin@123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or same password as current
 *       401:
 *         description: Invalid old password or unauthorized
 *       404:
 *         description: User not found
 *
 * /api/user/refresh-token:
 *   post:
 *     summary: Refresh session tokens
 *     description: |
 *       Regenerates a new pair of access and refresh tokens.
 *       Reads the refresh token from either cookies (`refreshToken`) or the request body (`refreshToken`).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token value (if not provided as a cookie).
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */

export {};
