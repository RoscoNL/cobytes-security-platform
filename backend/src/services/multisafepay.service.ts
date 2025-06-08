import axios from 'axios';
import { Order } from '../models/order.model';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface MultiSafepayConfig {
  apiUrl: string;
  apiKey: string;
  notificationUrl: string;
}

interface MultiSafepayOrder {
  order_id: string;
  type: 'redirect' | 'direct';
  currency: string;
  amount: number;
  description: string;
  items?: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    zip_code: string;
    country: string;
    phone?: string;
    company_name?: string;
  };
  payment_options: {
    notification_url: string;
    redirect_url: string;
    cancel_url: string;
    close_window: boolean;
  };
}

interface MultiSafepayResponse {
  success: boolean;
  data?: {
    order_id: string;
    payment_url: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

class MultiSafepayService {
  private config: MultiSafepayConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.MULTISAFEPAY_API_URL || 'https://api.multisafepay.com/v1/json',
      apiKey: process.env.MULTISAFEPAY_API_KEY || '',
      notificationUrl: process.env.MULTISAFEPAY_NOTIFICATION_URL || 'https://api.cobytes.nl/api/multisafepay/webhook',
    };
  }

  /**
   * Create a payment order in MultiSafepay
   */
  async createPaymentOrder(order: Order): Promise<{ paymentUrl: string; transactionId: string }> {
    try {
      // Split name into first and last name
      const nameParts = order.billing_name.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      // Create order description
      const description = `Cobytes Security Scan Order #${order.order_number}`;
      
      // Create items description
      const itemsDescription = order.items
        .map(item => `${item.product.name} (${item.quantity}x)`)
        .join(', ');

      const mspOrder: MultiSafepayOrder = {
        order_id: order.order_number,
        type: 'redirect',
        currency: 'EUR',
        amount: Math.round(order.total * 100), // Convert to cents
        description: description,
        items: itemsDescription,
        customer: {
          email: order.billing_email,
          first_name: firstName,
          last_name: lastName,
          address1: order.billing_address,
          city: order.billing_city,
          zip_code: order.billing_postal_code,
          country: order.billing_country,
          company_name: order.billing_company,
        },
        payment_options: {
          notification_url: this.config.notificationUrl,
          redirect_url: `${process.env.FRONTEND_URL}/orders/${order.id}/success`,
          cancel_url: `${process.env.FRONTEND_URL}/orders/${order.id}/cancelled`,
          close_window: true,
        },
      };

      const response = await axios.post<MultiSafepayResponse>(
        `${this.config.apiUrl}/orders`,
        mspOrder,
        {
          headers: {
            'api_key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        logger.info('Created MultiSafepay payment order', {
          orderId: order.id,
          orderNumber: order.order_number,
          paymentUrl: response.data.data.payment_url,
        });

        return {
          paymentUrl: response.data.data.payment_url,
          transactionId: response.data.data.order_id,
        };
      } else {
        throw new Error(response.data.error?.message || 'Failed to create payment order');
      }
    } catch (error: any) {
      logger.error('Failed to create MultiSafepay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Get order status from MultiSafepay
   */
  async getOrderStatus(orderId: string): Promise<{ status: string; paid: boolean }> {
    try {
      const response = await axios.get(
        `${this.config.apiUrl}/orders/${orderId}`,
        {
          headers: {
            'api_key': this.config.apiKey,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const order = response.data.data;
        return {
          status: order.status,
          paid: order.status === 'completed',
        };
      } else {
        throw new Error('Failed to get order status');
      }
    } catch (error) {
      logger.error('Failed to get MultiSafepay order status:', error);
      return { status: 'unknown', paid: false };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(timestamp: string, body: string, signature: string): boolean {
    const secret = process.env.MULTISAFEPAY_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha512', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Handle webhook notification from MultiSafepay
   */
  async handleWebhook(data: any): Promise<{ orderId: string; status: string; paid: boolean }> {
    try {
      const { transactionid, status } = data;
      
      logger.info('Processing MultiSafepay webhook', {
        transactionId: transactionid,
        status: status,
      });

      // Check if payment is completed
      const paid = status === 'completed';

      return {
        orderId: transactionid,
        status: status,
        paid: paid,
      };
    } catch (error) {
      logger.error('Failed to process MultiSafepay webhook:', error);
      throw error;
    }
  }
}

export default new MultiSafepayService();