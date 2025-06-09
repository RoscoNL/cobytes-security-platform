#!/usr/bin/env node

const { AppDataSource } = require('./dist/config/typeorm');
const { User } = require('./dist/models/user.model');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'test@cobytes.com' }
    });
    
    if (existingUser) {
      console.log('⚠️  User test@cobytes.com already exists');
      process.exit(0);
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = userRepository.create({
      email: 'test@cobytes.com',
      password: hashedPassword,
      name: 'Test User',
      is_active: true,
      role: 'user'
    });
    
    await userRepository.save(user);
    console.log('✅ Test user created successfully:');
    console.log('   Email: test@cobytes.com');
    console.log('   Password: test123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createTestUser();