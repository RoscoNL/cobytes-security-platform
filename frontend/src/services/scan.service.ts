import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { pentestToolsProxyService, ProxyPentestToolId } from './pentesttools-proxy.service';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface ScanType {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface CreateScanDto {
  target: string;
  type: string;
  parameters: Record<string, any>;
}

export interface Scan {
  id: string;
  target: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  parameters: Record<string, any>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  results?: ScanResult[];
  pentestToolsScanId?: number;
}

export interface ScanResult {
  id: number;
  type: string;
  title: string;
  description?: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  affected_component?: string;
  recommendation?: string;
  references?: string[];
  cve_id?: string;
  cvss_score?: number;
}

export interface ScanProgress {
  scanId: number;
  progress: number;
  status: string;
  message?: string;
}

class ScanService {
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Get all available scan types
  async getScanTypes(): Promise<ScanType[]> {
    const response = await axios.get(`${API_BASE_URL}/scans/scan-types`, {
      headers: this.getHeaders(),
    });
    return response.data.data;
  }

  // Create a new scan
  async createScan(data: CreateScanDto): Promise<Scan> {
    const response = await axios.post(`${API_BASE_URL}/scans`, data, {
      headers: this.getHeaders(),
    });
    return response.data.data;
  }

  // Get scan by ID
  async getScan(id: number): Promise<Scan> {
    const response = await axios.get(`${API_BASE_URL}/scans/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data.data;
  }

  // Get all scans (authenticated users only)
  async getAllScans(): Promise<Scan[]> {
    const response = await axios.get(`${API_BASE_URL}/scans`, {
      headers: this.getHeaders(),
    });
    return response.data.data;
  }

  // Cancel a scan
  async cancelScan(id: number): Promise<void> {
    await axios.post(`${API_BASE_URL}/scans/${id}/cancel`, {}, {
      headers: this.getHeaders(),
    });
  }

  // Delete a scan
  async deleteScan(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/scans/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // WebSocket connection for real-time updates
  connectToScanUpdates(scanId: number, callbacks: {
    onProgress?: (data: ScanProgress) => void;
    onResult?: (data: any) => void;
    onComplete?: (data: any) => void;
    onError?: (error: any) => void;
  }) {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
        auth: {
          token: this.token,
        },
      });
    }

    // Subscribe to scan updates
    this.socket.emit('subscribe:scan', scanId);

    // Listen for progress updates
    if (callbacks.onProgress) {
      this.socket.on('scan:progress', callbacks.onProgress);
    }

    // Listen for result updates
    if (callbacks.onResult) {
      this.socket.on('scan:result', callbacks.onResult);
    }

    // Listen for completion
    if (callbacks.onComplete) {
      this.socket.on('scan:complete', callbacks.onComplete);
    }

    // Listen for errors
    if (callbacks.onError) {
      this.socket.on('scan:error', callbacks.onError);
    }

    // Return cleanup function
    return () => {
      this.socket?.emit('unsubscribe:scan', scanId);
      this.socket?.off('scan:progress');
      this.socket?.off('scan:result');
      this.socket?.off('scan:complete');
      this.socket?.off('scan:error');
    };
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // PentestTools integration
  async createPentestToolsScan(toolId: number, target: string, params: any = {}): Promise<any> {
    try {
      // Create or get target
      let targetId;
      try {
        const targets = await pentestToolsProxyService.getTargets();
        const existingTarget = targets.find(t => t.name === target);
        
        if (existingTarget) {
          targetId = existingTarget.id;
        } else {
          const newTarget = await pentestToolsProxyService.createTarget(target);
          targetId = newTarget.id;
        }
      } catch (err) {
        console.log('Using target_name parameter instead of target_id');
      }

      // Start the scan
      const scanOptions = {
        tool_id: toolId,
        target_name: target,
        target_id: targetId,
        tool_params: params
      };

      const { scan_id } = await pentestToolsProxyService.startScan(scanOptions);
      
      // Return scan info for tracking
      return {
        id: scan_id,
        target,
        type: `pentest_tool_${toolId}`,
        status: 'running',
        progress: 0,
        parameters: params,
        pentestToolsScanId: scan_id
      };
    } catch (error: any) {
      console.error('Failed to create PentestTools scan:', error);
      throw error;
    }
  }

  // Poll PentestTools scan status
  async pollPentestToolsScan(scanId: number, onProgress?: (progress: number) => void): Promise<any> {
    return pentestToolsProxyService.waitForScanCompletion(scanId, onProgress);
  }
}

export default new ScanService();