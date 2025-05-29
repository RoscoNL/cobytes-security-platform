// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API Client Class
class SecurityAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }

    // Start security scan
    async startScan(scanType, target, options = {}) {
        return await this.request('/scan', {
            method: 'POST',
            body: JSON.stringify({
                scanType,
                target,
                options
            })
        });
    }

    // Available scan types
    getScanTypes() {
        return [
            { id: 'port-scan', name: 'Port Scan', description: 'Scan open ports on target' },
            { id: 'vulnerability-scan', name: 'Vulnerability Scan', description: 'Check for security vulnerabilities' },
            { id: 'ssl-test', name: 'SSL/TLS Test', description: 'Test SSL certificate and configuration' },
            { id: 'dns-lookup', name: 'DNS Lookup', description: 'Analyze DNS configuration' }
        ];
    }
}

// Global API instance
const securityAPI = new SecurityAPI();

// DOM Ready functions
document.addEventListener('DOMContentLoaded', function() {
    // Test API connection on page load
    testAPIConnection();
    
    // Initialize page-specific functionality
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            initHomePage();
            break;
        case 'scan-selection.html':
            initScanSelectionPage();
            break;
        case 'dashboard.html':
            initDashboardPage();
            break;
    }
});

// Test API connection
async function testAPIConnection() {
    try {
        const health = await securityAPI.healthCheck();
        console.log('✅ API Connection successful:', health);
        showNotification('API verbinding succesvol', 'success');
    } catch (error) {
        console.error('❌ API Connection failed:', error);
        showNotification('API verbinding mislukt', 'error');
    }
}

// Initialize home page
function initHomePage() {
    console.log('🏠 Home page initialized');
}

// Initialize scan selection page
function initScanSelectionPage() {
    console.log('🔍 Scan selection page initialized');
    // Load available scan types
    loadScanTypes();
}

// Initialize dashboard page
function initDashboardPage() {
    console.log('📊 Dashboard page initialized');
}

// Load scan types
function loadScanTypes() {
    const scanTypes = securityAPI.getScanTypes();
    console.log('Available scan types:', scanTypes);
}

// Utility function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Export for use in other scripts
window.SecurityAPI = SecurityAPI;
window.securityAPI = securityAPI;
