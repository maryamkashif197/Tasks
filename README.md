# Task Management System

A full-stack, serverless task management application built on AWS cloud infrastructure with React frontend and PostgreSQL database.

## 🏗️ Architecture Overview

This project implements a modern serverless architecture using AWS services:

- **Frontend**: React.js with Bootstrap UI hosted on EC2
- **Authentication**: AWS Cognito User Pools with JWT tokens
- **Backend**: AWS Lambda functions with Node.js
- **Database**: PostgreSQL on Amazon RDS + DynamoDB for metadata
- **Storage**: Amazon S3 for file attachments
- **Notifications**: SNS/SQS for task update notifications
- **Email**: Amazon SES for user notifications
- **API**: Amazon API Gateway for REST endpoints

## 🏗️ Architecture Diagram
  ┌──────────────────────┐        ┌───────────────────────────────┐
│   React Frontend     │        │    Amazon Cognito              │
│   (EC2 Instance)     ◄────────┤     • User Pool               │
└───────▲──────────────┘        │     • JWT Validation          │
        │                       └───────────────────────────────┘
        │ HTTPS
┌───────▼──────────────┐        ┌───────────────────────────────┐
│   API Gateway        │        │    AWS Lambda Functions        │
│   • /tasks           ├───────►│     • createTask               │
│   • /tasks/{id}      │        │     • getAllTasks              │
│   • /auth/callback   │        │     • getTask/updateTask       │
└──────────────────────┘        │     • deleteTask               │
                                │     • taskNotifierFunction     │
                                └───────┬────────────┬────────────┘
                                        │            │
                                ┌───────▼────┐ ┌─────▼──────────┐
                                │  Amazon    │ │  Amazon SNS    │
                                │  RDS       │ │  • TaskNotificationTopic │
                                │  (PostgreSQL) │ └──────┬─────────┘
                                └───────▲────┘          │
                                        │                │
                                ┌───────▼────┐ ┌─────────▼───────┐
                                │  DynamoDB  │ │  Amazon SQS     │
                                │  • Tasks   │ │  • TaskNotificationQueue │
                                └────────────┘ └─────────┬───────┘
                                                         │
                                                 ┌───────▼──────┐
                                                 │  Amazon SES  │
                                                 │  • Email     │
                                                 │  Notifications│
                                                 └──────────────┘
                                ┌───────────────────────────────┐
                                │   Amazon S3                  │
                                │   • task-manager-file-storage │
                                │   • Attachments Storage       │
                                └───────────────────────────────┘

Key Data Flows:
1. Authentication: Frontend ↔ Cognito ↔ Lambda (CreateUser)
2. Task Operations: Frontend → API Gateway → Lambda → (RDS + DynamoDB + S3)
3. Notifications: Lambda → SNS → SQS → Lambda → SES
4. File Uploads: Lambda ↔ S3
5. Metadata Sync: RDS ↔ DynamoDB via Lambda

## 🚀 Features

- **User Authentication**: Secure sign-up/sign-in with AWS Cognito
- **Task Management**: Create, read, update, and delete tasks
- **File Attachments**: Upload and manage task-related files
- **Real-time Notifications**: Email notifications for task updates
- **Task Metadata**: View counts, activity logs, and priority scoring
- **Responsive UI**: Bootstrap-powered responsive design
- **Cross-Origin Support**: Full CORS configuration for web deployment

## 📋 Prerequisites

- AWS Account with appropriate permissions
- Node.js (v18.x or v22.x)
- PostgreSQL client (pgAdmin recommended)
- AWS CLI configured
- Git

## 🛠️ AWS Services Used

### Core Infrastructure
- **Amazon RDS**: PostgreSQL database for task and user data
- **Amazon DynamoDB**: NoSQL storage for task metadata and analytics
- **AWS Lambda**: Serverless compute for backend logic
- **Amazon API Gateway**: RESTful API endpoints
- **Amazon EC2**: Frontend application hosting

### Security & Authentication
- **AWS Cognito**: User authentication and authorization
- **IAM Roles**: Service permissions and access control

### Storage & Messaging
- **Amazon S3**: File storage for task attachments
- **Amazon SNS**: Task update notifications
- **Amazon SQS**: Message queuing for reliable notification delivery
- **Amazon SES**: Email notification service

## 🗄️ Database Schema

### PostgreSQL (RDS)
```sql
-- Users table
CREATE TABLE users (
    cognito_sub UUID PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    attachments TEXT[],
    priority VARCHAR(50),
    cognito_sub UUID REFERENCES users(cognito_sub) ON DELETE CASCADE
);
```

### DynamoDB
```json
{
  "taskId": "String (PK)",
  "activity_log": "List",
  "attachments": "List",
  "last_viewed": "String (ISO timestamp)",
  "priority_score": "Number",
  "tags": "List",
  "view_count": "Number",
  "created_at": "String (ISO timestamp)",
  "updated_at": "String (ISO timestamp)"
}
```

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/task-management-system.git
cd task-management-system
```

### 2. AWS Infrastructure Setup

#### Cognito User Pool
```bash
# Create user pool with email/password authentication
# Set minimum password length: 8 characters
# Require numbers and special characters
# Configure app client with callback URLs
```

#### RDS PostgreSQL Database
```bash
# Instance: db.t4g.micro
# Storage: 20 GB
# Engine: PostgreSQL
# Ensure VPC and security group configuration
```

#### Lambda Functions Deployment
Deploy the following Lambda functions:
- `createTask.js` - Create new tasks
- `getAllTasks.js` - Retrieve user tasks
- `getTask.js` - Get specific task details
- `updateTask.js` - Update existing tasks
- `deleteTask.js` - Delete tasks
- `taskNotifierFunction` - Handle notifications
- `SESverifier.js` - Verify email identities
- `CreateUser.js` - Handle user registration
- `exchangeCode.js` - JWT token validation

#### API Gateway Configuration
```bash
# Create REST API with the following routes:
# GET /tasks - List all tasks
# POST /tasks - Create new task
# GET /tasks/{id} - Get specific task
# PUT /tasks/{id} - Update task
# DELETE /tasks/{id} - Delete task
# POST /auth/callback - Authentication callback
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
Create `.env` file in the frontend directory:
```env
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/pre-prod
REACT_APP_COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXXX
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_COGNITO_DOMAIN=your-cognito-domain
```

#### Build and Deploy
```bash
npm run build
# Deploy to EC2 instance or S3 with CloudFront
```

## 📦 Lambda Functions

### Core Task Operations
| Function | Purpose | Trigger |
|----------|---------|---------|
| `createTask` | Create new tasks with file uploads | API Gateway POST /tasks |
| `getAllTasks` | Retrieve user's tasks | API Gateway GET /tasks |
| `getTask` | Get specific task with metadata | API Gateway GET /tasks/{id} |
| `updateTask` | Update task with file support | API Gateway PUT /tasks/{id} |
| `deleteTask` | Delete task from all systems | API Gateway DELETE /tasks/{id} |

### Utility Functions
| Function | Purpose | Trigger |
|----------|---------|---------|
| `taskNotifierFunction` | Send email notifications | SQS Queue |
| `SESverifier` | Verify email identities | Manual/API |
| `CreateUser` | Register new users | Cognito Post-Confirmation |
| `exchangeCode` | Validate JWT tokens | API Gateway |

## 🚀 API Endpoints

### Authentication
```
POST /auth/callback - Handle authentication callback
```

### Tasks
```
GET    /tasks          - Get all user tasks
POST   /tasks          - Create new task
GET    /tasks/{id}     - Get specific task
PUT    /tasks/{id}     - Update task
DELETE /tasks/{id}     - Delete task
```

### Request/Response Examples

#### Create Task
```bash
curl -X POST https://api-url/tasks \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive README",
    "priority": "high",
    "attachments": ["base64-encoded-file"]
  }'
```

#### Get All Tasks
```bash
curl -X GET https://api-url/tasks \
  -H "Authorization: Bearer <jwt-token>"
```

## 🔐 Security Features

- **JWT Authentication**: All API endpoints protected with Cognito JWT tokens
- **CORS Configuration**: Secure cross-origin resource sharing
- **SQL Injection Prevention**: Parameterized queries throughout
- **File Upload Security**: Secure S3 storage with proper permissions
- **VPC Security**: Lambda functions deployed in private VPC
- **IAM Roles**: Least-privilege access for all services

## 📧 Notification System

The application includes a robust notification system:

1. **Task Events**: Create, update, delete operations trigger notifications
2. **SNS Topics**: Broadcast events to subscribers
3. **SQS Queues**: Reliable message queuing with retry logic
4. **Email Notifications**: Automatic emails via Amazon SES
5. **Activity Logging**: Track all task interactions in DynamoDB

## 🔄 Deployment Architecture

```
[React Frontend] → [API Gateway] → [Lambda Functions]
                                      ↓
[RDS PostgreSQL] ← [Lambda] → [DynamoDB]
                     ↓
[S3 Storage] ← [File Uploads]
                     ↓
[SNS/SQS] → [Email Notifications via SES]
```

## 📊 Monitoring & Logging

- **CloudWatch Logs**: All Lambda functions log to CloudWatch
- **API Gateway Logging**: Request/response logging enabled
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Performance Monitoring**: Lambda execution metrics tracked

## 📝 Environment Variables

### Lambda Functions
```env
# Database Configuration
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=TaskManagerDB

# AWS Services
AWS_REGION=eu-north-1
S3_BUCKET=task-manager-file-storage
SNS_TOPIC_ARN=arn:aws:sns:eu-north-1:account:TaskNotificationTopic
DYNAMODB_TASK_TABLE=Tasks
RDS_DB_NAME=TaskManagerRDS_DB
DB_SCHEMA_TASK=tasks_data
DB_SCHEMA_USER=users_data 

# SES Configuration
SES_SOURCE_EMAIL=your-verified-email@domain.com
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure API Gateway CORS is properly configured
2. **Authentication Failed**: Verify Cognito configuration and JWT token validity
3. **Database Connection**: Check VPC and security group settings
4. **File Upload Issues**: Verify S3 permissions and bucket policy
5. **Email Notifications**: Ensure SES email verification is complete

### Debug Tips
- Check CloudWatch Logs for Lambda function errors
- Verify IAM role permissions for all services
- Test API endpoints individually using curl or Postman
- Monitor RDS and DynamoDB metrics in AWS Console


## 👥 Team

- **Maryam Kashif** - 11001929
- **Ahmed Hegab** - 10005393  
- **Ammar Hassona** - 10006003
- **Ahmed Ashraf** - 10002329
- **Ali Sherif** - 10000719
- **Marina Emil** - 10000709
- **Sandra Narmer** - 10002592
- **Clara Amir** - 10002591



**Built with ❤️ using AWS Cloud Services**
