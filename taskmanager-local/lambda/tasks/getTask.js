const { dynamoDB, sns, uuidv4 } = require('../../db/aws-config');

module.exports.handler = async (event) => {
    const taskId = event.pathParameters.taskId;

    try{
    
        //get task from dynamoDB
        const task = await dynamoDB.get({
            TableName: 'Tasks', // the table name 
            Key: {
                taskId // fetching the task by ID
            }
        }).promise();

        //returning back to the user that the task does not exist in the database if not found
        if(!task.Item){
            return {
                statusCode: 404,
                body: JSON.stringify({error: 'Task not found'})
            }
        }

         //returning the task back to the user
        return {
                statusCode: 200,
                body: JSON.stringify(task.Item)
        }

    }catch(error){
        console.log(error);
        return{
            statusCode: 500,
            body: JSON.stringify({error: error.message}) //returning the error message
        }
    }
}