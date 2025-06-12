# Use Node.js LTS version
FROM node:20-slim

# Install OpenSSL and other required dependencies
RUN apt-get update && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set proper permissions
RUN chmod -R 755 /app

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"] 