# Deployment Instructions for Cobytes Security Platform

## Database Configuration

Your DigitalOcean Managed PostgreSQL database is ready. To connect your app:

### 1. Go to DigitalOcean App Platform Dashboard
https://cloud.digitalocean.com/apps/93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c

### 2. Update Environment Variables

Click on **Settings** → **api** component → **Environment Variables** and add/update:

```
DATABASE_URL = postgresql://doadmin:[YOUR_PASSWORD]@private-db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

**Remove these if they exist:**
- SKIP_DB

**Ensure these are set:**
- NODE_ENV = production
- PORT = 3001
- JWT_SECRET = cobytes-jwt-secret-prod-2024
- JWT_REFRESH_SECRET = cobytes-jwt-refresh-secret-prod-2024
- PENTEST_TOOLS_API_KEY = 43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7
- PENTEST_TOOLS_API_URL = https://app.pentest-tools.com/api/v2
- CORS_ORIGIN = https://securityscan.cobytes.com

### 3. Deploy
After saving the environment variables, click **Deploy** to trigger a new deployment.

## Database Connection Details

- **Username:** doadmin
- **Password:** [Use your actual password]
- **Host (Private Network):** private-db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com
- **Host (Public):** db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com
- **Port:** 25060
- **Database:** defaultdb
- **SSL Mode:** require

**Note:** Using the private network host (private-db-...) is recommended for better security and performance when the app is in the same region.

## Restoring Database Backup

If you have a database backup to restore:

```bash
PGPASSWORD=[YOUR_PASSWORD] pg_restore -U doadmin -h db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com -p 25060 -d defaultdb your_backup.sql
```

## Architecture

- **Frontend:** React app served as static files
- **Backend:** Node.js API with Express
- **Database:** DigitalOcean Managed PostgreSQL
- **Hosting:** DigitalOcean App Platform
- **Domain:** securityscan.cobytes.com with SSL

## Monitoring

- Check deployment status: https://cloud.digitalocean.com/apps/93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c
- View logs: Click on the component → Runtime Logs
- Database metrics: DigitalOcean Databases dashboard

## Costs

- App Platform: ~$5-10/month
- Managed Database: $15/month
- **Total:** ~$20-25/month