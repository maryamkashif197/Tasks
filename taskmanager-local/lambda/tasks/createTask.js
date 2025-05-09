const { pool } = require('../../db/rds-config');
const { dynamoDB, sns, uuidv4 } = require('../../db/aws-config');

module.exports.handler = async (event) => {
  try {
    const { title, description, userId } = JSON.parse(event.body);
    const taskId = `task-${uuidv4()}`;
    const now = new Date().toISOString();

    // 1. Insert into PostgreSQL (RDS)
    await pool.query(
      `INSERT INTO tasks (task_id, title, description, user_id) 
       VALUES ($1, $2, $3, $4)`,
      [taskId, title, description, userId]
    );

    // 2. Insert into DynamoDB (AWS)
    await dynamoDB.put({
      TableName: 'Tasks',
      Item: { taskId, userId, title, description, status: 'pending', createdAt: now, updatedAt: now }
    }).promise();

    // 3. Publish to SNS (AWS)
    await sns.publish({
      TopicArn: 'arn:aws:sns:eu-north-1:183631305334:TaskNotificationTopic',
      Message: JSON.stringify({
        event: 'task_created',
        taskId,
        userId,
        timestamp: now
      })
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ taskId, title, status: 'pending' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};