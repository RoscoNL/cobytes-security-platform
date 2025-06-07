# Deployment Instructions for Cobytes Security Platform

## Manual Environment Variable Setup Required

The DigitalOcean MCP API does not support updating environment variables programmatically. You must manually add them through the web interface.

### Steps to Complete Deployment:

1. **Go to your DigitalOcean Dashboard:**
   https://cloud.digitalocean.com/apps/93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c

2. **Navigate to Settings → api → Environment Variables**

3. **Add/Update these environment variables:**
   ```
   DATABASE_URL = postgresql://doadmin:[YOUR_PASSWORD]@private-db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com:25060/defaultdb?sslmode=require
   JWT_SECRET = [GENERATE_A_SECURE_SECRET]
   JWT_REFRESH_SECRET = [GENERATE_A_DIFFERENT_SECURE_SECRET]
   NODE_ENV = production
   PORT = 3001
   PENTEST_TOOLS_API_KEY = [YOUR_API_KEY]
   PENTEST_TOOLS_API_URL = https://app.pentest-tools.com/api/v2
   CORS_ORIGIN = https://securityscan.cobytes.com
   ```

4. **Remove any 'SKIP_DB' variable if it exists**

5. **Click 'Save'**

6. **Click 'Deploy' to trigger a new deployment**

## What Will Happen:

- The app will pull the latest code from GitHub
- The backend will build with TypeScript path resolution fixed
- The SSL certificate for database connection is embedded in the Docker image
- TypeORM will connect to your managed PostgreSQL database
- Tables will be auto-created on first run
- The app will be available at https://securityscan.cobytes.com

## Database Connection Details:

- Host (public): db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com
- Host (private): private-db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com
- Port: 25060
- Database: defaultdb
- SSL: Required (certificate embedded in Docker image)

## Monitor Deployment:

Check the Activity tab in DigitalOcean dashboard to monitor deployment progress and view logs.