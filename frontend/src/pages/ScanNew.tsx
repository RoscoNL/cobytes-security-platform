import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import scanService, { ScanType } from '../services/scan.service';
import { ProxyPentestToolId } from '../services/pentesttools-proxy.service';

const ScanNew: React.FC = () => {
  const navigate = useNavigate();
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);
  const [selectedScanType, setSelectedScanType] = useState<string>('');
  const [target, setTarget] = useState('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedOptions, setAdvancedOptions] = useState(false);

  useEffect(() => {
    loadScanTypes();
  }, []);

  const loadScanTypes = async () => {
    try {
      // Get regular scan types from backend
      const backendTypes = await scanService.getScanTypes();
      
      // Add PentestTools scanner types
      const pentestToolsTypes: ScanType[] = [
        {
          id: 'pentest_wordpress',
          name: 'WordPress Scanner (PentestTools)',
          description: 'Comprehensive WordPress vulnerability scanner',
          parameters: {}
        },
        {
          id: 'pentest_subdomain',
          name: 'Subdomain Finder (PentestTools)',
          description: 'Discover subdomains for a target domain',
          parameters: {}
        },
        {
          id: 'pentest_website',
          name: 'Website Scanner (PentestTools)',
          description: 'Scan websites for vulnerabilities',
          parameters: {}
        },
        {
          id: 'pentest_ssl',
          name: 'SSL/TLS Scanner (PentestTools)',
          description: 'Analyze SSL/TLS configuration',
          parameters: {}
        },
        {
          id: 'pentest_tcp_port',
          name: 'TCP Port Scanner (PentestTools)',
          description: 'Scan TCP ports on target systems',
          parameters: {}
        },
        {
          id: 'pentest_waf',
          name: 'WAF Detector (PentestTools)',
          description: 'Detect Web Application Firewalls',
          parameters: {}
        },
        {
          id: 'pentest_api',
          name: 'API Scanner (PentestTools)',
          description: 'Test API endpoints for security issues',
          parameters: {}
        },
        {
          id: 'pentest_drupal',
          name: 'Drupal Scanner (PentestTools)',
          description: 'Scan Drupal sites for vulnerabilities',
          parameters: {}
        },
        {
          id: 'pentest_joomla',
          name: 'Joomla Scanner (PentestTools)',
          description: 'Scan Joomla sites for vulnerabilities',
          parameters: {}
        },
        {
          id: 'pentest_url_fuzzer',
          name: 'URL Fuzzer (PentestTools)',
          description: 'Discover hidden files and directories',
          parameters: {}
        },
        {
          id: 'pentest_recon',
          name: 'Website Recon (PentestTools)',
          description: 'Comprehensive website reconnaissance',
          parameters: {}
        },
        {
          id: 'pentest_network',
          name: 'Network Scanner (PentestTools)',
          description: 'Comprehensive network vulnerability scanning',
          parameters: {}
        }
      ];
      
      // Combine all scan types
      const allTypes = [...backendTypes, ...pentestToolsTypes];
      setScanTypes(allTypes);
      
      if (allTypes.length > 0) {
        setSelectedScanType(allTypes[0].id);
        // Initialize parameters with defaults
        const defaultParams: Record<string, any> = {};
        Object.entries(allTypes[0].parameters).forEach(([key, param]: [string, any]) => {
          if (param.default !== undefined) {
            defaultParams[key] = param.default;
          }
        });
        setParameters(defaultParams);
      }
    } catch (err) {
      console.error('Failed to load scan types:', err);
      setError('Failed to load scan types. Please try again.');
    }
  };

  const handleScanTypeChange = (typeId: string) => {
    setSelectedScanType(typeId);
    const scanType = scanTypes.find(t => t.id === typeId);
    if (scanType) {
      // Reset parameters with defaults for new scan type
      const defaultParams: Record<string, any> = {};
      Object.entries(scanType.parameters).forEach(([key, param]: [string, any]) => {
        if (param.default !== undefined) {
          defaultParams[key] = param.default;
        }
      });
      setParameters(defaultParams);
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters({ ...parameters, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let scan;
      
      // Check if it's a PentestTools scanner
      if (selectedScanType.startsWith('pentest_')) {
        // Extract tool ID from scan type
        const toolIdMap: Record<string, number> = {
          pentest_subdomain: ProxyPentestToolId.SUBDOMAIN_FINDER,
          pentest_tcp_port: ProxyPentestToolId.TCP_PORT_SCANNER,
          pentest_udp_port: ProxyPentestToolId.UDP_PORT_SCANNER,
          pentest_website: ProxyPentestToolId.WEBSITE_SCANNER,
          pentest_wordpress: ProxyPentestToolId.WORDPRESS_SCANNER,
          pentest_drupal: ProxyPentestToolId.DRUPAL_SCANNER,
          pentest_joomla: ProxyPentestToolId.JOOMLA_SCANNER,
          pentest_sharepoint: ProxyPentestToolId.SHARE_POINT_SCANNER,
          pentest_ssl: ProxyPentestToolId.SSL_SCANNER,
          pentest_waf: ProxyPentestToolId.WAF_DETECTOR,
          pentest_api: ProxyPentestToolId.API_SCANNER,
          pentest_url_fuzzer: ProxyPentestToolId.URL_FUZZER,
          pentest_vhost: ProxyPentestToolId.FIND_VHOSTS,
          pentest_recon: ProxyPentestToolId.WEBSITE_RECON,
          pentest_network: ProxyPentestToolId.NETWORK_SCANNER,
          pentest_domain: ProxyPentestToolId.DOMAIN_FINDER,
          pentest_password: ProxyPentestToolId.PASSWORD_AUDITOR,
          pentest_sniper: ProxyPentestToolId.SNIPER,
          pentest_cloud: ProxyPentestToolId.CLOUD_SCANNER,
          pentest_kubernetes: ProxyPentestToolId.KUBERNETES_SCANNER
        };
        
        const toolId = toolIdMap[selectedScanType];
        if (toolId) {
          scan = await scanService.createPentestToolsScan(toolId, target, parameters);
        } else {
          throw new Error('Unknown PentestTools scanner type');
        }
      } else {
        // Use regular scan service
        scan = await scanService.createScan({
          target,
          type: selectedScanType,
          parameters
        });
      }
      
      navigate(`/dashboard/scans/${scan.id}`);
    } catch (err: any) {
      console.error('Failed to create scan:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create scan. Please try again.');
      setLoading(false);
    }
  };

  const currentScanType = scanTypes.find(t => t.id === selectedScanType);

  const getScanTypeIcon = (typeId: string) => {
    const icons: Record<string, string> = {
      subdomain: '🔍',
      port_scan: '🔌',
      website: '🌐',
      network: '🔒',
      api: '🔗',
      ssl: '🔐',
      waf: '🛡️',
      wordpress: '📝',
      drupal: '💧',
      joomla: '🅹',
      // PentestTools scanners
      pentest_subdomain: '🔍',
      pentest_tcp_port: '🔌',
      pentest_udp_port: '🔌',
      pentest_website: '🌐',
      pentest_wordpress: '📝',
      pentest_drupal: '💧',
      pentest_joomla: '🅹',
      pentest_sharepoint: '📊',
      pentest_ssl: '🔐',
      pentest_waf: '🛡️',
      pentest_api: '🔗',
      pentest_url_fuzzer: '🔎',
      pentest_vhost: '🖥️',
      pentest_recon: '🕵️',
      pentest_network: '🔒',
      pentest_domain: '🌍',
      pentest_password: '🔑',
      pentest_sniper: '🎯',
      pentest_cloud: '☁️',
      pentest_kubernetes: '⚙️'
    };
    return icons[typeId] || '📡';
  };

  const renderParameterInput = (key: string, param: any) => {
    const value = parameters[key];

    switch (param.type) {
      case 'select':
        return (
          <select
            id={key}
            value={value || ''}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            required={param.required}
          >
            {param.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="mt-2 space-y-2">
            {param.options.map((option: string) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value?.includes(option) || false}
                  onChange={(e) => {
                    const currentValue = value || [];
                    if (e.target.checked) {
                      handleParameterChange(key, [...currentValue, option]);
                    } else {
                      handleParameterChange(key, currentValue.filter((v: string) => v !== option));
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleParameterChange(key, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">{param.description || key}</span>
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={key}
            value={value || ''}
            onChange={(e) => handleParameterChange(key, parseInt(e.target.value))}
            min={param.min}
            max={param.max}
            className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
            required={param.required}
          />
        );

      default:
        return (
          <input
            type="text"
            id={key}
            value={value || ''}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
            placeholder={param.description}
            required={param.required}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">New Security Scan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure and start a new security scan for your assets
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Scan Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700">Scan Type</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {scanTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleScanTypeChange(type.id)}
                  className={`relative rounded-lg border p-4 cursor-pointer transition ${
                    selectedScanType === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{getScanTypeIcon(type.id)}</div>
                    <h3 className="text-sm font-medium text-gray-900">{type.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</p>
                  </div>
                  {selectedScanType === type.id && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Target Input */}
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700">
              Target
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="target"
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder={
                  selectedScanType === 'website' ? 'https://example.com' :
                  selectedScanType === 'subdomain' ? 'example.com' :
                  selectedScanType === 'port_scan' ? '192.168.1.1 or example.com' :
                  selectedScanType === 'api' ? 'https://api.example.com' :
                  'Enter target'
                }
                required
              />
            </div>
          </div>

          {/* Basic Parameters */}
          {currentScanType && (
            <div>
              <label className="text-sm font-medium text-gray-700">Configuration</label>
              <div className="mt-4 space-y-4">
                {Object.entries(currentScanType.parameters)
                  .filter(([key, param]: [string, any]) => 
                    key === 'scan_type' || key === 'preset' || param.required
                  )
                  .map(([key, param]: [string, any]) => (
                    <div key={key}>
                      <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      {renderParameterInput(key, param)}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          {currentScanType && Object.keys(currentScanType.parameters).length > 3 && (
            <div>
              <button
                type="button"
                onClick={() => setAdvancedOptions(!advancedOptions)}
                className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <svg
                  className={`mr-2 h-5 w-5 transition-transform ${advancedOptions ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced Options
              </button>

              {advancedOptions && (
                <div className="mt-4 space-y-4 pl-7">
                  {Object.entries(currentScanType.parameters)
                    .filter(([key, param]: [string, any]) => 
                      key !== 'scan_type' && key !== 'preset' && !param.required
                    )
                    .map(([key, param]: [string, any]) => (
                      <div key={key}>
                        {param.type !== 'boolean' && (
                          <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                        )}
                        {renderParameterInput(key, param)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/scans')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !target || !selectedScanType}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting Scan...' : 'Start Scan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScanNew;