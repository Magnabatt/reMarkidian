FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install SQLite3 and other dependencies
RUN apk add --no-cache sqlite

# Copy package files for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Copy source code
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build React app for production
WORKDIR /app/frontend
RUN npm run build

# Move built React app to backend public directory
WORKDIR /app/backend
RUN mkdir -p public && cp -r ../frontend/build/* public/

# Create data directories
RUN mkdir -p /app/data/db /app/data/logs /app/data/tmp

# Set working directory back to backend
WORKDIR /app/backend

# Expose port (we'll use 5000 for both API and frontend)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
