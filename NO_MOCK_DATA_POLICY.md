# NO MOCK DATA POLICY

## CRITICAL REQUIREMENT

This system must NEVER use mock data under any circumstances. 

### Policy Rules:

1. **No Mock Data**: Never return fake, simulated, or demo data
2. **Real APIs Only**: All integrations must use real APIs (Pentest-tools, payment providers, etc.)
3. **Error Over Mock**: If real data is unavailable, return an error - never fake data
4. **No Demo Content**: Remove all hardcoded demo/sample content from the codebase
5. **Production Ready**: The system should fail gracefully when real services are unavailable

### Implementation Status:

- ✅ Removed mock-scanner.service.ts
- ✅ Removed mock scan generation from scan.service.ts
- ✅ Removed mock report generation from report.routes.ts
- ✅ Removed mock user database from auth.routes.ts
- ✅ Updated frontend pages to remove demo content
- ✅ All scanners now use real Pentest-tools API

### What This Means:

- Authentication will fail until a real user database is integrated
- Reports will show errors until real scan data integration is complete
- All scans run through actual Pentest-tools API
- No demo or sample data is shown anywhere in the system

### For Developers:

When implementing new features:
1. Never add mock data "just for testing"
2. Always integrate with real services
3. Return proper error messages when services are unavailable
4. Document what real integrations are needed

This policy ensures the system always reflects real data and real integration status.