#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== CORS DIAGNOSTIC SCRIPT ===${NC}"

# Check if running in production or development
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    echo -e "${GREEN}Running in PRODUCTION mode${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
    echo -e "${GREEN}Running in DEVELOPMENT mode${NC}"
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found!${NC}"
    echo -e "${YELLOW}Please create $ENV_FILE with the following variables:${NC}"
    echo "CORS_ORIGIN=https://www.repeeker.com"
    echo "JWT_SECRET=your_jwt_secret"
    echo "NEXTAUTH_SECRET=your_nextauth_secret"
    exit 1
fi

# Check CORS_ORIGIN in .env file
if grep -q "CORS_ORIGIN" "$ENV_FILE"; then
    CORS_ORIGIN=$(grep "CORS_ORIGIN" "$ENV_FILE" | cut -d '=' -f2)
    echo -e "${GREEN}CORS_ORIGIN found: $CORS_ORIGIN${NC}"
else
    echo -e "${RED}CORS_ORIGIN not found in $ENV_FILE${NC}"
    echo -e "${YELLOW}Please add: CORS_ORIGIN=https://www.repeeker.com${NC}"
fi

# Restart services
echo -e "${YELLOW}Restarting services...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Test CORS endpoints
echo -e "${YELLOW}Testing CORS endpoints...${NC}"

# Test the API directly
echo -e "${GREEN}Testing API directly:${NC}"
curl -H "Origin: https://www.repeeker.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -v \
     https://api.repeeker.com/cors-test

echo -e "\n${GREEN}Testing GET request:${NC}"
curl -H "Origin: https://www.repeeker.com" \
     -v \
     https://api.repeeker.com/cors-test

echo -e "\n${YELLOW}=== CORS TEST COMPLETE ===${NC}"
echo -e "${GREEN}If you see CORS errors above, check:${NC}"
echo "1. CORS_ORIGIN environment variable is set correctly"
echo "2. nginx configuration is properly loaded"
echo "3. SSL certificates are valid"
echo "4. DNS is pointing to the correct server"