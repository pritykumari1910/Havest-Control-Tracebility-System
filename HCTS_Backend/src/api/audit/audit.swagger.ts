/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get paginated system audit logs
 *     description: |
 *       Retrieves system audit logs. Supports pagination, sorting (newest first), search, and filtering.
 *       Requires `audit_trail_report` permission.
 *     tags:
 *       - Audit Logs
  *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number. (Optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of logs per page. (Optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: General search keyword (matches event/action, email, entityType, entityId, path, method, IP). (Optional)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Alias for search keyword. (Optional)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Search/filter logs by action name or HTTP method (e.g. `bin_removed`, `DISPATCH_NOTE_CLOSED`, `POST`, `DELETE`). (Optional)
 *       - in: query
 *         name: userEmail
 *         schema:
 *           type: string
 *         description: Search/filter logs by user email (matches actor email or target email). (Optional)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs created on or after this ISO date-time. (Optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs created on or before this ISO date-time. (Optional)
 *     responses:
 *       200:
 *         description: Audit logs fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permission)
 *
 * /api/audit/farm-manager:
 *   get:
 *     summary: Get Farm Manager Audit Trail
 *     description: |
 *       Retrieves audit logs specific to Farm Manager activities (Farms, Plots, Valves, Parks, Campaigns, Varieties, Forecasts).
 *     tags:
 *       - Audit Logs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Farm Manager audit logs fetched successfully
 *
 * /api/audit/manijero:
 *   get:
 *     summary: Get Manijero / Crew Supervisor Audit Trail
 *     description: |
 *       Retrieves audit logs specific to Manijero activities (Crews, Harvest Assignments, QR Series, Mid-day Variety Changes).
 *     tags:
 *       - Audit Logs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Manijero audit logs fetched successfully
 *
 * /api/audit/collection-team:
 *   get:
 *     summary: Get Collection Team Audit Trail
 *     description: |
 *       Retrieves audit logs specific to Collection / Reception Team activities (Reception Batches, QR Scans, Machine operations).
 *     tags:
 *       - Audit Logs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Collection team audit logs fetched successfully
 *
 * /api/audit/loading-team:
 *   get:
 *     summary: Get Loading Team (Dispatch & Logistics) Audit Trail
 *     description: |
 *       Retrieves audit logs specific to Loading Team activities (Dispatch Notes, Transfer Orders, Weight Recording, Truck Departures).
 *     tags:
 *       - Audit Logs
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Loading team audit logs fetched successfully
 */

export {};
