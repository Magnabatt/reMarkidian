FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install SQLite3 and other dependencies
RUN apk add --no-cache sqlite

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create data directories
RUN mkdir -p /app/data/db /app/data/logs /app/data/tmp

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]
