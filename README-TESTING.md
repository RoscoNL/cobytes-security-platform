# Cobytes Security Platform - Docker Test Suite

## Overview

This comprehensive Docker test suite tests all aspects of the Cobytes Security Platform including:
- Backend API endpoints
- Frontend pages and functionality  
- Integration between services
- End-to-end user workflows
- Performance and load testing

## Quick Start

```bash
# Run all tests
./run-docker-tests.sh

# Run specific test suites
./run-docker-tests.sh backend      # Backend unit tests only
./run-docker-tests.sh frontend     # Frontend tests only
./run-docker-tests.sh integration  # Integration tests only
./run-docker-tests.sh e2e          # End-to-end tests only

# Monitor containers in real-time
./docker-monitor.sh

# Fix common issues
./docker-monitor.sh fix
```

## Test Structure

```
test-suites/
├── backend/         # Backend API tests
│   ├── health.test.ts
│   ├── auth.test.ts
│   └── scans.test.ts
├── frontend/        # Frontend UI tests
│   ├── pages.test.ts
│   └── auth-flow.test.ts
├── integration/     # Integration tests
│   └── scan-workflow.test.ts
├── e2e/            # End-to-end tests
│   └── full-platform.test.ts
└── utils/          # Test utilities
    ├── setup.ts
    └── test-helpers.ts
```

## Docker Services

The test environment includes:
- `postgres-test`: PostgreSQL database (port 5434)
- `redis-test`: Redis cache (port 6380)
- `backend-test`: Backend API (port 3001)
- `frontend-test`: Frontend app (port 3002)
- `test-runner`: Jest test runner with Puppeteer

## Test Reports

After running tests, reports are available in:
- `test-reports/`: HTML test reports and coverage
- `test-screenshots/`: Screenshots from UI tests
- `test-logs/`: Container logs

## Monitoring & Debugging

### Real-time Monitoring
```bash
# Monitor all containers
./docker-monitor.sh

# Follow specific container logs
./docker-monitor.sh logs backend-test
./docker-monitor.sh logs frontend-test
```

### Common Issues & Fixes

1. **Frontend build errors**
   ```bash
   # Rebuild frontend with fresh dependencies
   docker-compose -f docker-compose.test.yml build --no-cache frontend-test
   ```

2. **Database connection issues**
   ```bash
   # Reset database
   docker volume rm cobytes-security-platform_postgres_data
   docker-compose -f docker-compose.test.yml up -d postgres-test
   ```

3. **Port conflicts**
   ```bash
   # Check for conflicting services
   lsof -i :3001  # Backend port
   lsof -i :3002  # Frontend port
   lsof -i :5434  # Test database port
   ```

## Writing New Tests

### Backend Test Example
```typescript
import { ApiClient } from '../utils/test-helpers';

describe('New Feature Tests', () => {
  let api: ApiClient;
  
  beforeAll(() => {
    api = new ApiClient();
  });
  
  test('Should do something', async () => {
    const response = await api.get('/api/new-endpoint');
    expect(response.status).toBe(200);
  });
});
```

### Frontend Test Example
```typescript
import { BrowserHelper } from '../utils/test-helpers';

describe('New Page Tests', () => {
  let browser: BrowserHelper;
  
  beforeEach(async () => {
    browser = new BrowserHelper();
    await browser.init();
  });
  
  afterEach(async () => {
    await browser.close();
  });
  
  test('Should render new page', async () => {
    await browser.goto('http://frontend-test:3002/new-page');
    await browser.waitForSelector('[data-testid="new-element"]');
    await browser.screenshot('new-page');
  });
});
```

## CI/CD Integration

The test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Docker Tests
  run: |
    ./run-docker-tests.sh
  env:
    CI: true
```

## Performance Benchmarks

Expected test execution times:
- Backend unit tests: ~30 seconds
- Frontend tests: ~1 minute
- Integration tests: ~2 minutes
- E2E tests: ~3 minutes
- **Total**: ~6-7 minutes

## Troubleshooting

### Tests are failing
1. Check container health: `./docker-monitor.sh`
2. Review logs: `docker-compose -f docker-compose.test.yml logs`
3. Rebuild images: `./docker-monitor.sh rebuild`

### Slow test execution
1. Increase Docker resources (CPU/Memory)
2. Run specific test suites instead of all
3. Check for resource-intensive operations in tests

### Screenshots not generated
1. Ensure Chromium is installed in test runner
2. Check test-screenshots directory permissions
3. Verify Puppeteer configuration

## Contributing

When adding new features:
1. Write unit tests in appropriate test suite
2. Add integration tests for cross-service functionality
3. Update E2E tests for user-facing changes
4. Ensure all tests pass before submitting PR