# Repeeker Server

A robust Node.js backend application for a flashcard-based learning system with spaced repetition functionality.

## Features

- User authentication and authorization
- Flashcard management with word lists
- Spaced repetition system for optimal learning
- Progress tracking and statistics
- Test sessions and review management
- Word details including synonyms, antonyms, and examples
- Streak tracking for user engagement
- Customizable review schedules

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Jest
- **Containerization**: Docker

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Docker (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/repeeker-server.git
cd repeeker-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/repeeker"
JWT_SECRET="your-jwt-secret"
PORT=3000
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Development

Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Word Lists
- `GET /api/wordlists` - Get all word lists
- `POST /api/wordlists` - Create a new word list
- `GET /api/wordlists/:id` - Get a specific word list
- `PUT /api/wordlists/:id` - Update a word list
- `DELETE /api/wordlists/:id` - Delete a word list

### Cards
- `GET /api/cards` - Get all cards
- `POST /api/cards` - Create a new card
- `GET /api/cards/:id` - Get a specific card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card

### Review Sessions
- `POST /api/review/start` - Start a new review session
- `POST /api/review/submit` - Submit a review result
- `GET /api/review/history` - Get review history

## Docker Support

Build and run with Docker:
```bash
docker build -t repeeker-server .
docker run -p 3000:3000 repeeker-server
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 