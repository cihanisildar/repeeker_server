# Node.js Backend Boilerplate

A modern Node.js backend boilerplate with TypeScript, Express, Prisma, and best practices.

## Features

- TypeScript for type safety
- Express.js as the web framework
- Prisma as the ORM
- Clean Architecture (Controller, Service, Repository pattern)
- Error handling middleware
- Request validation
- Logging with Winston
- Environment configuration
- CORS and security middleware
- API documentation setup

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Users

- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/       # Business logic
├── repositories/   # Data access layer
├── middlewares/    # Custom middlewares
├── utils/         # Utility functions
├── routes/        # Route definitions
└── index.ts       # Application entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## License

MIT 