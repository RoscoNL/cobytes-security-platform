import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Tutorial {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToRead: string;
  content: {
    overview: string;
    steps: string[];
    tips: string[];
    warnings?: string[];
  };
}

const HowTo: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const tutorials: Tutorial[] = [
    {
      id: 'subdomain-discovery',
      title: 'Complete Guide to Subdomain Discovery',
      category: 'Information Gathering',
      difficulty: 'beginner',
      timeToRead: '10 min',
      content: {
        overview: 'Learn how to effectively discover subdomains to expand your attack surface analysis.',
        steps: [
          'Start with passive reconnaissance using the Subdomain Finder',
          'Use "deep" scan mode for comprehensive results',
          'Enable "web_details" to gather server information',
          'Cross-reference results with DNS records',
          'Check for subdomain takeover vulnerabilities'
        ],
        tips: [
          'Always start with passive scanning to avoid detection',
          'Use multiple data sources for better coverage',
          'Export results to CSV for further analysis',
          'Schedule regular scans to detect new subdomains',
          'Combine with port scanning for each discovered subdomain'
        ],
        warnings: [
          'Ensure you have permission to scan the target domain',
          'Some subdomains may be honeypots or monitoring systems'
        ]
      }
    },
    {
      id: 'web-vulnerability-scanning',
      title: 'Web Application Security Testing Best Practices',
      category: 'Web Security',
      difficulty: 'intermediate',
      timeToRead: '15 min',
      content: {
        overview: 'Master web application security testing with comprehensive vulnerability scanning techniques.',
        steps: [
          'Begin with Website Recon to understand the technology stack',
          'Run WAF Detector to identify security measures',
          'Configure Website Scanner with appropriate crawl depth',
          'Select relevant attack vectors (XSS, SQLi, LFI, etc.)',
          'Set up authentication if testing protected areas',
          'Review and validate findings manually',
          'Generate reports for remediation tracking'
        ],
        tips: [
          'Start with "light" scans on production systems',
          'Use custom User-Agent strings to avoid detection',
          'Exclude sensitive paths like /admin or /logout',
          'Monitor scan progress via WebSocket updates',
          'Schedule scans during off-peak hours',
          'Always verify critical findings manually'
        ],
        warnings: [
          'Heavy scanning can impact website performance',
          'Some payloads may trigger security alerts',
          'Always get written permission before testing'
        ]
      }
    },
    {
      id: 'cms-security',
      title: 'CMS Security Assessment Workflow',
      category: 'CMS Security',
      difficulty: 'intermediate',
      timeToRead: '12 min',
      content: {
        overview: 'Comprehensive guide to testing WordPress, Drupal, Joomla, and other CMS platforms.',
        steps: [
          'Identify CMS type using Website Recon',
          'Run appropriate CMS scanner (WordPress, Drupal, Joomla)',
          'Enumerate users, plugins, and themes',
          'Check for outdated components',
          'Test for common CMS vulnerabilities',
          'Verify file permissions and exposed files',
          'Document all findings with severity levels'
        ],
        tips: [
          'Focus on plugin/module vulnerabilities first',
          'Check for default admin credentials',
          'Look for backup files (.bak, .old, .backup)',
          'Test upload functionality carefully',
          'Monitor for security plugin bypasses',
          'Use the "enumerate" options for thorough testing'
        ],
        warnings: [
          'User enumeration may lock out accounts',
          'Some plugins may log scanning attempts'
        ]
      }
    },
    {
      id: 'network-penetration',
      title: 'Network Penetration Testing Methodology',
      category: 'Network Security',
      difficulty: 'advanced',
      timeToRead: '20 min',
      content: {
        overview: 'Professional network penetration testing workflow from reconnaissance to exploitation.',
        steps: [
          'Start with ICMP Ping to identify live hosts',
          'Perform comprehensive port scanning (TCP and UDP)',
          'Enable OS detection and service version scanning',
          'Run Network Scanner for vulnerability identification',
          'Analyze SSL/TLS configurations with SSL Scanner',
          'Map network topology and trust relationships',
          'Identify and prioritize attack vectors',
          'Document network architecture and findings'
        ],
        tips: [
          'Use different scan timing to avoid IDS detection',
          'Scan UDP ports separately (they\'re often forgotten)',
          'Pay attention to non-standard ports',
          'Cross-reference service versions with CVE databases',
          'Use TCP SYN scanning for stealth',
          'Always scan from multiple source IPs if possible'
        ],
        warnings: [
          'Aggressive scanning may trigger security alerts',
          'Some scans may cause service disruptions',
          'UDP scanning can be very slow'
        ]
      }
    },
    {
      id: 'api-security',
      title: 'API Security Testing Guide',
      category: 'API Security',
      difficulty: 'advanced',
      timeToRead: '18 min',
      content: {
        overview: 'Complete guide to testing REST APIs and GraphQL endpoints for security vulnerabilities.',
        steps: [
          'Obtain API documentation (OpenAPI/Swagger spec)',
          'Configure API Scanner with the spec URL',
          'Set up proper authentication headers',
          'Test all endpoints systematically',
          'Check for authorization bypasses',
          'Test rate limiting and DoS protection',
          'Validate input sanitization',
          'Check for information disclosure in errors'
        ],
        tips: [
          'Always test with different user roles',
          'Look for IDOR vulnerabilities in object references',
          'Test file upload endpoints thoroughly',
          'Check for XXE in XML parsers',
          'Monitor for rate limit bypasses',
          'Test webhook endpoints for SSRF',
          'Use fuzzing for parameter testing'
        ],
        warnings: [
          'API testing can generate significant traffic',
          'Some tests may modify data',
          'Rate limiting may block your IP'
        ]
      }
    },
    {
      id: 'cloud-security',
      title: 'Cloud Infrastructure Security Assessment',
      category: 'Cloud Security',
      difficulty: 'advanced',
      timeToRead: '25 min',
      content: {
        overview: 'Assess cloud infrastructure security across AWS, Azure, GCP, and Kubernetes environments.',
        steps: [
          'Enumerate cloud assets and services',
          'Run Cloud Scanner with appropriate credentials',
          'Check for misconfigured storage buckets',
          'Assess IAM policies and permissions',
          'Test network security groups and firewalls',
          'For Kubernetes, run Kubernetes Scanner',
          'Check for exposed secrets and credentials',
          'Review logging and monitoring configurations'
        ],
        tips: [
          'Start with read-only permissions',
          'Check for publicly exposed resources first',
          'Look for overly permissive policies',
          'Test cross-account access controls',
          'Verify encryption at rest and in transit',
          'Check for abandoned resources',
          'Monitor for configuration drift'
        ],
        warnings: [
          'Cloud scanning may incur costs',
          'Some tests require elevated permissions',
          'Be careful with production environments'
        ]
      }
    },
    {
      id: 'reporting-tips',
      title: 'Effective Security Reporting',
      category: 'Reporting',
      difficulty: 'beginner',
      timeToRead: '8 min',
      content: {
        overview: 'Create professional security reports that drive action and remediation.',
        steps: [
          'Export scan results in multiple formats (PDF, CSV, JSON)',
          'Organize findings by severity and impact',
          'Include clear reproduction steps',
          'Provide specific remediation guidance',
          'Add executive summary for management',
          'Include risk ratings and CVSS scores',
          'Document testing methodology',
          'Track remediation progress over time'
        ],
        tips: [
          'Use screenshots to illustrate vulnerabilities',
          'Prioritize findings by business impact',
          'Include positive findings too',
          'Make remediation steps actionable',
          'Use consistent severity ratings',
          'Follow up on critical issues immediately',
          'Maintain a findings database for trends'
        ]
      }
    },
    {
      id: 'automation-tips',
      title: 'Automating Security Scans',
      category: 'Automation',
      difficulty: 'intermediate',
      timeToRead: '15 min',
      content: {
        overview: 'Set up automated security scanning workflows for continuous security monitoring.',
        steps: [
          'Define scan schedules based on risk profiles',
          'Use the scheduling feature for recurring scans',
          'Set up WebSocket connections for real-time updates',
          'Configure alerts for critical findings',
          'Integrate with CI/CD pipelines via API',
          'Create scan templates for consistency',
          'Automate report generation and distribution',
          'Track metrics and trends over time'
        ],
        tips: [
          'Start with weekly scans and adjust frequency',
          'Use light scans for frequent testing',
          'Rotate scan times to avoid patterns',
          'Integrate with ticketing systems',
          'Set up diff reports to show changes',
          'Use tags to organize scan results',
          'Archive old results for compliance'
        ],
        warnings: [
          'Automated scans can generate many alerts',
          'Ensure scans don\'t overlap',
          'Monitor for false positives'
        ]
      }
    }
  ];

  const categories = ['all', ...Array.from(new Set(tutorials.map(t => t.category)))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredTutorials = tutorials.filter(tutorial => {
    const categoryMatch = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || tutorial.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security Testing How-To Guides</h1>
        <p className="mt-2 text-gray-600">
          Learn best practices and techniques for effective security testing
        </p>
      </div>

      {/* Quick Tips Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Tips for Successful Security Testing</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Always obtain written permission before testing any system</li>
          <li>• Start with passive reconnaissance to minimize detection</li>
          <li>• Use the least intrusive scan settings on production systems</li>
          <li>• Document everything - screenshots, commands, and timestamps</li>
          <li>• Verify automated findings manually before reporting</li>
          <li>• Keep your testing within the defined scope</li>
        </ul>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tutorials */}
      <div className="space-y-6">
        {filteredTutorials.map((tutorial) => (
          <div key={tutorial.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{tutorial.title}</h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                    {tutorial.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">{tutorial.timeToRead} read</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{tutorial.content.overview}</p>

              {/* Steps */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {tutorial.content.steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Pro Tips:</h4>
                <ul className="space-y-2">
                  {tutorial.content.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warnings */}
              {tutorial.content.warnings && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="font-medium text-red-800 mb-2">⚠️ Important Warnings:</h4>
                  <ul className="space-y-1">
                    {tutorial.content.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-red-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Testing?</h3>
        <p className="text-gray-600 mb-6">
          Put these techniques into practice with our comprehensive security scanning platform.
        </p>
        <Link
          to="/dashboard/scans/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Start Scanning Now
        </Link>
      </div>
    </div>
  );
};

export default HowTo;