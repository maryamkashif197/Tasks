// lambda/tasks/deleteTask.js
require('dotenv').config();
const { pool } = require('../../db/rds-config');
const { dynamoDB, snsClient } = require('../../db/aws-config');
const { GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { PublishCommand } = require('@aws-sdk/client-sns');

const DDB_TABLE = process.env.DYNAMO_TABLE || 'Tasks';
const RDS_SCHEMA = process.env.DB_SCHEMA_TASK;  // e.g. "tasks_data"
const RDS_TABLE = process.env.DB_TASK;         // e.g. "tasks"
const FULL_RDS = `${RDS_SCHEMA}.${RDS_TABLE}`;

module.exports.handler = async (event) => {
    const taskId = event.pathParameters?.taskId;
    if (!taskId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing taskId in path' }) };
    }

    try {
        // 1) Check existence in DynamoDB
        const getResp = await dynamoDB.send(new GetCommand({
            TableName: DDB_TABLE,
            Key: { taskId }
        }));

        if (!getResp.Item) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Task not found in DynamoDB' }) };
        }

        // 2) Delete from DynamoDB
        await dynamoDB.send(new DeleteCommand({
            TableName: DDB_TABLE,
            Key: { taskId }
        }));

        // 3) Delete from Postgres RDS
        await pool.query(
            `DELETE FROM ${FULL_RDS} WHERE task_id = $1`,
            [taskId]
        );

        // 4) Publish SNS notification
        const now = new Date().toISOString();
        const userId = event.requestContext?.authorizer?.claims?.sub
            || event.requestContext?.authorizer?.userId
            || 'unknown';

        await snsClient.send(new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: 'Task Deleted',
            Message: JSON.stringify({
                event: 'task_deleted',
                taskId, 
                userId,
                timestamp: now
            })
        }));

        // 5) Return success
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Task deleted successfully' })
        };

    } catch (err) {
        console.error('deleteTask error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
