# Manual Deployment Guide for Cobytes Security Platform

## 🚀 Current Status
- ✅ Code is ready and tested (86% test pass rate)
- ✅ E-commerce functionality fully implemented
- ✅ Payment integration configured (MultiSafepay)
- ✅ App spec configured in `.do/app.yaml`
- ❌ DigitalOcean authentication required for automated deployment

## 📋 Manual Deployment Steps

### 1. Authenticate with DigitalOcean

```bash
# Option A: Using Personal Access Token
doctl auth init
# Enter your DigitalOcean API token when prompted

# Option B: Using Environment Variable
export DIGITALOCEAN_TOKEN="your-api-token-here"
doctl auth init --access-token $DIGITALOCEAN_TOKEN
```

### 2. Deploy the Application

Once authenticated, run:

```bash
./deploy-to-production.sh
```

Or manually:

```bash
# Update existing app
doctl apps update 93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c --spec .do/app.yaml

# Or create new app if needed
doctl apps create --spec .do/app.yaml
```

### 3. Set Secret Environment Variables

After deployment, set these secrets in the DigitalOcean dashboard:

1. Go to: https://cloud.digitalocean.com/apps/93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c
2. Navigate to: Settings → api component → Environment Variables
3. Add these SECRET variables:

```
JWT_SECRET = [generate-secure-secret]
JWT_REFRESH_SECRET = [generate-different-secure-secret]
SESSION_SECRET = [generate-another-secure-secret]
MULTISAFEPAY_API_KEY = [your-multisafepay-api-key]
MULTISAFEPAY_SITE_ID = [your-multisafepay-site-id]
MULTISAFEPAY_SITE_CODE = [your-multisafepay-site-code]
```

### 4. Trigger Deployment

Click "Deploy" in the DigitalOcean dashboard to apply the new environment variables.

## 🔍 Post-Deployment Verification

1. **Check Frontend**: https://securityscan.cobytes.com
2. **Check API Health**: https://api.securityscan.cobytes.com/health
3. **Test Product Catalog**: https://api.securityscan.cobytes.com/api/products

## 📊 Monitor Deployment

```bash
# Check deployment status
doctl apps list-deployments 93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c

# View logs
doctl apps logs 93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c
```

## 🆘 Troubleshooting

- **Authentication Issues**: Ensure your DigitalOcean token has the correct permissions
- **Deployment Failures**: Check the Activity tab in the DigitalOcean dashboard
- **Runtime Errors**: View logs using the commands above

## 📝 Notes

- The app is configured to pull from the GitHub repository: https://github.com/RoscoNL/cobytes-security-platform.git
- Database is a managed PostgreSQL instance that will be created automatically
- All non-secret environment variables are already configured in the app spec