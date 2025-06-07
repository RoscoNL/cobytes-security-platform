import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import scanService, { Scan, ScanResult } from '../services/scan.service';

const ScanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadScan();
      const cleanup = subscribeToUpdates();
      return cleanup;
    }
  }, [id]);

  const loadScan = async () => {
    try {
      setLoading(true);
      const scanData = await scanService.getScan(parseInt(id!));
      setScan(scanData);
      setError(null);
    } catch (err) {
      console.error('Failed to load scan:', err);
      setError('Failed to load scan details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    return scanService.connectToScanUpdates(parseInt(id!), {
      onProgress: (data) => {
        setScan(prev => prev ? {
          ...prev,
          progress: data.progress,
          status: data.status as any
        } : null);
      },
      onResult: (data) => {
        // Refresh scan data when new results arrive
        loadScan();
      },
      onComplete: () => {
        loadScan();
      },
      onError: (error) => {
        console.error('Scan error:', error);
        setError('Scan encountered an error');
        loadScan();
      }
    });
  };

  const handleCancel = async () => {
    if (!scan || !window.confirm('Are you sure you want to cancel this scan?')) return;
    
    try {
      await scanService.cancelScan(parseInt(scan.id));
      await loadScan();
    } catch (err) {
      console.error('Failed to cancel scan:', err);
      alert('Failed to cancel scan');
    }
  };

  const handleDelete = async () => {
    if (!scan || !window.confirm('Are you sure you want to delete this scan?')) return;
    
    try {
      await scanService.deleteScan(parseInt(scan.id));
      navigate('/dashboard/scans');
    } catch (err) {
      console.error('Failed to delete scan:', err);
      alert('Failed to delete scan');
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!scan) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/reports/${scan.id}/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `scan-report-${scan.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
      alert('Failed to export report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100 animate-pulse';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-200';
      case 'high': return 'text-orange-800 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-800 bg-blue-100 border-blue-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const groupResultsBySeverity = (results: ScanResult[]) => {
    const grouped = {
      critical: [] as ScanResult[],
      high: [] as ScanResult[],
      medium: [] as ScanResult[],
      low: [] as ScanResult[],
      info: [] as ScanResult[]
    };

    results.forEach(result => {
      grouped[result.severity].push(result);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'Scan not found'}
        </div>
      </div>
    );
  }

  const groupedResults = scan.results ? groupResultsBySeverity(scan.results) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Scan Details</h1>
              <p className="mt-1 text-sm text-gray-600">
                Target: <span className="font-medium">{scan.target}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scan.status)}`}>
                {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
              </span>
              <div className="flex space-x-2">
                {scan.status === 'running' && (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                {scan.status === 'completed' && (
                  <div className="relative inline-block text-left">
                    <button
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      onClick={(e) => {
                        const menu = e.currentTarget.nextElementSibling;
                        menu?.classList.toggle('hidden');
                      }}
                    >
                      Export ▼
                    </button>
                    <div className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <button
                          onClick={() => handleExport('pdf')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export as PDF
                        </button>
                        <button
                          onClick={() => handleExport('csv')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export as CSV
                        </button>
                        <button
                          onClick={() => handleExport('json')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export as JSON
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {scan.status !== 'running' && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {scan.status === 'running' && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round(scan.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${scan.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Scan Info */}
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="text-sm font-medium text-gray-900">
              {scan.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Started</p>
            <p className="text-sm font-medium text-gray-900">
              {scan.started_at ? new Date(scan.started_at).toLocaleString() : 'Not started'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-sm font-medium text-gray-900">
              {scan.completed_at ? new Date(scan.completed_at).toLocaleString() : 'In progress'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-900">
              {scan.started_at && scan.completed_at
                ? `${Math.round((new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()) / 1000)}s`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {scan.results && scan.results.length > 0 && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Results Summary</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{groupedResults?.critical.length || 0}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{groupedResults?.high.length || 0}</p>
                <p className="text-sm text-gray-500">High</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{groupedResults?.medium.length || 0}</p>
                <p className="text-sm text-gray-500">Medium</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{groupedResults?.low.length || 0}</p>
                <p className="text-sm text-gray-500">Low</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{groupedResults?.info.length || 0}</p>
                <p className="text-sm text-gray-500">Info</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {scan.results && scan.results.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Findings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {scan.results.map((result) => (
              <div key={result.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{result.title}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(result.severity)}`}>
                        {result.severity.toUpperCase()}
                      </span>
                    </div>
                    {result.affected_component && (
                      <p className="mt-1 text-sm text-gray-600">
                        Affected: <code className="bg-gray-100 px-1 py-0.5 rounded">{result.affected_component}</code>
                      </p>
                    )}
                    {result.description && (
                      <p className="mt-2 text-sm text-gray-700">{result.description}</p>
                    )}
                    {result.recommendation && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900">Recommendation:</p>
                        <p className="mt-1 text-sm text-gray-700">{result.recommendation}</p>
                      </div>
                    )}
                    {result.references && result.references.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900">References:</p>
                        <ul className="mt-1 list-disc list-inside">
                          {result.references.map((ref, idx) => (
                            <li key={idx} className="text-sm text-blue-600 hover:text-blue-800">
                              <a href={ref} target="_blank" rel="noopener noreferrer">{ref}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(result.cve_id || result.cvss_score) && (
                      <div className="mt-2 flex items-center space-x-4">
                        {result.cve_id && (
                          <span className="text-sm text-gray-600">
                            CVE: <span className="font-medium">{result.cve_id}</span>
                          </span>
                        )}
                        {result.cvss_score && (
                          <span className="text-sm text-gray-600">
                            CVSS: <span className="font-medium">{result.cvss_score}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {scan.status === 'completed' && (!scan.results || scan.results.length === 0) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
            <p className="mt-1 text-sm text-gray-500">The scan completed successfully with no findings.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {scan.error_message && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mt-6">
          <p className="font-medium">Scan Error:</p>
          <p className="text-sm mt-1">{scan.error_message}</p>
        </div>
      )}
    </div>
  );
};

export default ScanDetail;