#!/usr/bin/env node

/**
 * Grant test user some scan credits for testing
 */

const { AppDataSource } = require('./dist/config/typeorm');
const { User } = require('./dist/models/user.model');
const { Order } = require('./dist/models/order.model');
const { OrderItem } = require('./dist/models/orderItem.model');
const { Product } = require('./dist/models/product.model');

async function grantTestScans() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    const userRepository = AppDataSource.getRepository(User);
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const productRepository = AppDataSource.getRepository(Product);
    
    // Find test user
    const user = await userRepository.findOne({
      where: { email: 'test@cobytes.com' }
    });
    
    if (!user) {
      console.log('❌ Test user not found');
      process.exit(1);
    }
    
    // Find or create a scan product
    let product = await productRepository.findOne({
      where: { name: 'Test Scan Package' }
    });
    
    if (!product) {
      product = productRepository.create({
        name: 'Test Scan Package',
        slug: 'test-scan-package',
        description: 'Test scan package for development',
        price: 0,
        category: 'security_scan',
        features: ['10 scans', 'All scan types'],
        is_active: true,
        scan_credits: 50
      });
      await productRepository.save(product);
      console.log('✅ Created test product');
    }
    
    // Create a completed order
    const order = orderRepository.create({
      user: user,
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'multisafepay',
      total: 0
    });
    await orderRepository.save(order);
    console.log('✅ Created test order');
    
    // Create order items with scan credits
    const scanTypes = ['wordpress', 'ssl', 'website', 'network', 'subdomain'];
    
    for (const scanType of scanTypes) {
      const orderItem = orderItemRepository.create({
        order: order,
        product: product,
        quantity: 5, // 5 scans of each type
        price: 0,
        status: 'active',
        metadata: {
          scan_type: scanType,
          scans_total: 5,
          scans_used: 0
        }
      });
      await orderItemRepository.save(orderItem);
      console.log(`✅ Added 5 ${scanType} scans`);
    }
    
    console.log('\n✅ Test scans granted successfully!');
    console.log('   User: test@cobytes.com');
    console.log('   Scans: 5 of each type (wordpress, ssl, website, network, subdomain)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error granting scans:', error);
    process.exit(1);
  }
}

grantTestScans();