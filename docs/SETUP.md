# reMarkidian Setup Guide

## Prerequisites

Before setting up reMarkidian, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Docker** and **Docker Compose**
- **Git**

### Installation Commands

#### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### macOS (using Homebrew)
```bash
# Install Node.js
brew install node

# Install Docker Desktop
brew install --cask docker
```

#### Windows
1. Download and install Node.js from [nodejs.org](https://nodejs.org/)
2. Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)

## Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/reMarkidian.git
cd reMarkidian
```

### 2. Environment Configuration
Create environment files for development:

```bash
# Backend environment
cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
DB_PATH=/app/data/db/remarkidian.db
LOG_PATH=/app/data/logs
FRONTEND_URL=http://localhost:3000
EOF

# Frontend environment
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000
CHOKIDAR_USEPOLLING=true
EOF
```

### 3. Docker Development (Recommended)

#### Build and Start Application
```bash
# Build the unified container
docker-compose build

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Access the Application
- **Web Application**: http://localhost:5000
- **API Endpoints**: http://localhost:5000/api/*
- **Health Check**: http://localhost:5000/api/health

#### Stop Application
```bash
docker-compose down
```

### 4. Local Development (Alternative)

If you prefer to run services locally without Docker:

#### Backend Setup
```bash
cd backend
npm install
npm run dev
```

#### Frontend Setup (in another terminal)
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
reMarkidian/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── app.js          # Main application entry
│   │   ├── config/         # Database and app configuration
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # Styled components and themes
│   │   └── utils/          # Frontend utilities
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── data/                   # Persistent data (created at runtime)
│   ├── db/                # SQLite database files
│   ├── logs/              # Application logs
│   └── tmp/               # Temporary files
├── docs/                   # Documentation
├── docker-compose.yml      # Multi-service orchestration
└── README.md
```

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/system` - Detailed system information

### Vaults Management
- `GET /api/vaults` - List all vaults
- `POST /api/vaults` - Create new vault
- `GET /api/vaults/:id` - Get vault details
- `PUT /api/vaults/:id` - Update vault
- `DELETE /api/vaults/:id` - Delete vault

### Sync Operations
- `GET /api/sync/status` - Current sync status
- `GET /api/sync/history` - Sync history
- `POST /api/sync/start` - Start manual sync
- `POST /api/sync/stop/:id` - Stop running sync

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting
- `POST /api/settings/:key/reset` - Reset to default

## Database Schema

The application uses SQLite with the following tables:

- **vaults** - Vault configurations
- **sync_history** - Sync operation logs
- **settings** - Application settings
- **notes** - Synced note tracking
- **notifications** - System notifications

## Development Commands

### Backend
```bash
cd backend
npm run dev      # Start development server
npm run start    # Start production server
npm run test     # Run tests
npm run lint     # Run ESLint
```

### Frontend
```bash
cd frontend
npm start        # Start development server
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Run ESLint
```

### Docker
```bash
# Development
docker-compose up -d              # Start the application
docker-compose logs -f            # View application logs
docker-compose restart app        # Restart the application

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

#### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

#### Database Connection Issues
```bash
# Check if data directory exists and has correct permissions
ls -la data/
sudo chown -R $USER:$USER data/
```

#### Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After completing the setup:

1. **Configure reMarkable Token**: Add your reMarkable Cloud API token in Settings
2. **Create First Vault**: Set up your first Obsidian vault with GitHub integration
3. **Test Sync**: Perform a manual sync to verify everything works
4. **Schedule Automatic Sync**: Configure cron schedule for automatic syncing

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/your-username/reMarkidian/issues)
- Review the [Documentation](./README.md)
- Join our [Discord Community](https://discord.gg/remarkidian)
