import { Request, Response } from 'express';
import orderService from '@services/order.service';
import { logger } from '@utils/logger';

interface AuthRequest extends Request {
  user?: { id: number };
}

export const orderController = {
  // Create a new order
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const orderData = {
        ...req.body,
        user_id: userId,
      };
      
      const order = await orderService.createOrder(orderData);
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  },

  // Get single order
  async getOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrder(parseInt(id));
      
      // Check if user owns this order
      if (req.user && order.user?.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error fetching order:', error);
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
  },

  // Get order by order number
  async getOrderByNumber(req: AuthRequest, res: Response) {
    try {
      const { orderNumber } = req.params;
      const order = await orderService.getOrderByNumber(orderNumber);
      
      // Check if user owns this order
      if (req.user && order.user?.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error fetching order:', error);
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
  },

  // Get user's orders
  async getUserOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }
      
      const orders = await orderService.getUserOrders(req.user.id);
      
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      logger.error('Error fetching user orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  },

  // Get available scans for user
  async getAvailableScans(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }
      
      const scans = await orderService.getAvailableScans(req.user.id);
      
      res.json({
        success: true,
        data: scans,
      });
    } catch (error) {
      logger.error('Error fetching available scans:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available scans',
      });
    }
  },

  // Initialize HostFact payment
  async initializePayment(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(parseInt(orderId));
      
      // Check if user owns this order
      if (req.user && order.user?.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
      
      const { paymentUrl, transactionId } = await orderService.processMultiSafepayPayment(order.id);
      
      res.json({
        success: true,
        data: { paymentUrl, transactionId },
      });
    } catch (error) {
      logger.error('Error initializing payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize payment',
      });
    }
  },

  // Update payment status (webhook)
  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { orderId, status, paymentIntentId } = req.body;
      
      const order = await orderService.updatePaymentStatus(
        orderId,
        status,
        paymentIntentId
      );
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment status',
      });
    }
  },
};