import { AppDataSource } from '../config/typeorm';
import { Order, OrderStatus, PaymentStatus } from '../models/order.model';
import { OrderItem, OrderItemStatus } from '../models/orderItem.model';
import { Cart } from '../models/cart.model';
import { User } from '../models/user.model';
import cartService from './cart.service';
import multisafepayService from './multisafepay.service';
import { logger } from '../utils/logger';

interface CreateOrderDto {
  cart_id: number;
  user_id?: number;
  billing_name: string;
  billing_email: string;
  billing_company?: string;
  billing_address: string;
  billing_city: string;
  billing_postal_code: string;
  billing_country: string;
  billing_vat_number?: string;
  payment_method: string;
  notes?: string;
}

class OrderService {
  private get orderRepository() {
    return AppDataSource.getRepository(Order);
  }

  private get orderItemRepository() {
    return AppDataSource.getRepository(OrderItem);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  async createOrder(data: CreateOrderDto): Promise<Order> {
    // Get cart
    const cart = await cartService.getCart(data.cart_id);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    // Create order
    const order = this.orderRepository.create({
      order_number: this.generateOrderNumber(),
      user: data.user_id ? { id: data.user_id } as User : undefined,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      payment_method: data.payment_method as any,
      subtotal: cart.subtotal,
      tax: cart.tax,
      discount: cart.discount_amount,
      total: cart.total,
      coupon_code: cart.coupon_code,
      billing_name: data.billing_name,
      billing_email: data.billing_email,
      billing_company: data.billing_company,
      billing_address: data.billing_address,
      billing_city: data.billing_city,
      billing_postal_code: data.billing_postal_code,
      billing_country: data.billing_country,
      billing_vat_number: data.billing_vat_number,
      notes: data.notes,
    });

    await this.orderRepository.save(order);

    // Create order items from cart items
    const orderItems: OrderItem[] = [];
    for (const cartItem of cart.items) {
      const orderItem = this.orderItemRepository.create({
        order: order,
        product: cartItem.product,
        quantity: cartItem.quantity,
        price: cartItem.price,
        total: cartItem.price * cartItem.quantity,
        status: OrderItemStatus.PENDING,
        configuration: cartItem.configuration,
        scans_total: cartItem.product.scan_credits * cartItem.quantity,
        scans_used: 0,
        valid_until: new Date(Date.now() + cartItem.product.validity_days * 24 * 60 * 60 * 1000),
      });
      orderItems.push(orderItem);
    }

    await this.orderItemRepository.save(orderItems);
    order.items = orderItems;

    // Clear the cart
    await cartService.clearCart(cart.id);

    logger.info(`Order created: ${order.order_number}`, {
      orderId: order.id,
      userId: data.user_id,
      total: order.total,
    });

    return order;
  }

  async getOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_number: orderNumber },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  async updatePaymentStatus(orderId: number, status: PaymentStatus, paymentIntentId?: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    
    order.payment_status = status;
    if (paymentIntentId) {
      order.payment_intent_id = paymentIntentId;
    }
    
    if (status === PaymentStatus.PAID) {
      order.paid_at = new Date();
      order.status = OrderStatus.COMPLETED;
      order.completed_at = new Date();
      
      // Activate order items
      for (const item of order.items) {
        item.status = OrderItemStatus.ACTIVE;
      }
      await this.orderItemRepository.save(order.items);
    }
    
    await this.orderRepository.save(order);
    
    logger.info(`Order payment status updated: ${order.order_number}`, {
      orderId: order.id,
      status: status,
      paymentIntentId: paymentIntentId,
    });
    
    return order;
  }

  async processMultiSafepayPayment(orderId: number): Promise<{ paymentUrl: string; transactionId: string }> {
    const order = await this.getOrder(orderId);
    
    // Create payment order in MultiSafepay
    const { paymentUrl, transactionId } = await multisafepayService.createPaymentOrder(order);
    
    // Store transaction ID for reference
    order.payment_intent_id = transactionId;
    await this.orderRepository.save(order);
    
    return { 
      paymentUrl,
      transactionId 
    };
  }

  async getAvailableScans(userId: number): Promise<{
    total: number;
    used: number;
    available: number;
    items: OrderItem[];
  }> {
    const orders = await this.getUserOrders(userId);
    
    const activeItems: OrderItem[] = [];
    let totalScans = 0;
    let usedScans = 0;
    
    for (const order of orders) {
      if (order.payment_status === PaymentStatus.PAID) {
        for (const item of order.items) {
          if (item.status === OrderItemStatus.ACTIVE && 
              (!item.valid_until || item.valid_until > new Date())) {
            activeItems.push(item);
            totalScans += item.scans_total || 0;
            usedScans += item.scans_used || 0;
          }
        }
      }
    }
    
    return {
      total: totalScans,
      used: usedScans,
      available: totalScans - usedScans,
      items: activeItems,
    };
  }

  async consumeScan(userId: number, scanType: string): Promise<OrderItem> {
    const { items } = await this.getAvailableScans(userId);
    
    // Find an item that can be used for this scan type
    const availableItem = items.find(item => {
      const hasScansLeft = (item.scans_total || 0) > (item.scans_used || 0);
      const supportsType = !item.product.scan_types || 
                          item.product.scan_types.length === 0 || 
                          item.product.scan_types.includes(scanType);
      return hasScansLeft && supportsType;
    });
    
    if (!availableItem) {
      throw new Error('No available scans for this scan type');
    }
    
    // Increment used count
    availableItem.scans_used = (availableItem.scans_used || 0) + 1;
    
    // Mark as used if no more scans left
    if (availableItem.scans_used >= (availableItem.scans_total || 0)) {
      availableItem.status = OrderItemStatus.USED;
    }
    
    await this.orderItemRepository.save(availableItem);
    
    return availableItem;
  }

  async updatePaymentStatusByTransactionId(transactionId: string, status: PaymentStatus): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { payment_intent_id: transactionId },
      relations: ['items', 'items.product']
    });
    
    if (!order) {
      // Try to find by order_number as fallback
      const orderByNumber = await this.orderRepository.findOne({
        where: { order_number: transactionId },
        relations: ['items', 'items.product']
      });
      
      if (!orderByNumber) {
        return null;
      }
      
      return this.updatePaymentStatus(orderByNumber.id, status);
    }
    
    return this.updatePaymentStatus(order.id, status);
  }

  async updatePaymentStatusByInvoiceCode(invoiceCode: string, status: PaymentStatus): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { payment_intent_id: invoiceCode },
      relations: ['items', 'items.product']
    });
    
    if (!order) {
      return null;
    }
    
    return this.updatePaymentStatus(order.id, status);
  }
}

export default new OrderService();