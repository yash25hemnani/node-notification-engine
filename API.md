# Notification Engine API Documentation

## Overview

The Node Notification Engine is a comprehensive API service for managing and delivering notifications across multiple channels (email and push notifications). It provides endpoints for user authentication, API key management, template management, notification queuing, file uploads, and browser push subscriptions.

**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Authentication](#authentication-endpoints)
  - [API Key Management](#api-key-management)
  - [Template Management](#template-management)
  - [Template Attachments](#template-attachments)
  - [Notifications](#notifications)
  - [Push Subscriptions](#push-subscriptions)
  - [File Management](#file-management)
  - [Job Monitoring](#job-monitoring)
  - [Dashboard](#dashboard)
  - [Miscellaneous](#miscellaneous)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Authentication

### JWT Authentication

Admin endpoints require JWT authentication. Obtain tokens through the login endpoint.

**Header Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

### API Key Authentication

Notification and subscription endpoints require API key authentication.

**Header Format:**
```
x-api-key: <API_KEY>
```

API keys have associated scopes that determine allowed actions:
- `email` - Can send email notifications
- `push` - Can send push notifications

---

## Endpoints

### Health Check

#### GET /health

Returns the health status of the service.

**Request:**
```
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

### Authentication Endpoints

#### POST /auth/signup

Register a new user account.

**Request:**
```
POST /api/auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### POST /auth/login

Authenticate user and receive JWT tokens.

**Request:**
```
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```
POST /api/auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/logout

Logout user by invalidating refresh token.

**Request:**
```
POST /api/auth/logout
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### API Key Management

#### GET /keys

Get all API keys for the authenticated user.

**Request:**
```
GET /api/keys
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "keys": [
    {
      "id": 1,
      "name": "Production Key",
      "keyHash": "sha256_hash...",
      "scopes": ["email", "push"],
      "isRevealed": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /keys/generate

Generate a new API key.

**Request:**
```
POST /api/keys/generate
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My API Key",
  "scopes": ["email", "push"]
}
```

**Response (201 Created):**
```json
{
  "message": "API key generated",
  "key": {
    "id": 1,
    "name": "My API Key",
    "key": "actual-api-key-here",
    "scopes": ["email", "push"]
  }
}
```

#### POST /keys/rotate

Rotate an existing API key (generate new key, invalidate old).

**Request:**
```
POST /api/keys/rotate
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": 1
}
```

**Response (200 OK):**
```json
{
  "message": "API key rotated",
  "key": {
    "id": 1,
    "name": "My API Key",
    "key": "new-actual-api-key-here",
    "scopes": ["email", "push"]
  }
}
```

#### DELETE /keys/:id

Delete an API key.

**Request:**
```
DELETE /api/keys/1
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "API key deleted"
}
```

---

### Template Management

#### GET /templates

Get all notification templates for the authenticated user.

**Request:**
```
GET /api/templates
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "templates": [
    {
      "id": 1,
      "slug": "welcome-email",
      "channel": "email",
      "name": "Welcome Email",
      "subject": "Welcome {{name}}!",
      "body": "Hello {{name}}, welcome to our platform!",
      "userId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /templates/create

Create a new notification template.

**Request:**
```
POST /api/templates/create
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Welcome Email",
  "channel": "email"
}
```

**Response (201 Created):**
```json
{
  "message": "Template created successfully",
  "template": {
    "id": 1,
    "slug": "welcome-email",
    "channel": "email",
    "name": "Welcome Email",
    "userId": 1
  }
}
```

#### GET /templates/:id

Get a specific template by ID.

**Request:**
```
GET /api/templates/1
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "template": {
    "id": 1,
    "slug": "welcome-email",
    "channel": "email",
    "name": "Welcome Email",
    "subject": "Welcome {{name}}!",
    "body": "Hello {{name}}, welcome to our platform!",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /templates/:id

Update a template (add subject and body).

**Request:**
```
PATCH /api/templates/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Welcome {{name}}!",
  "body": "Hello {{name}}, welcome to our platform!"
}
```

**Response (200 OK):**
```json
{
  "message": "Template updated successfully",
  "template": {
    "id": 1,
    "slug": "welcome-email",
    "channel": "email",
    "name": "Welcome Email",
    "subject": "Welcome {{name}}!",
    "body": "Hello {{name}}, welcome to our platform!",
    "userId": 1
  }
}
```

#### DELETE /templates/:id

Delete a template.

**Request:**
```
DELETE /api/templates/1
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Template deleted successfully"
}
```

---

### Template Attachments

#### GET /attachments/:templateId/

Get all attachments for a template.

**Request:**
```
GET /api/attachments/1/
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "attachments": [
    {
      "id": 1,
      "templateId": 1,
      "fileId": 1,
      "filename": "welcome.pdf",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /attachments/:templateId/

Add an attachment to a template.

**Request:**
```
POST /api/attachments/1/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileId": 1
}
```

**Response (201 Created):**
```json
{
  "message": "Attachment added successfully",
  "attachment": {
    "id": 1,
    "templateId": 1,
    "fileId": 1,
    "filename": "welcome.pdf"
  }
}
```

#### DELETE /attachments/:templateId/:attachmentId

Remove an attachment from a template.

**Request:**
```
DELETE /api/attachments/1/1
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Attachment removed successfully"
}
```

---

### Notifications

#### POST /notification/notify/upload-attachments

Upload attachments for email notifications.

**Request:**
```
POST /api/notification/notify/upload-attachments
x-api-key: <API_KEY>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: Array of files to upload

**Response (200 OK):**
```json
{
  "message": "Files uploaded successfully",
  "attachments": [
    {
      "id": 1,
      "filename": "document.pdf",
      "url": "/uploads/12345678-1234-1234-1234-123456789012.pdf"
    }
  ]
}
```

#### POST /notification/notify/email

Create and queue an email notification.

**Request:**
```
POST /api/notification/notify/email
x-api-key: <API_KEY>
Content-Type: multipart/form-data
```

**Form Data:**
- `customerId`: "user123"
- `customerEmail`: "user@example.com"
- `templateSlug`: "welcome"
- `data`: JSON string with template variables
- `to`: (optional) Array of email addresses
- `cc`: (optional) Array of CC email addresses
- `bcc`: (optional) Array of BCC email addresses
- `replyTo`: (optional) Reply-to email address
- `files`: (optional) Array of attachment files
- `filePaths`: (optional) Array of file paths
- `uploadedPaths`: (optional) Array of uploaded file objects

**Response (200 OK):**
```json
{
  "message": "Email notification queued",
  "notification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "channel": "email",
    "customerId": "user123",
    "customerEmail": "user@example.com",
    "templateSlug": "welcome",
    "status": "queued"
  }
}
```

#### POST /notification/notify/push

Create and queue a push notification.

**Request:**
```
POST /api/notification/notify/push
x-api-key: <API_KEY>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerId": "user123",
  "customerEmail": "user@example.com",
  "templateSlug": "welcome",
  "data": {
    "name": "John Doe"
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Push notification queued",
  "notification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "channel": "push",
    "customerId": "user123",
    "customerEmail": "user@example.com",
    "templateSlug": "welcome",
    "status": "queued"
  }
}
```

#### POST /notification/test/email

Send a test email notification.

**Request:**
```
POST /api/notification/test/email
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateSlug": "welcome",
  "data": {
    "name": "Test User"
  },
  "to": ["test@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "replyTo": "reply@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Test email sent"
}
```

#### POST /notification/test/push

Send a test push notification.

**Request:**
```
POST /api/notification/test/push
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateSlug": "welcome",
  "data": {
    "name": "Test User"
  },
  "userId": "test-user-123"
}
```

**Response (200 OK):**
```json
{
  "message": "Test push notification sent"
}
```

#### GET /notification/queue/jobs

Get queued notification jobs.

**Request:**
```
GET /api/notification/queue/jobs
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "jobs": [
    {
      "id": "job-123",
      "channel": "email",
      "status": "waiting",
      "data": {
        "userId": "user123",
        "templateSlug": "welcome"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /notification/:notificationId

Get a specific notification by ID.

**Request:**
```
GET /api/notification/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "notification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "channel": "email",
    "customerId": "user123",
    "customerEmail": "user@example.com",
    "templateSlug": "welcome",
    "status": "sent",
    "jobId": "job-123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "sentAt": "2024-01-01T00:00:05.000Z"
  }
}
```

#### DELETE /notification/:notificationId

Delete a notification (production environment requires confirmation).

**Request:**
```
DELETE /api/notification/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Notification deleted"
}
```

---

### Push Subscriptions

#### GET /subscription

Get user's push subscription.

**Request:**
```
GET /api/subscription
x-api-key: <API_KEY>
```

**Response (200 OK):**
```json
{
  "subscription": {
    "id": 1,
    "customerId": "user123",
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "p256dh-key",
      "auth": "auth-key"
    }
  }
}
```

#### POST /subscription/subscribe

Subscribe to push notifications.

**Request:**
```
POST /api/subscription/subscribe
x-api-key: <API_KEY>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerId": "user123",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "p256dh-key",
      "auth": "auth-key"
    }
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Subscribed to push notifications"
}
```

#### POST /subscription/unsubscribe

Unsubscribe from push notifications.

**Request:**
```
POST /api/subscription/unsubscribe
x-api-key: <API_KEY>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerId": "user123"
}
```

**Response (200 OK):**
```json
{
  "message": "Unsubscribed from push notifications"
}
```

#### GET /subscription/internal

Get internal user subscription (admin).

**Request:**
```
GET /api/subscription/internal
Authorization: Bearer <JWT_TOKEN>
```

#### POST /subscription/internal-subscribe

Create internal subscription (admin).

**Request:**
```
POST /api/subscription/internal-subscribe
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### POST /subscription/internal-unsubscribe

Remove internal subscription (admin).

**Request:**
```
POST /api/subscription/internal-unsubscribe
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

### File Management

#### POST /files

Upload a file.

**Request:**
```
POST /api/files
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload

**Response (201 Created):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "filename": "document.pdf",
    "originalName": "my-document.pdf",
    "mimeType": "application/pdf",
    "size": 12345,
    "url": "/uploads/12345678-1234-1234-1234-123456789012.pdf"
  }
}
```

#### GET /files/:id

Get file information.

**Request:**
```
GET /api/files/1
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "file": {
    "id": 1,
    "filename": "document.pdf",
    "originalName": "my-document.pdf",
    "mimeType": "application/pdf",
    "size": 12345,
    "url": "/uploads/12345678-1234-1234-1234-123456789012.pdf",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### DELETE /files/:id

Delete a file.

**Request:**
```
DELETE /api/files/1
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "File deleted successfully"
}
```

---

### Job Monitoring

#### GET /jobs/:channel/:jobId

Get job details by channel and job ID.

**Request:**
```
GET /api/jobs/email/job-123
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "job": {
    "id": "job-123",
    "channel": "email",
    "status": "completed",
    "data": {
      "userId": "user123",
      "templateSlug": "welcome"
    },
    "result": {
      "messageId": "1234567890"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:00:05.000Z"
  }
}
```

---

### Dashboard

#### GET /dashboard/stream

Get dashboard stream data (Server-Sent Events).

**Request:**
```
GET /api/dashboard/stream
Authorization: Bearer <JWT_TOKEN>
```

**Response:** Server-Sent Events stream with real-time data.

---

### Miscellaneous

#### GET /open-file

Open file endpoint (purpose unclear from code).

**Request:**
```
GET /open-file
```

---

## Request/Response Schemas

### Common Response Format

All API responses follow this general structure:

**Success Response:**
```json
{
  "message": "Operation successful",
  "data": { ... } // Optional data object
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "error": "Detailed error information" // Optional
}
```

### Validation Errors

Validation errors return detailed field-specific errors:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

---

## Examples

### Creating a Template

```bash
curl -X POST http://localhost:3000/api/templates/create \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "welcome",
    "channel": "email",
    "name": "Welcome Email",
    "subject": "Welcome {{name}}!",
    "body": "Hello {{name}}, welcome to our platform!"
  }'
```

### Sending an Email Notification

```bash
curl -X POST http://localhost:3000/api/notification/notify/email \
  -H "Authorization: Bearer your-api-key" \
  -F "customerId=user123" \
  -F "customerEmail=user@example.com" \
  -F "templateSlug=welcome" \
  -F 'data={"name":"John Doe"}'
```

### Sending a Push Notification

```bash
curl -X POST http://localhost:3000/api/notification/notify/push \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "user123",
    "customerEmail": "user@example.com",
    "templateSlug": "welcome",
    "data": {
      "name": "John Doe"
    }
  }'
```

### Managing API Keys

```bash
# Generate new API key
curl -X POST http://localhost:3000/api/keys/generate \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key",
    "scopes": ["email", "push"]
  }'

# List API keys
curl -X GET http://localhost:3000/api/keys \
  -H "Authorization: Bearer your-jwt-token"
```

Creates a notification template that can be reused across notifications. Templates support Handlebars syntax for variable interpolation.

**Request:**
```
POST /api/create-template
Content-Type: application/json
```

**Request Body:**
```json
{
  "slug": "welcome",
  "channel": "push",
  "subject": "Welcome {{name}}",
  "body": "Hello {{name}}, welcome to our system!"
}
```

**Fields:**
- `slug` (string, required): Unique identifier for the template
- `channel` (string, required): Notification channel - `email` or `push`
- `subject` (string, required): Template subject/title (supports Handlebars variables)
- `body` (string, required): Template body/content (supports Handlebars variables)

**Response (200 OK):**
```json
{
  "message": "Template created."
}
```

**Response (500 Error):**
```json
{
  "message": "Failed to create template"
}
```

---

### Notifications

#### POST /notify

Creates and queues a notification for delivery through the specified channel.

**Request:**
```
POST /api/notify
Content-Type: application/json
x-api-key: <API_KEY>
Idempotency-Key: <optional-unique-key>
```

**Request Body:**
```json
{
  "channel": "email",
  "user_id": "user123",
  "user_email": "user@example.com",
  "templateSlug": "welcome",
  "data": {
    "name": "John Doe",
    "customField": "customValue"
  }
}
```

**Fields:**
- `channel` (string, required): Notification channel - `email` or `push`
- `user_id` (string, required): Unique identifier for the user
- `user_email` (string, required): User's email address
- `templateSlug` (string, required): Identifier of the template to use
- `data` (object, required): Variables to interpolate in the template

**Headers:**
- `Authorization` (string, required): API key for authentication
- `Idempotency-Key` (string, optional): Unique identifier for idempotency. If the same key is sent multiple times, the first request will be processed and subsequent requests will return the same notification ID

**Response (200 OK):**
```json
{
  "message": "Notification queued",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK - Idempotent):**
```json
{
  "message": "Already processed",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Failed to queue notification"
}
```

**Response (500 Error):**
```json
{
  "message": "Failed to queue notification"
}
```

**Special Cases:**
- If `channel` is `push`, the user must have an active browser subscription. If no subscription exists, an error is returned.
- Notifications are validated against the `notifySchema` before processing.

---

### Push Subscriptions

#### POST /subscribe

Registers or updates a browser push notification subscription for a user.

**Request:**
```
POST /api/subscribe
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user123",
  "user_email": "user@example.com",
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-public-key",
    "auth": "base64-encoded-auth-secret"
  }
}
```

**Fields:**
- `user_id` (string, required): Unique identifier for the user
- `user_email` (string, required): User's email address
- `endpoint` (string, required): Push service endpoint URL
- `keys` (object, required): Web push encryption keys
  - `p256dh` (string): Base64-encoded ECDH public key
  - `auth` (string): Base64-encoded authentication secret

**Response (200 OK):**
```json
{
  "success": true
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "userId, endpoint and keys are required"
}
```

**Response (500 Error):**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

**Notes:**
- Duplicate subscriptions (same endpoint and user_id) are not created
- If a user has multiple devices, each subscription must have a unique endpoint

---

#### GET /list

Retrieves all active browser push subscriptions.

**Request:**
```
GET /api/list
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "user123",
      "user_email": "user@example.com",
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "base64-encoded-public-key",
        "auth": "base64-encoded-auth-secret"
      },
      "createdAt": "2026-04-21T10:30:00Z",
      "updatedAt": "2026-04-21T10:30:00Z"
    }
  ],
  "success": true
}
```

**Response (500 Error):**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Request/Response Schemas

### Notification Schema

Used for validating POST `/notify` requests:

```typescript
{
  channel: enum["email", "push"],     // Required
  user_id: string(min: 1),            // Required
  user_email: string(min: 1),         // Required
  templateSlug: string(min: 1),       // Required
  data: Record<string, any>           // Required
}
```

### API Key Model

Stored in the database:

```typescript
{
  id: UUID,                           // Primary key
  name: string,                       // Display name
  key_hash: string,                   // SHA-256 hash of the actual key
  scopes: string[],                   // ["email", "push", ...]
  createdAt: datetime,
  updatedAt: datetime
}
```

### Notification Model

Stored in the database:

```typescript
{
  id: UUID,                           // Primary key
  channel: enum["email", "push"],     // Notification channel
  user_id: string,                    // User identifier
  user_email: string,                 // User email
  recipient: string,                  // Resolved recipient (email or push endpoint)
  template_slug: string,              // Template reference
  data: JSON,                         // Interpolation data
  status: enum[
    "queued",                         // Awaiting processing
    "sent",                           // Successfully delivered
    "failed",                         // Delivery failed
    "processing"                      // Currently being processed
  ],
  idempotency_key: string | null,     // Optional idempotency key
  createdAt: datetime,
  updatedAt: datetime
}
```

### Template Model

Stored in the database:

```typescript
{
  id: UUID,                           // Primary key
  slug: string,                       // Unique identifier
  channel: enum["email", "push"],     // Target channel
  subject: string,                    // Subject/title with Handlebars support
  body: string,                       // Body content with Handlebars support
  createdAt: datetime,
  updatedAt: datetime
}
```

### BrowserSubscription Model

Stored in the database:

```typescript
{
  id: UUID,                           // Primary key
  user_id: string,                    // User identifier
  user_email: string,                 // User email
  endpoint: string,                   // Push service endpoint
  keys: JSON,                         // Encryption keys (p256dh, auth)
  createdAt: datetime,
  updatedAt: datetime
}
```

---

## Error Handling

The API returns standard HTTP status codes:

- **200 OK** - Request successful
- **400 Bad Request** - Invalid request parameters or validation failure
- **401 Unauthorized** - Missing or invalid API key
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side error

All error responses follow this format:

```json
{
  "message": "Error description",
  "error": "Additional error details (optional)"
}
```

or

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Examples

### Example 1: Complete Workflow - Email Notification

**Step 1: Create Test API Key**
```bash
curl -X POST http://localhost:3000/api/create-test-key
```

Response:
```json
{
  "message": "API key created",
  "key": "my-secret-key"
}
```

**Step 2: Create Email Template**
```bash
curl -X POST http://localhost:3000/api/create-template \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "welcome",
    "channel": "email",
    "subject": "Welcome {{name}}!",
    "body": "Hello {{name}}, thank you for joining us!"
  }'
```

**Step 3: Send Email Notification**
```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-key" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{
    "channel": "email",
    "user_id": "user456",
    "user_email": "john@example.com",
    "templateSlug": "welcome",
    "data": {
      "name": "John Doe"
    }
  }'
```

Response:
```json
{
  "message": "Notification queued",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Example 2: Complete Workflow - Push Notification

**Step 1: Register Push Subscription**
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user789",
    "user_email": "jane@example.com",
    "endpoint": "https://fcm.googleapis.com/fcm/send/example...",
    "keys": {
      "p256dh": "ABC123...base64encoded",
      "auth": "XYZ789...base64encoded"
    }
  }'
```

Response:
```json
{
  "success": true
}
```

**Step 2: Create Push Template**
```bash
curl -X POST http://localhost:3000/api/create-template \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "order-shipped",
    "channel": "push",
    "subject": "Your order shipped!",
    "body": "Order {{order_id}} has been shipped and will arrive on {{delivery_date}}"
  }'
```

**Step 3: Send Push Notification**
```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-key" \
  -d '{
    "channel": "push",
    "user_id": "user789",
    "user_email": "jane@example.com",
    "templateSlug": "order-shipped",
    "data": {
      "order_id": "ORD-12345",
      "delivery_date": "2026-04-25"
    }
  }'
```

Response:
```json
{
  "message": "Notification queued",
  "id": "660e8400-e29b-41d4-a716-446655440001"
}
```

---

### Example 3: List All Subscriptions

```bash
curl -X GET http://localhost:3000/api/list
```

Response:
```json
{
  "data": [
    {
      "id": "sub-uuid-001",
      "user_id": "user789",
      "user_email": "jane@example.com",
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "ABC123...",
        "auth": "XYZ789..."
      },
      "createdAt": "2026-04-21T12:00:00Z",
      "updatedAt": "2026-04-21T12:00:00Z"
    }
  ],
  "success": true
}
```

---

## Integration Notes

### Idempotency

The notification endpoint supports idempotent requests using the `Idempotency-Key` header. This ensures that if the same request is sent multiple times with the same key, only one notification is created. This is useful for preventing duplicate notifications in case of network retries.

### Template Variables

Templates use Handlebars syntax for variable interpolation:

```
Template: "Hello {{name}}, your order {{order_id}} is ready!"
Data: { "name": "Alice", "order_id": "ORD-999" }
Result: "Hello Alice, your order ORD-999 is ready!"
```

### Channel-Specific Behavior

**Email Channel:**
- Requires `user_email` field
- Uses SMTP to send emails
- Requires email template

**Push Channel:**
- Requires active browser subscription for the user
- Uses Web Push API to send notifications
- Requires push template
- Returns error if user has no active subscription

### Queue Processing

Notifications are placed in a job queue for asynchronous processing. A separate worker service processes queued notifications and updates their status (sent/failed).

---

## Rate Limiting

Currently, there is no built-in rate limiting. Consider implementing rate limiting based on:
- API key
- User ID
- IP address

---

## Future Enhancements

- [ ] Rate limiting per API key
- [ ] Notification delivery status webhooks
- [ ] Batch notification endpoint
- [ ] Template versioning
- [ ] Notification history/analytics
- [ ] Advanced retry logic with exponential backoff
- [ ] SMS channel support
- [ ] Slack/Teams integration
