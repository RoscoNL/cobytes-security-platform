import { AppDataSource } from '../config/typeorm';
import { Coupon, CouponType, CouponStatus } from '../models/coupon.model';
import { CouponUsage } from '../models/couponUsage.model';
import { Cart } from '../models/cart.model';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

class CouponService {
  private couponRepository = AppDataSource.getRepository(Coupon);
  private usageRepository = AppDataSource.getRepository(CouponUsage);

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const coupon = this.couponRepository.create(data);
    return await this.couponRepository.save(coupon);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return await this.couponRepository.findOne({
      where: { code: code.toUpperCase() }
    });
  }

  async validateCoupon(
    code: string, 
    cart: Cart, 
    userId?: number, 
    sessionId?: string
  ): Promise<{ valid: boolean; error?: string; coupon?: Coupon; discount?: number }> {
    // Find coupon
    const coupon = await this.findByCode(code);
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return { valid: false, error: 'Coupon is expired or no longer valid' };
    }

    // Check minimum amount requirement
    if (cart.subtotal < coupon.minimum_amount) {
      return { 
        valid: false, 
        error: `Minimum order amount of €${coupon.minimum_amount} required` 
      };
    }

    // Check usage limit per user
    if (userId || sessionId) {
      const usageCount = await this.usageRepository.count({
        where: [
          { coupon_id: coupon.id, user_id: userId },
          { coupon_id: coupon.id, session_id: sessionId }
        ]
      });

      if (usageCount >= coupon.usage_limit_per_user) {
        return { valid: false, error: 'You have already used this coupon' };
      }
    }

    // Calculate discount based on coupon type
    let discount = 0;
    
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = (cart.subtotal * (coupon.value || 0)) / 100;
        break;
      
      case CouponType.FIXED_AMOUNT:
        discount = Math.min(coupon.value || 0, cart.subtotal);
        break;
      
      case CouponType.FREE_SCAN:
        // Find the cheapest applicable product in cart
        const applicableItems = cart.items.filter(item => {
          if (!coupon.applicable_scan_types || coupon.applicable_scan_types.length === 0) {
            return true; // Applies to any scan
          }
          // Check if product has any of the applicable scan types
          return item.product.scan_types?.some(type => 
            coupon.applicable_scan_types?.includes(type)
          );
        });
        
        if (applicableItems.length === 0) {
          return { valid: false, error: 'No applicable items in cart for this coupon' };
        }
        
        // Get the cheapest applicable item
        const cheapestItem = applicableItems.reduce((min, item) => 
          item.price < min.price ? item : min
        );
        
        discount = cheapestItem.price * cheapestItem.quantity;
        break;
      
      case CouponType.FREE_PRODUCT:
        // Check if applicable products are in cart
        if (coupon.applicable_products && coupon.applicable_products.length > 0) {
          const applicableItem = cart.items.find(item => 
            coupon.applicable_products?.includes(item.product.id)
          );
          
          if (!applicableItem) {
            return { valid: false, error: 'No applicable products in cart for this coupon' };
          }
          
          discount = applicableItem.price;
        }
        break;
    }

    return { valid: true, coupon, discount };
  }

  async recordUsage(
    coupon: Coupon, 
    orderId: number, 
    discountAmount: number,
    userId?: number, 
    sessionId?: string
  ): Promise<void> {
    // Create usage record
    const usage = this.usageRepository.create({
      coupon_id: coupon.id,
      user_id: userId,
      session_id: sessionId,
      order_id: orderId,
      discount_amount: discountAmount
    });
    
    await this.usageRepository.save(usage);
    
    // Update coupon usage count
    coupon.usage_count += 1;
    if (coupon.usage_count >= coupon.usage_limit) {
      coupon.status = CouponStatus.DEPLETED;
    }
    
    await this.couponRepository.save(coupon);
  }

  async initializeDefaultCoupons(): Promise<void> {
    const existingCoupons = await this.couponRepository.count();
    
    if (existingCoupons === 0) {
      // Create default coupons
      const defaultCoupons = [
        {
          code: 'FREESCAN',
          type: CouponType.FREE_SCAN,
          description: 'Get one free security scan',
          usage_limit: 100,
          usage_limit_per_user: 1,
          minimum_amount: 0,
          status: CouponStatus.ACTIVE
        },
        {
          code: 'WELCOME10',
          type: CouponType.PERCENTAGE,
          value: 10,
          description: '10% off your first order',
          usage_limit: 1000,
          usage_limit_per_user: 1,
          minimum_amount: 20,
          status: CouponStatus.ACTIVE
        },
        {
          code: 'SAVE20',
          type: CouponType.PERCENTAGE,
          value: 20,
          description: '20% off orders over €100',
          usage_limit: 500,
          usage_limit_per_user: 2,
          minimum_amount: 100,
          status: CouponStatus.ACTIVE
        }
      ];

      for (const couponData of defaultCoupons) {
        await this.createCoupon(couponData);
        logger.info(`Created coupon: ${couponData.code}`);
      }
    }
  }
}

export default new CouponService();