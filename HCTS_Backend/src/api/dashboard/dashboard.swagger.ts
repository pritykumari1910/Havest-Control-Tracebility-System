/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-filtered dashboard summary APIs
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard summary by user role
 *     description: Returns aggregate dashboard counts for the explicitly provided userRole. Supports System Administrator and Farm Manager.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userRoleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ObjectId or Role Name filter (e.g. 64f1a2b3c4d5e6f7a8b9c0r1 or 'Farm Manager')
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional target date filter (YYYY-MM-DD). Defaults to today's date.
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboard summary retrieved successfully
 *                 responseObject:
 *                   oneOf:
 *                     - type: object
 *                       title: System Administrator Summary
 *                       properties:
 *                         activeFarmsCount:
 *                           type: integer
 *                         workersCount:
 *                           type: integer
 *                         varietiesCount:
 *                           type: integer
 *                         campaignsCount:
 *                           type: integer
 *                         crewsCount:
 *                           type: integer
 *                         palletBinsCount:
 *                           type: integer
 *                         dispatchNotesCount:
 *                           type: integer
 *                         qrSeriesCount:
 *                           type: integer
 *                     - type: object
 *                       title: Farm Manager Mobile Summary
 *                       properties:
 *                         activeCrewsCount:
 *                           type: integer
 *                           example: 1
 *                         pickersCount:
 *                           type: integer
 *                           example: 16
 *                         palletsReceivedCount:
 *                           type: integer
 *                           example: 0
 *                         openAssignmentsCount:
 *                           type: integer
 *                           example: 0
 *                         yourCrews:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               crewCode:
 *                                 type: string
 *                                 example: CR-0703-02
 *                               crewName:
 *                                 type: string
 *                                 example: Cuadrilla 3
 *                               status:
 *                                 type: string
 *                                 example: active
 *                               pickersCount:
 *                                 type: integer
 *                                 example: 8
 *                               assignmentsCount:
 *                                 type: integer
 *                                 example: 1
 *                         satelliteStaffRegisteredTodayCount:
 *                           type: integer
 *                           example: 8
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *       400:
 *         description: Missing or unsupported userRole filter
 *       401:
 *         description: Unauthorized
 */
