const { pool } = require('../../db/rds-config');
const { dynamoDB, sns, uuidv4 } = require('../../db/aws-config');

module.exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const taskId = `task-${uuidv4()}`;
    const timestamp = new Date().toISOString();

    const task = {
      taskId,
      title: data.title,
      userId: data.userId,
      description: data.description,
      status: 'Pending',
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // 1. Insert into PostgreSQL (RDS)
   await pool.query(
  `INSERT INTO tasks (task_id, title, description, user_id, status, attachments, created_at, updated_at)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [
    task.taskId, task.title, task.description, task.userId, task.status, JSON.stringify(task.attachments), task.createdAt, task.updatedAt,
  ]);

    // 2. Insert into DynamoDB (AWS)
    await dynamoDB.put({
    TableName: 'Tasks',
    Item: task,
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
      body: JSON.stringify({ taskId: task.taskId, title: task.title, description: task.description, status: task.status }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};