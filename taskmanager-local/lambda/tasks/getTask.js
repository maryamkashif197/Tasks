// lambda/tasks/getTask.js
require('dotenv').config();
const { dynamoDB }   = require('../../db/aws-config');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

module.exports.handler = async (event) => {
  // 0) Grab the ID from the path (/tasks/{taskId})
  const taskId = event.pathParameters && event.pathParameters.taskId;
  if (!taskId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing taskId in path' })
    };
  }

  try {
    // 1) Fetch from DynamoDB
    const tableName = process.env.DYNAMO_TABLE || 'Tasks';
    const result = await dynamoDB.send(new GetCommand({
      TableName: tableName,
      Key: { taskId }
    }));

    // 2) Not found?
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Task not found' })
      };
    }

    // 3) Return the item
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };

  } catch (error) {
    console.error('getTask error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
