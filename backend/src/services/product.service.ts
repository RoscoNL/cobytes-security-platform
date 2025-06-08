import { AppDataSource } from '../config/typeorm';
import { Product, ProductCategory } from '../models/product.model';
import { ScanType } from '../models/scan.model';
import { logger } from '../utils/logger';

class ProductService {
  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  async initializeProducts() {
    // Check if products already exist
    const count = await this.productRepository.count();
    if (count > 0) {
      logger.info('Products already initialized');
      return;
    }

    logger.info('Initializing product catalog...');

    const products = [
      // Individual Scans
      {
        name: 'SSL/TLS Security Check',
        description: 'Comprehensive SSL certificate and configuration analysis',
        price: 9.99,
        category: ProductCategory.SECURITY_SCAN,
        features: [
          'SSL certificate validation',
          'Security headers analysis',
          'Cipher suite evaluation',
          'Certificate chain verification',
          'Instant results'
        ],
        scan_types: [ScanType.SSL],
        scan_credits: 1,
        validity_days: 30,
        is_featured: false
      },
      {
        name: 'WordPress Security Scan',
        description: 'Deep vulnerability scan for WordPress websites',
        price: 29.99,
        category: ProductCategory.SECURITY_SCAN,
        features: [
          'Plugin vulnerability detection',
          'Theme security analysis',
          'User enumeration check',
          'Configuration review',
          'Detailed PDF report'
        ],
        scan_types: [ScanType.WORDPRESS],
        scan_credits: 1,
        validity_days: 30,
        is_featured: true
      },
      {
        name: 'Full Website Security Audit',
        description: 'Complete web application security assessment',
        price: 79.99,
        category: ProductCategory.SECURITY_SCAN,
        features: [
          'XSS vulnerability detection',
          'SQL injection testing',
          'Security misconfiguration',
          'Broken authentication check',
          'Comprehensive report with remediation'
        ],
        scan_types: [ScanType.WEBSITE],
        scan_credits: 1,
        validity_days: 30,
        is_featured: true
      },
      {
        name: 'Network Security Assessment',
        description: 'Infrastructure and network vulnerability scan',
        price: 99.99,
        category: ProductCategory.SECURITY_SCAN,
        features: [
          'Port scanning',
          'Service detection',
          'OS fingerprinting',
          'Vulnerability identification',
          'Network topology mapping'
        ],
        scan_types: [ScanType.NETWORK, ScanType.PORT_SCAN],
        scan_credits: 1,
        validity_days: 30,
        is_featured: false
      },

      // Bundles
      {
        name: 'Starter Bundle',
        description: 'Perfect for small websites and blogs',
        price: 49.99,
        category: ProductCategory.BUNDLE,
        features: [
          '5 security scans',
          'SSL + Basic website scans',
          'Email support',
          'Valid for 90 days',
          'Save 30%'
        ],
        scan_types: [ScanType.SSL, ScanType.WEBSITE, ScanType.DNS_LOOKUP],
        scan_credits: 5,
        validity_days: 90,
        is_featured: true
      },
      {
        name: 'Professional Bundle',
        description: 'Comprehensive security for business websites',
        price: 149.99,
        category: ProductCategory.BUNDLE,
        features: [
          '15 security scans',
          'All scan types included',
          'Priority support',
          'Valid for 180 days',
          'Save 40%'
        ],
        scan_types: [], // All types
        scan_credits: 15,
        validity_days: 180,
        is_featured: true
      },
      {
        name: 'Enterprise Bundle',
        description: 'Complete security solution for large organizations',
        price: 399.99,
        category: ProductCategory.BUNDLE,
        features: [
          '50 security scans',
          'All scan types included',
          'Dedicated support',
          'Custom reporting',
          'Valid for 365 days',
          'Save 50%'
        ],
        scan_types: [], // All types
        scan_credits: 50,
        validity_days: 365,
        is_featured: false
      },

      // Subscriptions
      {
        name: 'Monthly Subscription',
        description: 'Unlimited scans for continuous security monitoring',
        price: 99.99,
        category: ProductCategory.SUBSCRIPTION,
        features: [
          'Unlimited scans',
          'All scan types',
          'Scheduled scans',
          'Real-time alerts',
          'Priority support',
          'Monthly billing'
        ],
        scan_types: [], // All types
        scan_credits: 999, // Effectively unlimited
        validity_days: 30,
        is_featured: true
      }
    ];

    for (const productData of products) {
      const product = this.productRepository.create(productData);
      await this.productRepository.save(product);
    }

    logger.info(`Initialized ${products.length} products`);
  }

  async getAllProducts(includeInactive = false) {
    const query = this.productRepository.createQueryBuilder('product');
    
    if (!includeInactive) {
      query.where('product.is_active = :active', { active: true });
    }
    
    return query.orderBy('product.category', 'ASC')
      .addOrderBy('product.price', 'ASC')
      .getMany();
  }

  async getProductById(id: number) {
    return this.productRepository.findOne({ where: { id } });
  }

  async getProductsByCategory(category: ProductCategory) {
    return this.productRepository.find({
      where: { category, is_active: true },
      order: { price: 'ASC' }
    });
  }

  async getFeaturedProducts() {
    return this.productRepository.find({
      where: { is_featured: true, is_active: true },
      order: { price: 'ASC' }
    });
  }

  async updateProduct(id: number, data: Partial<Product>) {
    await this.productRepository.update(id, data);
    return this.getProductById(id);
  }

  async deactivateProduct(id: number) {
    await this.productRepository.update(id, { is_active: false });
  }
}

export default new ProductService();