/**
 * @swagger
 * tags:
 *   name: System Parameters
 *   description: Management of system configuration parameters and operational variables
 */

/**
 * @swagger
 * /api/system-parameters:
 *   post:
 *     summary: Create a new system parameter
 *     description: Creates an operational variable or parameter configuration. Requires **System Administrator** role.
 *     tags:
 *       - System Parameters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: Unique variable key name (e.g. standard_pallet_weight_kg)
 *               value:
 *                 type: object
 *                 description: Mixed value type (can be number, string, object, array, boolean)
 *               description:
 *                 type: string
 *                 description: Brief description of what the parameter configures
 *     responses:
 *       201:
 *         description: System parameter created successfully
 *       400:
 *         description: Validation error or duplicate key
 *       403:
 *         description: Access forbidden (requires System Administrator role)
 *
 *   get:
 *     summary: List system parameters with search and pagination
 *     description: Returns a paginated list of system configuration parameters. Searchable by key or description. Requires **System Administrator** role.
 *     tags:
 *       - System Parameters
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword matching key or description
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
 *         description: Items count per page
 *     responses:
 *       200:
 *         description: List of system parameters retrieved successfully
 *
 * /api/system-parameters/{id}:
 *   get:
 *     summary: Get a system parameter by its MongoDB ID
 *     tags:
 *       - System Parameters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System parameter details retrieved successfully
 *       404:
 *         description: Parameter not found
 *
 *   patch:
 *     summary: Update a system parameter
 *     description: Modifies the value or description of an existing parameter. Requires **System Administrator** role.
 *     tags:
 *       - System Parameters
 *     parameters:
 *       - in: path
 *         name: id
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
 *               value:
 *                 type: object
 *                 description: New value for the parameter
 *               description:
 *                 type: string
 *                 description: New description
 *     responses:
 *       200:
 *         description: System parameter updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Parameter not found
 *
 *   delete:
 *     summary: Delete a system parameter configuration
 *     description: Deletes the configuration parameter. Requires **System Administrator** role.
 *     tags:
 *       - System Parameters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System parameter deleted successfully
 *       404:
 *         description: Parameter not found
 *
 * /api/system-parameters/key/{key}:
 *   get:
 *     summary: Get a system parameter by its unique key name
 *     tags:
 *       - System Parameters
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System parameter details retrieved successfully
 *       404:
 *         description: Parameter not found
 */

export {};
