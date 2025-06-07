import React from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const packages = [
    {
      name: 'Basic Bundle',
      price: '€35',
      description: 'Essential security checks for small websites',
      features: [
        'Website vulnerability scan',
        'Basic security assessment',
        'Automated reporting',
        'Email support',
        '48-hour turnaround',
      ],
      scans: ['1x Website scan', '1x Basic report'],
      recommended: false,
    },
    {
      name: 'Standard Bundle',
      price: '€65',
      description: 'Comprehensive security testing for businesses',
      features: [
        'All Basic features',
        'API security testing',
        'Network vulnerability scan',
        'Detailed reporting with remediation',
        'Priority email support',
        '24-hour turnaround',
        'Monthly security updates',
      ],
      scans: ['1x Website scan', '1x API scan', '1x Network scan', 'Detailed reports'],
      recommended: true,
    },
    {
      name: 'PCI Compliance',
      price: '€60',
      description: 'Specialized compliance testing for e-commerce',
      features: [
        'PCI DSS compliance scan',
        'Quarterly ASV scanning',
        'Compliance certification',
        'Remediation guidance',
        'Priority support',
        'Same-day results',
      ],
      scans: ['PCI ASV scan', 'Compliance report', 'Certificate of compliance'],
      recommended: false,
    },
  ];

  const individualScans = [
    { name: 'Website Vulnerability Scan', price: '€20', original: '€25' },
    { name: 'API Security Test', price: '€35', original: '€50' },
    { name: 'Network Security Scan', price: '€25', original: '€35' },
    { name: 'Cloud Security Assessment', price: '€50', original: '€75' },
    { name: 'Mobile App Security', price: '€40', original: '€55' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the security package that fits your needs. No hidden costs, no surprises.
          All prices include detailed reporting and remediation guidance.
        </p>
      </div>

      {/* Package Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className={`relative rounded-lg shadow-lg overflow-hidden ${
              pkg.recommended
                ? 'ring-2 ring-primary-500 transform scale-105'
                : 'border border-gray-200'
            }`}
          >
            {pkg.recommended && (
              <div className="absolute top-0 right-0 bg-primary-500 text-white px-4 py-1 text-sm font-medium">
                RECOMMENDED
              </div>
            )}
            <div className="bg-white p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{pkg.price}</span>
                <span className="text-gray-600">/bundle</span>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Includes:</h4>
                <ul className="space-y-1">
                  {pkg.scans.map((scan, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {scan}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <svg className="w-4 h-4 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate('/dashboard/scans/new')}
                className={`w-full py-3 px-4 rounded-md font-medium transition ${
                  pkg.recommended
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Individual Scans */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Individual Scans</h2>
        <p className="text-gray-600 mb-8">
          Need just one scan? Choose from our individual security assessments.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {individualScans.map((scan) => (
            <div key={scan.name} className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">{scan.name}</h4>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">{scan.price}</span>
                <span className="ml-2 text-sm text-gray-500 line-through">{scan.original}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div className="mt-12 bg-primary-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Add-ons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Remediation Plan</h3>
              <p className="mt-1 text-sm text-gray-600">
                Detailed step-by-step guide to fix all identified vulnerabilities
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">+€15</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Management Summary</h3>
              <p className="mt-1 text-sm text-gray-600">
                Executive-level report with key findings and business impact
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">+€10</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                How long does a scan take?
              </h3>
              <p className="text-gray-600">
                Most scans complete within 15-30 minutes. Complex enterprise scans may take up to 2 hours.
                You'll receive an email notification when your scan is complete.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Do you offer custom packages?
              </h3>
              <p className="text-gray-600">
                Yes! For enterprise clients or specific requirements, contact us at sales@cobytes.nl
                for a custom quote.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept iDEAL, credit cards, SEPA direct debit, and bank transfers. 
                Enterprise clients can request NET 30 payment terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;