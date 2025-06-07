# Cobytes Platform API Documentation

## Overview

The Cobytes Security Platform API is a RESTful API that provides comprehensive security scanning and reporting capabilities. The API is designed to be easy to use, secure, and scalable.

**Base URL**: `http://localhost:3001`  
**API Version**: 1.0.0  
**Authentication**: JWT Bearer tokens

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status](#health--status)
3. [Scans](#scans)
4. [Reports](#reports)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [WebSocket Events](#websocket-events)

---

## Authentication

All API endpoints (except `/health` and `/api`) require authentication using JWT tokens.

### Login

**POST** `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@cobytes.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_1",
      "email": "admin@cobytes.com",
      "role": "admin",
      "name": "Admin User",
      "createdAt": "2025-06-01T17:38:50.697Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

### Register

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "organization": "Example Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_1234567890",
      "email": "user@example.com",
      "role": "user",
      "name": "John Doe",
      "organization": "Example Corp",
      "createdAt": "2025-06-01T17:40:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

### Verify Token

**GET** `/api/auth/verify`

Verify the validity of a JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_1",
      "email": "admin@cobytes.com",
      "role": "admin",
      "name": "Admin User"
    },
    "token": {
      "valid": true,
      "expiresAt": "2025-06-02T17:39:48.000Z"
    }
  }
}
```

### Refresh Token

**POST** `/api/auth/refresh`

Refresh an existing JWT token before it expires.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

### Logout

**POST** `/api/auth/logout`

Logout the current user (token should be blacklisted in production).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Health & Status

### Health Check

**GET** `/health`

Check if the API is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-01T17:39:48.819Z",
  "uptime": 59.07146575,
  "environment": "development",
  "version": "0.1.0"
}
```

### API Information

**GET** `/api`

Get general information about the API and available endpoints.

**Response:**
```json
{
  "message": "Cobytes Security Platform API",
  "version": "1.0.0",
  "documentation": "/api/docs",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "users": "/api/users",
    "scans": "/api/scans",
    "reports": "/api/reports",
    "organizations": "/api/organizations",
    "admin": "/api/admin"
  }
}
```

---

## Scans

### Get Available Scan Types

**GET** `/api/scans/types/available`

Get a list of all available scan types and their configurations.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "web_vulnerability",
      "name": "Web Vulnerability Scan",
      "description": "Comprehensive web application security scan",
      "tools": ["OWASP ZAP", "Burp Suite", "Nikto"]
    },
    {
      "id": "network_scan",
      "name": "Network Security Scan",
      "description": "Network infrastructure and service scanning",
      "tools": ["Nmap", "Masscan", "Zmap"]
    },
    {
      "id": "ssl_tls",
      "name": "SSL/TLS Analysis",
      "description": "SSL/TLS configuration and certificate analysis",
      "tools": ["SSLyze", "testssl.sh"]
    }
  ]
}
```

### Create New Scan

**POST** `/api/scans`

Create and start a new security scan.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "scanType": "web_vulnerability",
  "targets": ["https://example.com", "https://test.example.com"],
  "configuration": {
    "depth": 3,
    "threads": 10,
    "followRedirects": true,
    "userAgent": "Cobytes Security Scanner"
  },
  "scheduledAt": "2025-06-01T20:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1748799588916_dw04msszk",
    "status": "pending",
    "createdAt": "2025-06-01T17:39:48.916Z",
    "updatedAt": "2025-06-01T17:39:48.916Z"
  }
}
```

### Get All Scans

**GET** `/api/scans`

Get a list of all scans for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, running, completed, failed)
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "scanId": "scan_1748799588916_dw04msszk",
      "status": "completed",
      "createdAt": "2025-06-01T17:39:48.916Z",
      "updatedAt": "2025-06-01T17:39:54.000Z"
    }
  ],
  "count": 1
}
```

### Get Scan Details

**GET** `/api/scans/:scanId`

Get detailed information about a specific scan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1748799588916_dw04msszk",
    "status": "completed",
    "createdAt": "2025-06-01T17:39:48.916Z",
    "updatedAt": "2025-06-01T17:39:54.000Z",
    "results": {
      "vulnerabilities": [
        {
          "severity": "high",
          "title": "SQL Injection vulnerability",
          "description": "Potential SQL injection in login form",
          "recommendation": "Use parameterized queries"
        },
        {
          "severity": "medium",
          "title": "Missing security headers",
          "description": "X-Frame-Options header not set",
          "recommendation": "Add security headers to prevent clickjacking"
        }
      ],
      "summary": {
        "total": 2,
        "high": 1,
        "medium": 1,
        "low": 0
      }
    }
  }
}
```

### Update Scan Status

**PATCH** `/api/scans/:scanId/status`

Update the status of a scan (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "failed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1748799588916_dw04msszk",
    "status": "failed",
    "updatedAt": "2025-06-01T17:45:00.000Z"
  }
}
```

### Delete Scan

**DELETE** `/api/scans/:scanId`

Delete a scan and all associated data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scan deleted successfully"
}
```

---

## Reports

### Get Available Templates

**GET** `/api/reports/templates/available`

Get a list of available report templates.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "executive_summary",
      "name": "Executive Summary",
      "description": "High-level overview for executives",
      "formats": ["pdf", "html"]
    },
    {
      "id": "technical_detailed",
      "name": "Technical Detailed Report",
      "description": "Comprehensive technical analysis with remediation steps",
      "formats": ["pdf", "html", "json"]
    }
  ]
}
```

### Generate Report

**POST** `/api/reports/generate`

Generate a new report from one or more scans.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "scanIds": ["scan_1748799588916_dw04msszk"],
  "format": "pdf",
  "includeDetails": true,
  "template": "executive_summary"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report_1748799588923_9rehl4b0k",
    "name": "Security Report 2025-06-01",
    "scanIds": ["scan_1748799588916_dw04msszk"],
    "format": "pdf",
    "status": "generating",
    "createdAt": "2025-06-01T17:39:48.923Z",
    "updatedAt": "2025-06-01T17:39:48.923Z",
    "size": 0,
    "downloadUrl": null
  },
  "message": "Report generation started"
}
```

### Get All Reports

**GET** `/api/reports`

Get a list of all generated reports.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "reportId": "report_1748799588923_9rehl4b0k",
      "name": "Security Report 2025-06-01",
      "format": "pdf",
      "createdAt": "2025-06-01T17:39:48.923Z",
      "status": "completed",
      "size": 245760
    }
  ],
  "count": 1
}
```

### Get Report Details

**GET** `/api/reports/:reportId`

Get detailed information about a specific report.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report_1748799588923_9rehl4b0k",
    "name": "Security Report 2025-06-01",
    "scanIds": ["scan_1748799588916_dw04msszk"],
    "format": "pdf",
    "status": "completed",
    "createdAt": "2025-06-01T17:39:48.923Z",
    "updatedAt": "2025-06-01T17:39:51.923Z",
    "size": 245760,
    "downloadUrl": "/api/reports/report_1748799588923_9rehl4b0k/download"
  }
}
```

### Download Report

**GET** `/api/reports/:reportId/download`

Download a generated report.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
For demo purposes, returns JSON. In production, would return the actual PDF/HTML/CSV file.

```json
{
  "success": true,
  "data": {
    "reportId": "report_1748799588923_9rehl4b0k",
    "name": "Security Report 2025-06-01",
    "format": "pdf",
    "content": {
      "summary": {
        "totalVulnerabilities": 15,
        "criticalCount": 2,
        "highCount": 5,
        "mediumCount": 6,
        "lowCount": 2,
        "scanDate": "2025-06-01T17:39:48.923Z",
        "targetCount": 1
      },
      "vulnerabilities": [...],
      "recommendations": [...]
    },
    "generatedAt": "2025-06-01T17:39:51.923Z"
  }
}
```

### Get Report Statistics

**GET** `/api/reports/stats/overview`

Get statistics about all reports.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 1,
    "reportsByFormat": {
      "pdf": 1,
      "html": 0,
      "json": 0,
      "csv": 0
    },
    "reportsByStatus": {
      "generating": 0,
      "completed": 1,
      "failed": 0
    },
    "averageGenerationTime": 3.2,
    "totalStorageUsed": 245760
  }
}
```

### Delete Report

**DELETE** `/api/reports/:reportId`

Delete a report.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

### Example Error Response

```json
{
  "success": false,
  "error": "Email and password are required",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Email is required",
    "password": "Password is required"
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Anonymous requests**: 10 requests per minute
- **Authenticated requests**: 100 requests per minute
- **Scan creation**: 10 scans per hour
- **Report generation**: 20 reports per hour

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1748799648
```

---

## WebSocket Events

The API supports real-time updates via WebSocket connections (coming soon).

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
});
```

### Events

**Scan Status Updates**
```json
{
  "type": "scan.status",
  "data": {
    "scanId": "scan_1748799588916_dw04msszk",
    "status": "running",
    "progress": 45
  }
}
```

**Vulnerability Found**
```json
{
  "type": "scan.vulnerability",
  "data": {
    "scanId": "scan_1748799588916_dw04msszk",
    "vulnerability": {
      "severity": "high",
      "title": "SQL Injection detected"
    }
  }
}
```

**Report Ready**
```json
{
  "type": "report.ready",
  "data": {
    "reportId": "report_1748799588923_9rehl4b0k",
    "downloadUrl": "/api/reports/report_1748799588923_9rehl4b0k/download"
  }
}
```

---

## Integration Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cobytes.com","password":"admin123"}'
```

**Create Scan:**
```bash
curl -X POST http://localhost:3001/api/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scanType": "web_vulnerability",
    "targets": ["https://example.com"]
  }'
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class CobytesClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(email, password) {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      email,
      password
    });
    this.token = response.data.data.token;
    return response.data;
  }

  async createScan(scanType, targets) {
    const response = await axios.post(
      `${this.baseURL}/api/scans`,
      { scanType, targets },
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    return response.data;
  }
}

// Usage
const client = new CobytesClient();
await client.login('admin@cobytes.com', 'admin123');
const scan = await client.createScan('web_vulnerability', ['https://example.com']);
console.log('Scan created:', scan.data.scanId);
```

### Python Example

```python
import requests
import json

class CobytesClient:
    def __init__(self, base_url='http://localhost:3001'):
        self.base_url = base_url
        self.token = None
    
    def login(self, email, password):
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'email': email, 'password': password}
        )
        data = response.json()
        self.token = data['data']['token']
        return data
    
    def create_scan(self, scan_type, targets):
        response = requests.post(
            f'{self.base_url}/api/scans',
            json={'scanType': scan_type, 'targets': targets},
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return response.json()

# Usage
client = CobytesClient()
client.login('admin@cobytes.com', 'admin123')
scan = client.create_scan('web_vulnerability', ['https://example.com'])
print(f"Scan created: {scan['data']['scanId']}")
```

---

## Best Practices

1. **Always use HTTPS in production** - The API supports SSL/TLS encryption
2. **Store tokens securely** - Never expose JWT tokens in client-side code
3. **Implement token refresh** - Refresh tokens before they expire
4. **Handle rate limits** - Implement exponential backoff for rate limited requests
5. **Validate input** - Always validate and sanitize input data
6. **Use appropriate scan types** - Choose the right scan type for your needs
7. **Monitor scan progress** - Use webhooks or polling to track scan status
8. **Archive old reports** - Regularly clean up old reports to save storage

---

## Support

For API support, please contact:
- Email: api-support@cobytes.com
- Documentation: https://docs.cobytes.com
- Status Page: https://status.cobytes.com

## Changelog

### Version 1.0.0 (2025-06-01)
- Initial release
- Authentication system with JWT
- Scan management (create, read, update, delete)
- Report generation and management
- Rate limiting
- CORS support

### Roadmap
- WebSocket support for real-time updates
- Advanced scan scheduling
- Team collaboration features
- API versioning
- GraphQL endpoint
- Webhook notifications
- Batch operations
- Advanced filtering and search