# Notification Engine API Documentation

## Overview

The Node Notification Engine is a comprehensive API service for managing and delivering notifications across multiple channels (email and push notifications). It provides endpoints for creating API keys, managing notification templates, queuing notifications, and managing browser push subscriptions.

**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [API Key Management](#api-key-management)
  - [Template Management](#template-management)
  - [Notifications](#notifications)
  - [Push Subscriptions](#push-subscriptions)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Authentication

### API Key Authentication

Most endpoints require authentication via an API key header. The API key must be passed in the request headers.

**Header Format:**
```
Authorization: Bearer <API_KEY>
```

The API key is compared against stored SHA-256 hashes in the database. Each key has associated scopes that determine what actions it can perform:

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

### API Key Management

#### POST /create-test-key

Creates a test API key for development and testing purposes.

**Request:**
```
POST /api/create-test-key
```

**Request Body:** None (uses hardcoded test key)

**Response (200 OK):**
```json
{
  "message": "API key created",
  "key": "my-secret-key"
}
```

**Response (500 Error):**
```json
{
  "message": "Failed to create API key",
  "error": "<error details>"
}
```

---

### Template Management

#### POST /create-template

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
Authorization: Bearer <API_KEY>
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
