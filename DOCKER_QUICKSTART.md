# Docker Quick Start

## ✅ Current Status
All services are running in Docker:
- ✅ PostgreSQL (port 5433)
- ✅ Redis (port 6379)
- ✅ Backend API (port 3001)
- ✅ Frontend (port 3002)

## 🚀 Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001/health
- **Products API**: http://localhost:3001/api/products

## 🛠️ Common Commands

### View logs
```bash
docker-compose logs -f          # All services
docker-compose logs -f backend  # Backend only
docker-compose logs -f frontend # Frontend only
```

### Restart services
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Stop everything
```bash
docker-compose down
```

### Start everything
```bash
docker-compose up -d
```

### Rebuild after code changes
```bash
docker-compose build backend
docker-compose up -d backend
```

## 📝 Notes

- Frontend hot reload is enabled - changes to React code will auto-refresh
- Backend uses nodemon - changes to backend code will auto-restart
- Database data persists in Docker volumes
- All environment variables are configured in docker-compose.yml

## 🔧 Troubleshooting

If you see "default-session" in cart API responses, this is expected in development. 
The SESSION_SECRET is configured but cookies need to be properly set by the browser.