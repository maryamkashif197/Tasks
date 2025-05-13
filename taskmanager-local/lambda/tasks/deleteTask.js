const { pool } = require('../../db/rds-config');
const { dynamoDB, sns } = require('../../db/aws-config');

module.exports.handler = async (event) => {
    const taskId = event.pathParameters.taskId;

    try {
        // First, get the task from DynamoDB to check if it exists
        const task = await dynamoDB.get({
            TableName: 'Tasks',
            Key: { taskId }
        }).promise();

        // Check if the task exists in DynamoDB
        if (!task.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Task not found in DynamoDB' })
            };
        }

        // Delete the task from DynamoDB
        await dynamoDB.delete({
            TableName: 'Tasks',
            Key: { taskId }
        }).promise();

        // Delete the task from RDS (Relational Database)
        await pool.query('DELETE FROM Tasks WHERE task_id = $1', [taskId]);

        // Define metadata for SNS
        const now = new Date().toISOString();
        const userId = event.requestContext?.authorizer?.userId || 'unknown'; // Fallback user ID if not available

        // Publish an SNS notification about the task deletion
        await sns.publish({
            TopicArn: 'arn:aws:sns:eu-north-1:183631305334:TaskNotificationTopic',
            Message: JSON.stringify({
                event: 'task_deleted',
                taskId,
                userId,
                timestamp: now
            })
        }).promise();

        // Return a success response after deletion and notification
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Task deleted successfully from both DynamoDB and RDS' })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }) // Returning the error message
        };
    }
};
