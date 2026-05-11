# Node Notification Engine

A comprehensive Node.js-based notification service that enables sending email and push notifications through a REST API. Built with TypeScript, Express, Sequelize, and BullMQ for reliable queue processing.

## Features

- **Multi-channel Notifications**: Support for email and web push notifications
- **Queue-based Processing**: Asynchronous notification delivery using BullMQ and Redis
- **Template Management**: Create and manage reusable notification templates with Handlebars
- **File Attachments**: Upload and attach files to email notifications
- **API Key Management**: Secure API key authentication with configurable scopes
- **Browser Push Subscriptions**: Manage web push notification subscriptions
- **Dashboard**: Real-time monitoring of notification queues and jobs
- **User Authentication**: JWT-based authentication for admin operations
- **Database Migrations**: Automated database schema management with Sequelize

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Redis server
- SMTP server for email delivery

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd node-notification-engine
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Setup section)

4. Run database migrations:
```bash
# The migrations will run automatically when the server starts
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secrets
ACCESS_SECRET=your-access-secret-key
REFRESH_SECRET=your-refresh-secret-key

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_engine
DB_USER=your-db-user
DB_PASS=your-db-password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Notifications
SMTP_FROM_EMAIL=your-email@gmail.com

# VAPID Keys for Push Notifications (optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Running the Application

### Development Mode

Start the API server:
```bash
npm run dev
```

Start the worker process (in a separate terminal):
```bash
npm run worker
```

Start both server and worker concurrently:
```bash
npm run all
```

### Production Mode

Build the application:
```bash
npm run build
```

Start the server:
```bash
npm start
```

Start the worker:
```bash
npm start:worker
```

## API Documentation

See [API.md](API.md) for comprehensive API documentation including all endpoints, request/response schemas, and examples.

## Project Structure

```
src/
├── app.ts                 # Express app setup and route mounting
├── server.ts              # Server entry point
├── worker.ts              # Worker process for queue processing
├── config/
│   └── env.ts            # Environment configuration
├── controllers/           # Route handlers
├── db/                   # Database configuration and models
│   ├── migrations/       # Database migrations
│   └── models/          # Sequelize models
├── middleware/           # Express middleware
├── providers/            # Notification providers (email, push)
├── queue/                # BullMQ queue setup and processors
├── routes/               # Express routes
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Technologies Used

- **Runtime**: Node.js
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Queue**: BullMQ with Redis
- **Authentication**: JWT
- **Validation**: Zod
- **Email**: Nodemailer
- **Push Notifications**: Web Push API
- **File Upload**: Multer
- **Logging**: Pino
- **Security**: Helmet, CORS

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

ISC