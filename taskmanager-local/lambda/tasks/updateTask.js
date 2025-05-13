const { pool } = require('../../db/rds-config');
const { dynamoDB, sns } = require('../../db/aws-config');

module.exports.handler = async (event) => {
    const taskId = event.pathParameters.taskId;
    const data = JSON.parse(event.body);

    try {
        //  Check if the task exists in DynamoDB
        const existingTask = await dynamoDB.get({
            TableName: 'Tasks',
            Key: { taskId }
        }).promise();

        if (!existingTask.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Task not found' })
            };
        }

        //  Update task in DynamoDB
        const updateFields = Object.keys(data)
            .map(key => `#${key} = :${key}`)
            .join(', ');

        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        for (const key of Object.keys(data)) {
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = data[key];
        }

        await dynamoDB.update({
            TableName: 'Tasks',
            Key: { taskId },
            UpdateExpression: `SET ${updateFields}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }).promise();

        // Update task in RDS (PostgreSQL)
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

        // Add taskId as the last parameter for WHERE clause
        await pool.query(
            `UPDATE Tasks SET ${setClause} WHERE task_id = $${keys.length + 1}`,
            [...values, taskId]
        );

        // Publish to SNS about the update
        const now = new Date().toISOString();
        const userId = event.requestContext?.authorizer?.userId || 'unknown';

        await sns.publish({
            TopicArn: 'arn:aws:sns:eu-north-1:183631305334:TaskNotificationTopic',
            Message: JSON.stringify({
                event: 'task_updated',
                taskId,
                userId,
                updatedFields: data,
                timestamp: now
            })
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Task updated successfully' })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};
