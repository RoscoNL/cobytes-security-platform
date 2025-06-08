import { Request, Response } from 'express';
import multisafepayService from '@services/multisafepay.service';
import orderService from '@services/order.service';
import { PaymentStatus } from '@models/order.model';
import { logger } from '@utils/logger';

export const multisafepayController = {
  // Handle MultiSafepay webhook notification
  async handleWebhook(req: Request, res: Response) {
    try {
      logger.info('Received MultiSafepay webhook', { 
        body: req.body,
        headers: req.headers 
      });
      
      // Verify webhook signature if provided
      const signature = req.headers['x-multisafepay-signature'] as string;
      const timestamp = req.headers['x-multisafepay-timestamp'] as string;
      
      if (signature && timestamp) {
        const isValid = multisafepayService.verifyWebhookSignature(
          timestamp,
          JSON.stringify(req.body),
          signature
        );
        
        if (!isValid) {
          logger.warn('Invalid MultiSafepay webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
      
      // Process webhook data
      const { orderId, status, paid } = await multisafepayService.handleWebhook(req.body);
      
      if (paid) {
        // Update order status to paid
        const order = await orderService.updatePaymentStatusByTransactionId(
          orderId,
          PaymentStatus.PAID
        );
        
        if (order) {
          logger.info('Order marked as paid via MultiSafepay', {
            orderId: order.id,
            orderNumber: order.order_number,
            transactionId: orderId,
          });
        }
      } else if (status === 'cancelled' || status === 'declined') {
        // Update order status to failed
        const order = await orderService.updatePaymentStatusByTransactionId(
          orderId,
          PaymentStatus.FAILED
        );
        
        if (order) {
          logger.info('Order payment failed via MultiSafepay', {
            orderId: order.id,
            orderNumber: order.order_number,
            status: status,
          });
        }
      }
      
      // Always respond with OK to acknowledge receipt
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Error handling MultiSafepay webhook:', error);
      // Still respond with OK to prevent retries
      res.status(200).send('OK');
    }
  },

  // Get payment status (for frontend polling)
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      
      const { status, paid } = await multisafepayService.getOrderStatus(transactionId);
      
      res.json({
        success: true,
        data: { status, paid },
      });
    } catch (error) {
      logger.error('Error checking payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check payment status',
      });
    }
  },
};