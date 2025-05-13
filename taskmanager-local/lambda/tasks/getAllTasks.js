const { dynamoDB } = require('../../db/aws-config');

module.exports.handler = async (event) => {
    try {
        // scan to get all tasks
        const tasks = await dynamoDB.scan({
            TableName: 'Tasks'
        }).promise();

        // If no tasks found
        if (!tasks.Items || tasks.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No tasks found' })
            };
        }

        // Return the list of tasks
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items)
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
