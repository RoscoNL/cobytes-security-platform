import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.model';
import { ScanResult } from './scanResult.model';
import { OrderItem } from './orderItem.model';

export enum ScanType {
  // Information Gathering
  SUBDOMAIN = 'subdomain',
  DNS_LOOKUP = 'dns_lookup',
  DNS_ZONE_TRANSFER = 'dns_zone_transfer',
  WHOIS_LOOKUP = 'whois',
  EMAIL_FINDER = 'email_finder',
  
  // Network
  PORT_SCAN = 'port_scan',
  PING_HOST = 'ping',
  TRACEROUTE = 'traceroute',
  NETWORK = 'network',
  
  // Web Application
  WEBSITE = 'website',
  WEBSITE_RECON = 'website_recon',
  SSL = 'ssl',
  WAF = 'waf',
  HTTP_HEADERS = 'http_headers',
  WEBSITE_SCREENSHOT = 'screenshot',
  URL_FUZZER = 'url_fuzzer',
  
  // CMS
  WORDPRESS = 'wordpress',
  DRUPAL = 'drupal',
  JOOMLA = 'joomla',
  MAGENTO = 'magento',
  SHAREPOINT = 'sharepoint',
  
  // API
  API = 'api',
  GRAPHQL = 'graphql',
  
  // Vulnerability
  XSS = 'xss',
  SQLI = 'sqli',
  CORS = 'cors',
  
  // Cloud
  S3_BUCKET = 's3_bucket',
  SUBDOMAIN_TAKEOVER = 'subdomain_takeover',
  
  // OSINT
  GOOGLE_HACKING = 'google_hacking',
  BREACH_CHECK = 'breach_check'
}

export enum ScanStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('scans')
export class Scan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  target: string;

  @Column({ type: 'enum', enum: ScanType })
  type: ScanType;

  @Column({ type: 'enum', enum: ScanStatus, default: ScanStatus.PENDING })
  status: ScanStatus;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  pentest_tools_scan_id: number;

  @Column({ type: 'int', nullable: true })
  pentest_tools_target_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, user => user.scans, { nullable: true })
  user: User;

  @ManyToOne(() => OrderItem, orderItem => orderItem.scans, { nullable: true })
  @JoinColumn()
  order_item: OrderItem;

  @OneToMany(() => ScanResult, result => result.scan)
  results: ScanResult[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;
}