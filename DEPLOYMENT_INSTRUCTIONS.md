# Deployment Instructions for Cobytes Security Platform

## ✅ Code Status
- **Latest Code**: Pushed to GitHub (main branch)
- **E-commerce**: Fully implemented with payment integration
- **Tests**: 86% passing (18/21 tests)
- **Build**: No errors, TypeScript compilation successful

## 🚀 Deploy Using Command Line

### 1. Authenticate with DigitalOcean
```bash
doctl auth init
```
Enter your DigitalOcean API token when prompted.

### 2. Deploy to Production
```bash
./deploy-to-production.sh
```

## 🔐 Manual Environment Variable Setup

After deployment, you need to set secret environment variables:

1. **Go to your DigitalOcean Dashboard:**
   https://cloud.digitalocean.com/apps/93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c

2. **Navigate to Settings → api component → Environment Variables**

3. **Add these SECRET environment variables:**
   ```
   JWT_SECRET = [GENERATE_A_SECURE_SECRET]
   JWT_REFRESH_SECRET = [GENERATE_A_DIFFERENT_SECURE_SECRET]
   SESSION_SECRET = [GENERATE_ANOTHER_SECURE_SECRET]
   
   # MultiSafepay Integration (get from MultiSafepay dashboard)
   MULTISAFEPAY_API_KEY = [YOUR_MULTISAFEPAY_API_KEY]
   MULTISAFEPAY_SITE_ID = [YOUR_MULTISAFEPAY_SITE_ID]
   MULTISAFEPAY_SITE_CODE = [YOUR_MULTISAFEPAY_SITE_CODE]
   ```

4. **Verify these environment variables are present:**
   ```
   DATABASE_URL = ${cobytes-db.DATABASE_URL}
   NODE_ENV = production
   PORT = 3001
   PENTEST_TOOLS_API_KEY = 43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7
   PENTEST_TOOLS_API_URL = https://app.pentest-tools.com/api/v2
   CORS_ORIGIN = https://securityscan.cobytes.com,http://localhost:3000
   HOSTFACT_API_KEY = 6685741463b3d6791e31779df6a99a92
   HOSTFACT_URL = https://secure.cobytes.com/Pro/apiv2/api.php
   ```

5. **Click 'Save'**

6. **Click 'Deploy' to trigger a new deployment**

## What Will Happen:

- The app will pull the latest code from GitHub with e-commerce features
- Backend includes complete payment integration (MultiSafepay + HostFact)
- Frontend has shopping cart, checkout flow, and product catalog
- TypeORM will connect to your managed PostgreSQL database
- New tables for products, cart, orders will be auto-created
- The app will be available at https://securityscan.cobytes.com

## 🌐 Production URLs:

- **Frontend**: https://securityscan.cobytes.com
- **API Health**: https://api.securityscan.cobytes.com/health
- **Products API**: https://api.securityscan.cobytes.com/api/products

## 📊 Monitor Deployment:

1. **Check deployment status:**
   ```bash
   doctl apps list-deployments 93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c
   ```

2. **View logs:**
   ```bash
   doctl apps logs 93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c
   ```

3. **Or use DigitalOcean Dashboard:**
   Check the Activity tab to monitor deployment progress

## ✅ Post-Deployment Verification:

1. Visit https://securityscan.cobytes.com
2. Click "View Products" - should show 8 security products
3. Add items to cart
4. Proceed to checkout
5. Test the billing form
6. Verify payment integration redirects to MultiSafepay

## 🚨 Troubleshooting:

- **If frontend shows "Error loading products"**: Check API environment variables
- **If API returns 404**: Verify ingress rules and API routes prefix
- **If cart doesn't persist**: Check SESSION_SECRET is set
- **If payment fails**: Verify MultiSafepay credentials are correct