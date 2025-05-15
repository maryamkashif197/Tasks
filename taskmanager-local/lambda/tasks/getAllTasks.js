// lambda/tasks/getTasks.js
require('dotenv').config();
const { pool } = require('../../db/rds-config');

module.exports.handler = async (event) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        task_id   AS "taskId",
        user_id   AS "userId",
        title,
        description,
        status,
        attachments,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tasks_data.tasks
    `);

    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No tasks found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(rows)
    };
  } catch (error) {
    console.error('getTasks error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
