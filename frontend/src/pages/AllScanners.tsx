import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Scanner {
  id: string;
  toolId: number;
  name: string;
  category: string;
  description: string;
  implemented: boolean;
  parameters?: Record<string, any>;
}

const AllScanners: React.FC = () => {
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllScanners();
  }, []);

  const loadAllScanners = async () => {
    try {
      // All PentestTools scanners based on the API documentation
      const allScanners: Scanner[] = [
        // Domain & Subdomain Scanners
        {
          id: 'subdomain',
          toolId: 20,
          name: 'Subdomain Finder',
          category: 'Domain & DNS',
          description: 'Discover subdomains for a given domain using multiple techniques',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom'],
            web_details: 'boolean',
            whois: 'boolean',
            unresolved_results: 'boolean'
          }
        },
        {
          id: 'dns_lookup',
          toolId: 50,
          name: 'DNS Lookup & DNS Records',
          category: 'Domain & DNS',
          description: 'Query DNS records (A, AAAA, MX, TXT, NS, SOA, etc.)',
          implemented: true
        },
        {
          id: 'dns_zone_transfer',
          toolId: 60,
          name: 'DNS Zone Transfer',
          category: 'Domain & DNS',
          description: 'Test for DNS zone transfer vulnerabilities',
          implemented: true
        },
        {
          id: 'whois_lookup',
          toolId: 40,
          name: 'WHOIS Lookup',
          category: 'Domain & DNS',
          description: 'Get domain registration and ownership information',
          implemented: true
        },
        {
          id: 'email_finder',
          toolId: 25,
          name: 'Email Finder',
          category: 'Domain & DNS',
          description: 'Find email addresses associated with a domain',
          implemented: true
        },

        // Port & Network Scanners
        {
          id: 'port_scan',
          toolId: 70,
          name: 'TCP Port Scanner',
          category: 'Network',
          description: 'Scan TCP ports to discover open services',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom'],
            ports: 'string',
            os_detection: 'boolean',
            service_detection: 'boolean',
            traceroute: 'boolean'
          }
        },
        {
          id: 'udp_port_scan',
          toolId: 80,
          name: 'UDP Port Scanner',
          category: 'Network',
          description: 'Scan UDP ports to discover open services',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom'],
            ports: 'string',
            service_detection: 'boolean'
          }
        },
        {
          id: 'network',
          toolId: 30,
          name: 'Network Vulnerability Scanner',
          category: 'Network',
          description: 'Comprehensive network vulnerability assessment',
          implemented: true,
          parameters: {
            preset: ['light', 'deep', 'custom'],
            scanning_engines: ['version_based', 'sniper', 'nuclei', 'openvas'],
            ports: 'string'
          }
        },
        {
          id: 'ping_host',
          toolId: 100,
          name: 'Ping Host',
          category: 'Network',
          description: 'Check if a host is reachable',
          implemented: true
        },
        {
          id: 'traceroute',
          toolId: 90,
          name: 'Traceroute',
          category: 'Network',
          description: 'Trace the route packets take to reach a host',
          implemented: true
        },

        // Web Application Scanners
        {
          id: 'website',
          toolId: 10,
          name: 'Website Vulnerability Scanner',
          category: 'Web Application',
          description: 'Comprehensive web application security scanner',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom'],
            attack_active: ['xss', 'sqli', 'lfi', 'oscmdi', 'ssrf', 'open_redirect', 'broken_authentication', 'xxe'],
            crawl_depth: 'number',
            user_agent: 'string',
            excluded_paths: 'array'
          }
        },
        {
          id: 'website_recon',
          toolId: 190,
          name: 'Website Recon',
          category: 'Web Application',
          description: 'Reconnaissance scan to discover website technologies and structure',
          implemented: true
        },
        {
          id: 'ssl',
          toolId: 110,
          name: 'SSL/TLS Scanner',
          category: 'Web Application',
          description: 'Test SSL/TLS configuration and vulnerabilities',
          implemented: true
        },
        {
          id: 'waf',
          toolId: 180,
          name: 'WAF Detector',
          category: 'Web Application',
          description: 'Detect Web Application Firewalls',
          implemented: true
        },
        {
          id: 'http_headers',
          toolId: 120,
          name: 'HTTP Headers Test',
          category: 'Web Application',
          description: 'Analyze HTTP security headers',
          implemented: true
        },
        {
          id: 'website_screenshot',
          toolId: 200,
          name: 'Website Screenshot',
          category: 'Web Application',
          description: 'Take screenshots of web pages',
          implemented: true
        },

        // CMS Scanners
        {
          id: 'wordpress',
          toolId: 130,
          name: 'WordPress Scanner',
          category: 'CMS',
          description: 'Scan WordPress sites for vulnerabilities',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom'],
            enumerate: ['users', 'plugins', 'themes', 'timthumbs', 'config_backups', 'db_exports', 'media']
          }
        },
        {
          id: 'drupal',
          toolId: 170,
          name: 'Drupal Scanner',
          category: 'CMS',
          description: 'Scan Drupal sites for vulnerabilities',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom']
          }
        },
        {
          id: 'joomla',
          toolId: 140,
          name: 'Joomla Scanner',
          category: 'CMS',
          description: 'Scan Joomla sites for vulnerabilities',
          implemented: true,
          parameters: {
            scan_type: ['light', 'deep', 'custom']
          }
        },
        {
          id: 'magento',
          toolId: 210,
          name: 'Magento Scanner',
          category: 'CMS',
          description: 'Scan Magento e-commerce sites for vulnerabilities',
          implemented: true
        },
        {
          id: 'sharepoint',
          toolId: 220,
          name: 'SharePoint Scanner',
          category: 'CMS',
          description: 'Scan Microsoft SharePoint sites for vulnerabilities',
          implemented: true
        },

        // API Scanners
        {
          id: 'api',
          toolId: 230,
          name: 'API Security Scanner',
          category: 'API',
          description: 'Test REST API endpoints for vulnerabilities',
          implemented: true,
          parameters: {
            openapi_url: 'string',
            scan_type: ['light', 'deep', 'custom']
          }
        },
        {
          id: 'graphql',
          toolId: 240,
          name: 'GraphQL Scanner',
          category: 'API',
          description: 'Test GraphQL endpoints for vulnerabilities',
          implemented: true
        },

        // Cloud & Infrastructure
        {
          id: 's3_bucket',
          toolId: 150,
          name: 'S3 Bucket Finder',
          category: 'Cloud',
          description: 'Find and test AWS S3 buckets',
          implemented: true
        },
        {
          id: 'subdomain_takeover',
          toolId: 160,
          name: 'Subdomain Takeover Test',
          category: 'Cloud',
          description: 'Check for subdomain takeover vulnerabilities',
          implemented: true
        },

        // Other Security Tools
        {
          id: 'google_hacking',
          toolId: 250,
          name: 'Google Hacking Database',
          category: 'OSINT',
          description: 'Search for sensitive information using Google dorks',
          implemented: true
        },
        {
          id: 'breach_check',
          toolId: 260,
          name: 'Data Breach Check',
          category: 'OSINT',
          description: 'Check if email addresses have been compromised',
          implemented: true
        },
        {
          id: 'url_fuzzer',
          toolId: 270,
          name: 'URL Fuzzer',
          category: 'Web Application',
          description: 'Discover hidden files and directories',
          implemented: true
        },
        {
          id: 'xss_scanner',
          toolId: 280,
          name: 'XSS Scanner',
          category: 'Web Application',
          description: 'Dedicated Cross-Site Scripting vulnerability scanner',
          implemented: true
        },
        {
          id: 'sqli_scanner',
          toolId: 290,
          name: 'SQL Injection Scanner',
          category: 'Web Application',
          description: 'Dedicated SQL Injection vulnerability scanner',
          implemented: true
        },
        {
          id: 'cors_scanner',
          toolId: 300,
          name: 'CORS Misconfiguration Scanner',
          category: 'Web Application',
          description: 'Test for CORS misconfigurations',
          implemented: true
        }
      ];

      setScanners(allScanners);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load scanners:', error);
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(scanners.map(s => s.category))).sort();
  
  const filteredScanners = scanners.filter(scanner => {
    const matchesFilter = filter === 'all' || 
      (filter === 'implemented' && scanner.implemented) ||
      (filter === 'not-implemented' && !scanner.implemented) ||
      scanner.category === filter;
    
    const matchesSearch = searchTerm === '' || 
      scanner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scanner.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const groupedScanners = filteredScanners.reduce((acc, scanner) => {
    if (!acc[scanner.category]) {
      acc[scanner.category] = [];
    }
    acc[scanner.category].push(scanner);
    return acc;
  }, {} as Record<string, Scanner[]>);

  const stats = {
    total: scanners.length,
    implemented: scanners.filter(s => s.implemented).length,
    notImplemented: scanners.filter(s => !s.implemented).length,
    categories: categories.length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All PentestTools Scanners</h1>
        <p className="mt-2 text-gray-600">
          Complete list of all available security scanners from PentestTools API
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Scanners</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
          <div className="text-sm text-gray-500">Implemented</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">{stats.notImplemented}</div>
          <div className="text-sm text-gray-500">Not Implemented</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.categories}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Scanners</option>
              <option value="implemented">Implemented Only</option>
              <option value="not-implemented">Not Implemented</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search scanners..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Scanners List */}
      {Object.entries(groupedScanners).map(([category, scanners]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
          <div className="grid gap-4">
            {scanners.map(scanner => (
              <div
                key={scanner.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  scanner.implemented ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{scanner.name}</h3>
                      <span className="text-sm text-gray-500">(Tool ID: {scanner.toolId})</span>
                      {scanner.implemented ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Implemented
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not Implemented
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{scanner.description}</p>
                    
                    {scanner.parameters && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Parameters:</h4>
                        <div className="mt-2 space-y-1">
                          {Object.entries(scanner.parameters).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-mono text-gray-600">{key}</span>
                              <span className="text-gray-500">: </span>
                              <span className="text-gray-700">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {scanner.implemented && (
                    <Link
                      to="/dashboard/scans/new"
                      className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Use Scanner
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Implementation Guide */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Implementation Notes</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Green border indicates the scanner is implemented and ready to use</li>
          <li>Tool IDs are used internally by the PentestTools API</li>
          <li>Each scanner has specific parameters that can be configured</li>
          <li>Some scanners require additional authentication or API configuration</li>
        </ul>
      </div>
    </div>
  );
};

export default AllScanners;