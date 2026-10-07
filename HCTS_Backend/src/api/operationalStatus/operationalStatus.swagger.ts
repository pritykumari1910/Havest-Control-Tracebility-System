/**
 * @swagger
 * tags:
 *   name: Operational Status Monitor
 *   description: Real-time and historical harvesting activity progress monitor
 */

/**
 * @swagger
 * /api/operational-status:
 *   get:
 *     summary: Retrieve real-time or historical operational stats
 *     description: |
 *       Returns key details about crew counts, picker attendance check-ins, scanned bin counts, and estimated weight distributions.
 *       Allows historical lookup by passing a custom date.
 *     tags:
 *       - Operational Status Monitor
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Optional ISO8601 date string to query historical records (defaults to current date).
 *     responses:
 *       200:
 *         description: Operational status metrics retrieved successfully
 */

export {};
