/**
 * @swagger
 * tags:
 *   name: Worker Role Change
 *   description: Mid-day worker role transitions between crews and support tasks
 */

/**
 * @swagger
 * /api/workers/{workerId}/change-role:
 *   post:
 *     summary: Transition a worker to a new role mid-day
 *     description: |
 *       Allows updating a worker's role mid-day (e.g., from picker to satellite staff loader) cleanly without data loss.
 *       Calculates shift fractions for the exited role and configures the remaining fraction for the entered role.
 *       Requires **System Administrator**, **Farm Manager**, or **Manijero / Crew Supervisor** role.
 *     tags:
 *       - Worker Role Change
 *     parameters:
 *       - in: path
 *         name: workerId
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
 *               - workDate
 *               - exitContext
 *               - exitEntityId
 *               - entryContext
 *               - entryEntityId
 *               - reason
 *             properties:
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of transition
 *               exitContext:
 *                 type: string
 *                 enum: [crew, satellite]
 *                 description: Type of role being exited
 *               exitEntityId:
 *                 type: string
 *                 description: Crew ID or SatelliteStaff registration ID being exited
 *               entryContext:
 *                 type: string
 *                 enum: [crew, satellite]
 *                 description: Type of new role being entered
 *               entryEntityId:
 *                 type: string
 *                 description: Crew ID or SatelliteRole ID being entered
 *               farmId:
 *                 type: string
 *                 description: Farm ID (Required if entering satellite role)
 *               plotId:
 *                 type: string
 *                 description: Plot ID (Optional)
 *               valveId:
 *                 type: string
 *                 description: Valve ID (Optional)
 *               workZone:
 *                 type: string
 *                 description: Work zone description
 *               reason:
 *                 type: string
 *                 description: Transition reason description
 *               changeTime:
 *                 type: string
 *                 format: date-time
 *                 description: Optional custom timestamp for the change (defaults to current time)
 *     responses:
 *       200:
 *         description: Role change recorded successfully
 *       400:
 *         description: Validation error or missing records
 */

export {};
