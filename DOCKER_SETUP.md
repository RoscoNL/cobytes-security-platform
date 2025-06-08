# Docker Setup Guide for Cobytes Security Platform

## Prerequisites
- Docker Desktop installed and running
- At least 4GB of RAM allocated to Docker
- Ports 3001, 3002, 5432, 6379 available

## Quick Start

### 1. Clone the repository (if not already done)
```bash
git clone https://github.com/RoscoNL/cobytes-security-platform.git
cd cobytes-security-platform
```

### 2. Create environment file
```bash
cp .env.example .env
```

### 3. Start all services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis for sessions (port 6379)
- Backend API (port 3001)
- Frontend (port 3002)

### 4. Wait for services to be ready
The first time may take a few minutes as Docker builds the images. Check status:
```bash
docker-compose ps
```

### 5. Access the application
- Frontend: http://localhost:3002
- Backend API: http://localhost:3001/health
- pgAdmin (optional): http://localhost:5050

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild after code changes
```bash
docker-compose build
docker-compose up -d
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d
```

### Access container shell
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Run database migrations manually
```bash
docker-compose exec backend npm run migrate
```

## Development Workflow

1. **Hot Reload**: Both frontend and backend support hot reload
   - Frontend changes: Automatically reloaded
   - Backend changes: Nodemon restarts the server

2. **Database Access**: Use pgAdmin (optional)
   ```bash
   docker-compose --profile tools up -d pgadmin
   ```
   - URL: http://localhost:5050
   - Email: admin@cobytes.nl
   - Password: admin
   - Add server with:
     - Host: postgres
     - Port: 5432
     - Database: cobytes_db
     - Username: cobytes_user
     - Password: cobytes_password

3. **Testing API**: The backend includes seed data for products

## Troubleshooting

### Port already in use
If you get port conflicts, either:
1. Stop the conflicting service, or
2. Change ports in docker-compose.yml

### Database connection issues
```bash
# Check if database is ready
docker-compose exec postgres pg_isready

# Check database logs
docker-compose logs postgres
```

### Frontend can't connect to backend
1. Ensure backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify CORS settings in backend environment

### Reset everything
```bash
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

Key environment variables (see .env.example):
- `JWT_SECRET`: Change in production!
- `SESSION_SECRET`: Change in production!
- `MULTISAFEPAY_*`: Add your test credentials for payment testing
- `PENTEST_TOOLS_API_KEY`: Already included for testing

## Production Deployment

For production, use the production Dockerfiles:
- `backend/Dockerfile` (not Dockerfile.dev)
- `frontend/Dockerfile` (not Dockerfile.dev)

And update environment variables with production values.