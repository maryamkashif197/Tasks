// lambda/tasks/updateTask.js
require('dotenv').config();
const { pool }          = require('../../db/rds-config');
const { dynamoDB, snsClient } = require('../../db/aws-config');
const { GetCommand, UpdateCommand }   = require('@aws-sdk/lib-dynamodb');
const { PublishCommand }              = require('@aws-sdk/client-sns');

const DDB_TABLE = process.env.DYNAMO_TABLE || 'Tasks';
const RDS_TABLE = process.env.DB_TASK;        // "tasks"
const RDS_SCHEMA= process.env.DB_SCHEMA_TASK; // "tasks_data"
const FULL_RDS  = `${RDS_SCHEMA}.${RDS_TABLE}`;

module.exports.handler = async (event) => {
  const taskId = event.pathParameters?.taskId;
  if (!taskId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing taskId in path' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const fields = Object.keys(data);
  if (fields.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No fields provided to update' })
    };
  }

  try {
    // 1) Fetch existing item from DynamoDB
    const getResp = await dynamoDB.send(new GetCommand({
      TableName: DDB_TABLE,
      Key:       { taskId }
    }));
    if (!getResp.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Task not found' }) };
    }

    // 2) Build DynamoDB UpdateExpression
    const now = new Date().toISOString();
    const exprNames  = { '#updatedAt': 'updatedAt' };
    const exprValues = { ':updatedAt': now };
    const setParts   = ['#updatedAt = :updatedAt'];

    for (const key of fields) {
      exprNames[`#${key}`]   = key;
      exprValues[`:${key}`]  = data[key];
      setParts.push(`#${key} = :${key}`);
    }

    await dynamoDB.send(new UpdateCommand({
      TableName:                 DDB_TABLE,
      Key:                       { taskId },
      UpdateExpression:          `SET ${setParts.join(', ')}`,
      ExpressionAttributeNames:  exprNames,
      ExpressionAttributeValues: exprValues
    }));

    // 3) Mirror the update in Postgres
    //    include updated_at column in RDS as well
    const rdsCols  = [...fields, 'updated_at'];
    const setClause= rdsCols.map((col,i) => `${col} = $${i+1}`).join(', ');
    const rdsVals  = [...fields.map(f => data[f]), now, taskId];

    await pool.query(
      `UPDATE ${FULL_RDS} SET ${setClause} WHERE task_id = $${rdsVals.length}`,
      rdsVals
    );

    // 4) Publish to SNS
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject:  'Task Updated',
      Message:  JSON.stringify({
        event:         'task_updated',
        taskId,
        updatedFields: data,
        timestamp:     now
      })
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Task updated successfully' })
    };

  } catch (err) {
    console.error('updateTask error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: err.message })
    };
  }
};
