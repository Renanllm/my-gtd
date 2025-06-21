# My GTD Backend API

A Node.js Express API for the My GTD application.

## Features

- RESTful API with Express.js
- CORS enabled for frontend integration
- Security headers with Helmet
- Request logging with Morgan
- Environment variable configuration
- Basic CRUD operations for users and projects
- Error handling and validation
- Health check endpoint

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests (when implemented)

## API Endpoints

### Base URL
- `GET /` - API info
- `GET /health` - Health check

### Users API (`/api/v1/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

### Projects API (`/api/v1/projects`)
- `GET /` - Get all projects
- `GET /:id` - Get project by ID
- `POST /` - Create new project
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

## Environment Variables

Copy `env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

## Project Structure

```
backend/
├── src/
│   ├── server.js          # Main server file
│   └── routes/
│       ├── index.js       # Main router
│       ├── users.js       # User routes
│       └── projects.js    # Project routes
├── package.json
├── .gitignore
├── env.example
└── README.md
```

## Development

The API uses in-memory storage for development. In production, you'll want to integrate with a database.

## Security

- Helmet.js for security headers
- CORS configuration
- Input validation
- Error handling without exposing sensitive information

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed 