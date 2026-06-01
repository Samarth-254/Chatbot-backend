# Backend - Customer Query Replying Chatbot API

This backend provides the API, authentication, role-based access control, document processing, custom Q&A management, and chat handling for the Customer Query Replying Chatbot system.

## Overview

The backend is designed to support two major needs:

- A **public-facing chatbot API** for customer questions.
- A **secure admin API** for managing chatbot knowledge and monitoring usage.

The architecture separates authentication, authorization, controller logic, route handling, configuration, and utility functions to improve maintainability and security.

## Features

### Authentication and authorization

- User registration and login
- Separate admin login
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Optional authentication for public chat usage
- Protected admin-only routes for dashboard resources

### Knowledge management

- Upload documents such as PDF, DOC, DOCX, XLS, and XLSX
- Parse and chunk document content for retrieval
- Store and manage uploaded knowledge sources
- Add, update, delete, and search custom Q&A pairs

### Chat handling

- Accept customer queries
- Use uploaded knowledge and custom Q&A as answer context
- Support guest chat and authenticated chat
- Save session-based history for logged-in users
- Provide admin access to chatbot logs and analytics endpoints

### Reliability improvements

- Centralized environment validation
- Centralized error handling middleware
- Async controller wrapper to reduce repetitive try/catch blocks
- Safer user schema with hidden password hash
- Strict role enum in user model

## Tech stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT**
- **bcryptjs**
- **Multer**
- **Cloudinary** (optional, if configured)

## Architecture

The backend is organized by responsibility:

```bash
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  app.js
  server.js
```

### `config/`

Contains:

- database connection setup
- environment configuration
- Cloudinary configuration

### `controllers/`

Contains request-handling logic for:

- authentication
- chat
- documents
- custom Q&A

### `middleware/`

Contains reusable middleware such as:

- authentication
- role authorization
- optional authentication
- error handling

### `models/`

Contains MongoDB schemas such as:

- `User`
- document model
- QA model
- chat model

### `routes/`

Defines API endpoints and attaches middleware.

### `utils/`

Contains helpers such as:

- token generation
- async wrapper
- text chunking

## Key technical decisions

### 1. Authentication and authorization were separated

The backend uses separate middleware for:

- **authentication** -> identifying the user
- **authorization** -> deciding whether the user can access a resource

This keeps RBAC more explicit and easier to maintain.

### 2. JWT includes role-aware identity

Tokens are generated in a way that supports role-aware access checks, making the auth flow more scalable for route protection.

### 3. Optional auth for chat queries

The chat query route supports guest users while still attaching user identity when a valid token is present. This allows public chatbot usage without sacrificing authenticated history features.

### 4. Centralized error handling

Controllers are simplified with an async handler utility and global error middleware. This reduces duplicated error boilerplate and makes failures easier to debug.

### 5. Safer config handling

Critical config such as JWT secret is validated through centralized environment handling so the server does not silently run with insecure defaults.

## Route protection model

### Public routes

- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `POST /api/auth/register`
- `GET /health`

### Public route with optional auth

- `POST /api/chat/query`

### Authenticated routes

- `GET /api/auth/profile`
- `GET /api/chat/user-history`

### Admin-only routes

- `GET /api/auth/users/count`
- `POST /api/documents/upload`
- `GET /api/documents`
- `DELETE /api/documents/:id`
- `GET /api/qa`
- `POST /api/qa`
- `PUT /api/qa/:id`
- `DELETE /api/qa/:id`
- `GET /api/chat/history`
- `DELETE /api/chat/history`

## Setup instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the backend root.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_llm_key
```

### 3. Run the backend

```bash
npm run dev
```

Or:

```bash
node server.js
```

## Important backend modules

### `authMiddleware.js`

Responsible for:

- authenticating JWT tokens
- authorizing access based on role
- supporting optional authentication for public routes

### `authController.js`

Responsible for:

- user login
- admin login
- registration
- profile fetch
- user count for admin dashboard

### `chatController.js`

Responsible for:

- receiving chat queries
- retrieving context
- generating responses
- saving session history when applicable
- exposing history endpoints

### `documentController.js`

Responsible for:

- document upload
- text extraction
- chunking and storage
- listing and deleting documents

### `qaController.js`

Responsible for:

- creating Q&A pairs
- updating Q&A pairs
- deleting Q&A pairs
- listing and searching Q&A data

## Security notes

- Admin-only routes are protected by RBAC.
- Passwords are hashed using bcrypt.
- Password field is hidden by default in the user schema.
- JWT secret should never be hardcoded.
- Frontend route protection should always be paired with backend authorization.

