# API Exploration Results
*Last updated: 2025-06-01 17:15 UTC*

## 1. Cobytes Security Platform API (localhost:3001)

### Base Info
- **Message**: Cobytes Security Platform API
- **Version**: 1.0.0
- **Base URL**: http://localhost:3001

### Available Endpoints
```json
{
  "health": "/health",
  "auth": "/api/auth",
  "users": "/api/users", 
  "scans": "/api/scans",
  "reports": "/api/reports",
  "organizations": "/api/organizations",
  "admin": "/api/admin"
}
```

### Notes
- Server draait in development mode (SKIP_DB=true, SKIP_REDIS=true)
- Geen `/api/docs` endpoint beschikbaar

## 2. PentestTools.com API

### Base Info
- **Base URL**: https://app.pentest-tools.com/api/v2
- **Documentation**: https://pentest-tools.com/docs/api/v2
- **OpenAPI Schema**: https://app.pentest-tools.com/api-schema.yml
- **Authentication**: API Key required (manage in My account → API section)

### Main Resources & Endpoints

#### 1. Targets
- `GET /targets` - Get all targets
- `POST /targets` - Create a target  
- `GET /targets/{id}` - Get target by ID
- `DELETE /targets/{id}` - Delete a target

#### 2. Workspaces
- `GET /workspaces` - Get all workspaces
- `POST /workspaces` - Create a workspace
- `GET /workspaces/{id}` - Get workspace by ID
- `PUT /workspaces/{id}` - Edit workspace
- `DELETE /workspaces/{id}` - Delete workspace

#### 3. Scans
- `GET /scans` - Get all scans
- `POST /scans` - Start a scan
- `GET /scans/{id}` - Get scan information by ID
- `DELETE /scans/{id}` - Delete a scan
- `GET /scans/{id}/output` - Get scan output by ID
- `GET /scans/{id}/raw` - Get scan raw output by ID
- `POST /scans/{id}/stop` - Stop an active scan

#### 4. HTTP Loggers
- `GET /http_loggers` - Get all HTTP loggers
- `POST /http_loggers` - Create a HTTP logger
- `GET /http_loggers/{id}` - Get logger information by ID
- `DELETE /http_loggers/{id}` - Delete a logger
- `GET /http_loggers/{id}/data` - Get the data for a logger
- `DELETE /http_loggers/{id}/data` - Clear the data for a logger

#### 5. Findings & Reports
- `GET /findings` - Get all findings
- `GET /findings/{id}` - Get finding information by ID
- `GET /reports` - Get all reports
- `POST /reports` - Create a report
- `GET /reports/{id}` - Get report information by ID
- `DELETE /reports/{id}` - Delete a report
- `GET /reports/{id}/download` - Download a report

#### 6. Other Resources
- `GET /public/finding_templates` - Get all finding templates
- `GET /wordlists` - Get all wordlists
- `GET /wordlists/{id}` - Get wordlist information by ID
- `DELETE /wordlists/{id}` - Delete a wordlist
- `GET /wordlists/{id}/contents` - Get wordlist contents by ID
- `GET /vpn_profiles` - Get all VPN profiles

### Key Features
- RESTful API design
- Support for managing targets, scans, workspaces
- Vulnerability scanning capabilities
- Report generation and download
- HTTP request logging for testing
- VPN profile support for internal network scanning
- Wordlist management for fuzzing

### Python Client
- Sample API client available in Python
- Link mentioned in docs but needs to be fetched separately

## Next Steps for API Client Development

### For Cobytes Security Platform
1. Implement authentication flow (`/api/auth`)
2. Create models for users, scans, reports, organizations
3. Build CRUD operations for each resource
4. Add admin functionality support

### For PentestTools Integration
1. Implement API key authentication
2. Create models for:
   - Targets
   - Workspaces  
   - Scans (with status tracking)
   - Findings
   - Reports
3. Build scan management:
   - Start/stop scans
   - Monitor scan progress
   - Retrieve results
4. Implement report generation and download
5. Add HTTP logger functionality for testing
