import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import scanService, { ScanType } from '../services/scan.service';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);

  useEffect(() => {
    loadScanTypes();
  }, []);

  const loadScanTypes = async () => {
    try {
      const types = await scanService.getScanTypes();
      setScanTypes(types);
    } catch (err) {
      console.error('Failed to load scan types:', err);
    }
  };

  const services = [
    {
      title: 'Website Security',
      icon: '🌐',
      description: 'Comprehensive web application security testing',
      features: [
        'Vulnerability detection',
        'Configuration analysis',
        'Outdated software detection',
        'SSL/TLS analysis',
        'Security headers check',
      ],
      scanTypes: ['website', 'ssl', 'waf']
    },
    {
      title: 'Network Security',
      icon: '🔒',
      description: 'Infrastructure and network security assessment',
      features: [
        'Port scanning',
        'Service detection',
        'Firewall analysis',
        'Network vulnerabilities',
        'OS fingerprinting',
      ],
      scanTypes: ['network', 'port_scan']
    },
    {
      title: 'Domain Intelligence',
      icon: '🔍',
      description: 'Domain and subdomain discovery',
      features: [
        'Subdomain enumeration',
        'DNS records analysis',
        'Whois information',
        'Domain reputation',
        'Certificate transparency',
      ],
      scanTypes: ['subdomain']
    },
  ];

  const pricing = [
    {
      name: 'Quick Scan',
      price: 'Free',
      features: [
        'Basic SSL certificate check',
        'DNS lookup analysis',
        'Basic vulnerability detection',
        'Instant results',
        'No login required',
      ],
      recommended: false,
      cta: 'Try Free Scan',
      action: () => navigate('/scan-demo'),
    },
    {
      name: 'Professional',
      price: '€49',
      features: [
        'All 40+ scan types',
        'WordPress/Joomla/Drupal scans',
        'Deep vulnerability analysis',
        'Detailed PDF reports',
        'Real-time progress tracking',
        'Priority support',
      ],
      recommended: true,
      cta: 'View Products',
      action: () => navigate('/products'),
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: [
        'All Professional features',
        'Scheduled & recurring scans',
        'Custom integrations',
        'Compliance reporting',
        'Dedicated account manager',
        'SLA guarantee',
      ],
      recommended: false,
      cta: 'Contact Sales',
      action: () => window.location.href = 'mailto:info@cobytes.nl?subject=Enterprise Security Scanning',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-500">Cobytes</span>
              <span className="ml-2 text-gray-600">Security Platform</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary-500">Home</a>
              <a href="#services" className="text-gray-700 hover:text-primary-500">Services</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary-500">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-primary-500">Contact</a>
              <button
                onClick={() => navigate('/products')}
                className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition"
              >
                View Products
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-700 opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-20"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Professional Security Scanning Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Powered by industry-leading security scanning technology for comprehensive security analysis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="bg-primary-500 text-white px-8 py-3 rounded text-lg font-semibold hover:bg-primary-600 transition"
            >
              Browse Security Products
            </button>
            <button
              onClick={() => navigate('/scan-demo')}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded text-lg font-semibold hover:bg-white hover:text-gray-900 transition"
            >
              Try Free Demo
            </button>
          </div>
        </div>
      </section>

      {/* Available Scan Types */}
      {scanTypes.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Available Security Scans
              </h2>
              <p className="text-xl text-gray-600">
                Choose from {scanTypes.length} different scan types
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {scanTypes.map((scanType) => (
                <div
                  key={scanType.id}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate('/dashboard/scans/new')}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">{scanType.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{scanType.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Security Testing
            </h2>
            <p className="text-xl text-gray-600">
              Professional security analysis for all your digital assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple process in three steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select Scan Type</h3>
              <p className="text-gray-600">
                Choose from our various scan options that best fit your security needs
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Configure & Start</h3>
              <p className="text-gray-600">
                Enter your target and configure scan parameters, then start the automated analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Results</h3>
              <p className="text-gray-600">
                Receive real-time updates and a detailed report with findings and recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No hidden costs - pay only for what you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-lg shadow-lg p-8 ${
                  plan.recommended ? 'ring-2 ring-primary-500 transform scale-105' : ''
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    RECOMMENDED
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.price !== 'Custom' && plan.price !== 'Free' && (
                    <span className="text-gray-600">/scan</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.action}
                  className={`w-full py-3 px-4 rounded font-semibold transition ${
                    plan.recommended
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Improve Your Security?
          </h2>
          <p className="text-xl text-white mb-8">
            Start scanning your digital assets today with no login required
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-white text-primary-500 px-8 py-3 rounded text-lg font-semibold hover:bg-gray-100 transition"
          >
            View Security Products
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Cobytes Security</h3>
              <p className="text-gray-400">
                Professional security scanning platform
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Website Security</a></li>
                <li><a href="#" className="hover:text-white">Network Security</a></li>
                <li><a href="#" className="hover:text-white">API Security</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                info@cobytes.nl<br />
                +31 (0)85 123 4567<br />
                KvK: 12345678
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Cobytes B.V. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;