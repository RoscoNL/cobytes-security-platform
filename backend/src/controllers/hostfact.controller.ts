import { Request, Response } from 'express';
import hostfactService from '@services/hostfact.service';
import orderService from '@services/order.service';
import { PaymentStatus } from '@models/order.model';
import { logger } from '@utils/logger';

export const hostfactController = {
  // Handle HostFact webhook
  async handleWebhook(req: Request, res: Response) {
    try {
      logger.info('Received HostFact webhook', { body: req.body });
      
      const { Type, Action, InvoiceCode } = req.body;
      
      // Check if this is a payment notification
      if (Type === 'invoice' && Action === 'payment') {
        // Check payment status
        const isPaid = await hostfactService.checkPaymentStatus(InvoiceCode);
        
        if (isPaid) {
          // Update order status
          const order = await orderService.updatePaymentStatusByInvoiceCode(
            InvoiceCode,
            PaymentStatus.PAID
          );
          
          if (order) {
            logger.info('Order marked as paid via HostFact', {
              orderId: order.id,
              orderNumber: order.order_number,
              invoiceCode: InvoiceCode,
            });
          }
        }
      }
      
      // Always respond with 200 OK to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error handling HostFact webhook:', error);
      // Still respond with 200 to prevent retries
      res.status(200).json({ received: true, error: 'Processing failed' });
    }
  },
};