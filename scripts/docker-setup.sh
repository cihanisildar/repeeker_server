#!/bin/bash

# Docker setup script for Repeeker
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Repeeker Docker Setup${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Create necessary directories
mkdir -p logs backups ssl uploads

print_status "Created necessary directories"

# Check for environment file
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.prod.yml"
    print_status "Setting up for production environment"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Production environment file not found. Creating from example..."
        cp .env.production.example "$ENV_FILE" 2>/dev/null || {
            print_error "Please create $ENV_FILE with your production settings"
            exit 1
        }
        print_warning "Please edit $ENV_FILE with your production values before continuing"
        exit 1
    fi
else
    ENV_FILE=".env"
    COMPOSE_FILE="docker-compose.yml"
    print_status "Setting up for development environment"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file not found. Creating basic development .env..."
        cat > .env << EOF
# Development Environment
NODE_ENV=development
DATABASE_URL=postgresql://repeeker_user:repeeker_password@localhost:5432/repeeker_db
JWT_SECRET=dev-jwt-secret-change-in-production
NEXTAUTH_SECRET=dev-nextauth-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
PORT=8080
LOG_LEVEL=debug
EOF
        print_status "Created basic .env file"
    fi
fi

# Build and start services
print_status "Building and starting services..."

if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
else
    docker-compose -f "$COMPOSE_FILE" build
    docker-compose -f "$COMPOSE_FILE" up -d
fi

print_status "Services started successfully"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec app npm run prisma:migrate
else
    docker-compose -f "$COMPOSE_FILE" exec app npm run prisma:migrate
fi

print_status "Database migrations completed"

# Show service status
echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "\n${YELLOW}Service Status:${NC}"

if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    echo -e "\n${GREEN}Your application is running at:${NC}"
    echo -e "  • HTTPS: https://localhost"
    echo -e "  • HTTP: http://localhost"
    echo -e "  • API Docs: https://localhost/api-docs"
else
    docker-compose -f "$COMPOSE_FILE" ps
    echo -e "\n${GREEN}Your application is running at:${NC}"
    echo -e "  • App: http://localhost:8080"
    echo -e "  • API Docs: http://localhost:8080/api-docs"
    echo -e "  • Database: localhost:5432"
    echo -e "  • Redis: localhost:6379"
fi

echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  • View logs: docker-compose logs -f"
echo -e "  • Stop services: docker-compose down"
echo -e "  • Restart services: docker-compose restart"
echo -e "  • Run backup: docker-compose exec db_backup /usr/local/bin/backup.sh" 