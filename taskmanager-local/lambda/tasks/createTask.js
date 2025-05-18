// lambda/tasks/createTask.js
require('dotenv').config();                       // ← picks up your .env
const { pool }        = require('../../db/rds-config');
const { 
  dynamoDB, 
  PutCommand, 
  snsClient, 
  PublishCommand, 
  uuidv4 
} = require('../../db/aws-config');

// Build schema.table from your .env
const TABLE_TASK    = process.env.DB_TASK;        // "tasks"
const SCHEMA_TASK   = process.env.DB_SCHEMA_TASK; // "tasks_data"
const FULL_TASK_TAB = `${SCHEMA_TASK}.${TABLE_TASK}`;

module.exports.handler = async (event) => {
  try {
    // 1) Parse incoming JSON
    const data      = JSON.parse(event.body);
    const taskId    = uuidv4();
    const timestamp = new Date().toISOString();

    // 2) Build a JS task object
    const task = {
      taskId,
      title:       data.title,
      description: data.description || null,
      status:      'Pending',
      userId:      data.userId ,
      attachments: Array.isArray(data.attachments) 
                     ? data.attachments 
                     : [],
      createdAt:   timestamp,
      updatedAt:   timestamp
    };

    // 3) Insert into Postgres → tasks_data.tasks
    await pool.query(
      `INSERT INTO ${FULL_TASK_TAB}
         (task_id, title, description, user_id, status, attachments, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        task.taskId,
        task.title,
        task.description,
        task.userId,
        task.status,
        task.attachments,  // passed as a JS array → TEXT[]
        task.createdAt,
        task.updatedAt
      ]
    );

    // 4) Insert into DynamoDB
    await dynamoDB.send(new PutCommand({
      TableName: 'Tasks',
      Item:      task
    }));

    // 5) Publish to SNS
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject:  'Task Created',
      Message:  JSON.stringify({
        event:   'task_created',
        taskId,
        userId:  task.userId,
        timestamp
      })
    }));

    // 6) Return the new task summary
    return {
      statusCode: 201,
      body: JSON.stringify({
        taskId:      task.taskId,
        title:       task.title,
        description: task.description,
        userId:      task.userId,
        createdAt:   task.createdAt,
        status:      task.status,
        attachments: task.attachments
      })
    };

  } catch (error) {
    console.error('createTask error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
