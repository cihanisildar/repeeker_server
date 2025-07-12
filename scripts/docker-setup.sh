#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Repeeker Server with Docker...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# Database Configuration
POSTGRES_DB=repeeker_db
POSTGRES_USER=repeeker_user
POSTGRES_PASSWORD=repeeker_password

# Redis Configuration
REDIS_PASSWORD=redis_password

# Application Configuration
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_ACCESS_SECRET=dev-jwt-access-secret-change-in-production
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-in-production
NEXTAUTH_SECRET=dev-nextauth-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
PORT=8080
LOG_LEVEL=debug

# External APIs
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *
EOF
    echo -e "${GREEN}Created .env file${NC}"
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

# Create logs directory if it doesn't exist
if [ ! -d logs ]; then
    echo -e "${YELLOW}Creating logs directory...${NC}"
    mkdir -p logs
    echo -e "${GREEN}Created logs directory${NC}"
else
    echo -e "${YELLOW}Logs directory already exists${NC}"
fi

# Build and start the containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for the database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec app npm run db:migrate

# Check if the application is running
echo -e "${YELLOW}Checking if the application is running...${NC}"
sleep 5

if curl -f http://localhost:8080/api/auth/test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Repeeker Server is running successfully!${NC}"
    echo -e "${GREEN}🌐 API is available at: http://localhost:8080${NC}"
    echo -e "${GREEN}📚 API Documentation is available at: http://localhost:8080/api-docs${NC}"
else
    echo -e "${RED}❌ Application failed to start properly${NC}"
    echo -e "${YELLOW}Check the logs with: docker-compose logs app${NC}"
    exit 1
fi

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}To stop the application, run: docker-compose down${NC}"
echo -e "${YELLOW}To view logs, run: docker-compose logs -f${NC}" 