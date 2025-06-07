export interface Scan {
  id: string;
  type: 'website' | 'network' | 'api' | 'compliance';
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  findings?: Finding[];
  report?: Report;
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  evidence?: string;
}

export interface Report {
  id: string;
  scanId: string;
  summary: string;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  generatedAt: string;
  downloadUrl?: string;
}

export interface ScanPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  scanTypes: string[];
  recommended?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}