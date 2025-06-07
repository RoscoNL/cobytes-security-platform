# API Client Architecture Proposal
*Last updated: 2025-06-01 17:15 UTC*
*Status: Ready for implementation*

## Project Structure
```
src/
├── api/
│   ├── cobytes/
│   │   ├── client.ts         # Cobytes API client
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── auth.ts           # Authentication handling
│   │   ├── resources/
│   │   │   ├── users.ts
│   │   │   ├── scans.ts
│   │   │   ├── reports.ts
│   │   │   └── organizations.ts
│   │   └── index.ts
│   │
│   ├── pentesttools/
│   │   ├── client.ts         # PentestTools API client
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── tools.ts          # Tool ID mappings
│   │   ├── resources/
│   │   │   ├── targets.ts
│   │   │   ├── workspaces.ts
│   │   │   ├── scans.ts
│   │   │   ├── findings.ts
│   │   │   ├── reports.ts
│   │   │   └── loggers.ts
│   │   └── index.ts
│   │
│   └── index.ts              # Main API exports
│
├── integrations/
│   ├── scanner.ts            # Unified scanner interface
│   ├── reporter.ts           # Unified reporting
│   └── orchestrator.ts       # Scan orchestration
│
├── utils/
│   ├── retry.ts              # Retry logic
│   ├── polling.ts            # Status polling
│   └── errors.ts             # Error handling
│
└── examples/
    ├── basic-scan.ts
    ├── full-assessment.ts
    └── continuous-monitoring.ts
```

## TypeScript Interfaces

### Cobytes Types
```typescript
// src/api/cobytes/types.ts
export interface CobytesConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

export interface Scan {
  id: string;
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  findings: Finding[];
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  remediation: string;
  evidence: string[];
}

export interface Report {
  id: string;
  scanId: string;
  format: 'pdf' | 'html' | 'json';
  createdAt: Date;
  downloadUrl: string;
}
```

### PentestTools Types
```typescript
// src/api/pentesttools/types.ts
export interface PentestToolsConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface Target {
  id: number;
  name: string;
  description?: string;
  workspaceId?: number;
  createdAt: string;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  targetCount: number;
  scanCount: number;
}

export interface ScanRequest {
  toolId: number;
  targetId?: number;
  targetName?: string;
  toolParams: Record<string, any>;
  workspaceId?: number;
}

export interface ScanStatus {
  id: number;
  statusName: 'running' | 'finished' | 'stopped' | 'error';
  progress: number;
  createdAt: string;
  finishedAt?: string;
}

export interface ToolType {
  SUBDOMAIN_FINDER: 20;
  TCP_PORT_SCANNER: 70;
  UDP_PORT_SCANNER: 80;
  URL_FUZZER: 90;
  FIND_VHOSTS: 160;
  WEBSITE_SCANNER: 170;
  API_SCANNER: 510;
  // ... etc
}
```

## API Client Implementation

### Cobytes Client
```typescript
// src/api/cobytes/client.ts
import axios, { AxiosInstance } from 'axios';
import { CobytesConfig } from './types';

export class CobytesClient {
  private client: AxiosInstance;

  constructor(config: CobytesConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey })
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors
        return Promise.reject(error);
      }
    );
  }

  // Resource getters
  get users() { return new UsersResource(this.client); }
  get scans() { return new ScansResource(this.client); }
  get reports() { return new ReportsResource(this.client); }
  get organizations() { return new OrganizationsResource(this.client); }
}
```

### PentestTools Client
```typescript
// src/api/pentesttools/client.ts
import axios, { AxiosInstance } from 'axios';
import { PentestToolsConfig } from './types';

export class PentestToolsClient {
  private client: AxiosInstance;
  
  constructor(config: PentestToolsConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://app.pentest-tools.com/api/v2',
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Resource getters
  get targets() { return new TargetsResource(this.client); }
  get workspaces() { return new WorkspacesResource(this.client); }
  get scans() { return new ScansResource(this.client); }
  get findings() { return new FindingsResource(this.client); }
  get reports() { return new ReportsResource(this.client); }
}
```

## Unified Scanner Interface

```typescript
// src/integrations/scanner.ts
export interface ScannerConfig {
  cobytesClient?: CobytesClient;
  pentestToolsClient?: PentestToolsClient;
}

export interface UnifiedScanRequest {
  target: string;
  scanType: 'web' | 'api' | 'network' | 'full';
  options?: {
    depth?: 'light' | 'medium' | 'deep';
    authenticated?: boolean;
    credentials?: {
      username: string;
      password: string;
    };
  };
}

export class UnifiedScanner {
  constructor(private config: ScannerConfig) {}

  async startScan(request: UnifiedScanRequest): Promise<string> {
    // Determine which scanner to use based on scan type
    if (request.scanType === 'web') {
      return this.startWebScan(request);
    } else if (request.scanType === 'api') {
      return this.startApiScan(request);
    }
    // ... etc
  }

  private async startWebScan(request: UnifiedScanRequest): Promise<string> {
    if (this.config.pentestToolsClient) {
      const scan = await this.config.pentestToolsClient.scans.create({
        toolId: 170, // WEBSITE_SCANNER
        targetName: request.target,
        toolParams: {
          scan_type: request.options?.depth === 'light' ? 'light' : 'full_new',
          follow_redirects: true
        }
      });
      return `pentest-tools:${scan.id}`;
    }
    
    // Fallback to Cobytes
    if (this.config.cobytesClient) {
      const scan = await this.config.cobytesClient.scans.create({
        targetUrl: request.target,
        scanType: 'web'
      });
      return `cobytes:${scan.id}`;
    }
    
    throw new Error('No scanner available');
  }

  async getScanStatus(scanId: string): Promise<ScanStatus> {
    const [provider, id] = scanId.split(':');
    
    if (provider === 'pentest-tools') {
      const status = await this.config.pentestToolsClient.scans.getStatus(id);
      return {
        status: status.statusName,
        progress: status.progress,
        provider: 'pentest-tools'
      };
    }
    
    // Handle Cobytes...
  }
}
```

## Usage Examples

```typescript
// examples/basic-scan.ts
import { CobytesClient, PentestToolsClient, UnifiedScanner } from '../src/api';

async function runBasicScan() {
  // Initialize clients
  const cobytesClient = new CobytesClient({
    baseUrl: 'http://localhost:3001'
  });

  const pentestToolsClient = new PentestToolsClient({
    apiKey: process.env.PENTEST_TOOLS_API_KEY!
  });

  // Create unified scanner
  const scanner = new UnifiedScanner({
    cobytesClient,
    pentestToolsClient
  });

  // Start scan
  const scanId = await scanner.startScan({
    target: 'https://example.com',
    scanType: 'web',
    options: {
      depth: 'medium'
    }
  });

  // Monitor progress
  let status;
  do {
    status = await scanner.getScanStatus(scanId);
    console.log(`Scan progress: ${status.progress}%`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  } while (status.status === 'running');

  // Get results
  const results = await scanner.getResults(scanId);
  console.log('Scan completed:', results);
}

runBasicScan().catch(console.error);
```

## Next Steps

1. **Implement Core Clients**
   - [ ] Cobytes API client with all resources
   - [ ] PentestTools API client with all resources
   - [ ] Error handling and retry logic

2. **Build Integrations**
   - [ ] Unified scanner interface
   - [ ] Report generator
   - [ ] Continuous monitoring system

3. **Add Features**
   - [ ] Webhook support
   - [ ] Result caching
   - [ ] Parallel scan management
   - [ ] Export to various formats

4. **Testing**
   - [ ] Unit tests for each client
   - [ ] Integration tests
   - [ ] Mock servers for development

5. **Documentation**
   - [ ] API reference
   - [ ] Usage examples
   - [ ] Best practices guide

## Error Handling Strategy

```typescript
// src/utils/errors.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public provider: 'cobytes' | 'pentest-tools',
    public details?: any
  ) {
    super(message);
  }
}

export class RateLimitError extends APIError {
  constructor(
    public retryAfter: number,
    provider: 'cobytes' | 'pentest-tools'
  ) {
    super(429, 'Rate limit exceeded', provider);
  }
}

export class AuthenticationError extends APIError {
  constructor(provider: 'cobytes' | 'pentest-tools') {
    super(401, 'Authentication failed', provider);
  }
}
```

## Testing Strategy

```typescript
// tests/setup.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const mockServer = setupServer(
  // Cobytes mocks
  rest.get('http://localhost:3001/api/scans', (req, res, ctx) => {
    return res(ctx.json({ scans: [] }));
  }),
  
  // PentestTools mocks
  rest.get('https://app.pentest-tools.com/api/v2/targets', (req, res, ctx) => {
    return res(ctx.json({ data: [] }));
  })
);
```
