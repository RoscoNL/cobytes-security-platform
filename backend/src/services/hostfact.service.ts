import axios from 'axios';
import { Order } from '../models/order.model';
import { logger } from '../utils/logger';

interface HostFactConfig {
  url: string;
  apiKey: string;
  debtorCode?: string;
}

interface HostFactInvoice {
  InvoiceCode: string;
  Debtor: number;
  DebtorCode: string;
  Status: number;
  InvoiceLines: HostFactInvoiceLine[];
  PaymentURL?: string;
}

interface HostFactInvoiceLine {
  Description: string;
  PriceExcl: number;
  TaxPercentage: number;
  Quantity: number;
  ProductCode?: string;
}

class HostFactService {
  private config: HostFactConfig;

  constructor() {
    this.config = {
      url: process.env.HOSTFACT_URL || 'https://secure.cobytes.com/Pro/apiv2/api.php',
      apiKey: process.env.HOSTFACT_API_KEY || '6685741463b3d6791e31779df6a99a92',
      debtorCode: process.env.HOSTFACT_DEBTOR_CODE,
    };
  }

  /**
   * Create or get debtor (customer) in HostFact
   */
  async createOrGetDebtor(order: Order): Promise<string> {
    try {
      // Search for existing debtor by email
      const searchResponse = await axios.post(
        `${this.config.url}/debtor/list`,
        {
          api_key: this.config.apiKey,
          EmailAddress: order.billing_email,
        }
      );

      if (searchResponse.data.debtors && searchResponse.data.debtors.length > 0) {
        return searchResponse.data.debtors[0].DebtorCode;
      }

      // Create new debtor
      const createResponse = await axios.post(
        `${this.config.url}/debtor/add`,
        {
          api_key: this.config.apiKey,
          CompanyName: order.billing_company || order.billing_name,
          ContactName: order.billing_name,
          EmailAddress: order.billing_email,
          Address: order.billing_address,
          ZipCode: order.billing_postal_code,
          City: order.billing_city,
          Country: order.billing_country,
          TaxNumber: order.billing_vat_number,
        }
      );

      return createResponse.data.debtor.DebtorCode;
    } catch (error) {
      logger.error('Failed to create/get HostFact debtor:', error);
      throw new Error('Failed to create customer in HostFact');
    }
  }

  /**
   * Create invoice in HostFact for the order
   */
  async createInvoice(order: Order): Promise<HostFactInvoice> {
    try {
      const debtorCode = await this.createOrGetDebtor(order);

      // Create invoice lines from order items
      const invoiceLines: HostFactInvoiceLine[] = order.items.map(item => ({
        Description: `${item.product.name} (${item.quantity}x)`,
        PriceExcl: parseFloat(item.price.toString()),
        TaxPercentage: 21, // Dutch VAT
        Quantity: item.quantity,
        ProductCode: `SCAN-${item.product.id}`,
      }));

      // Add discount line if applicable
      if (order.discount > 0) {
        invoiceLines.push({
          Description: `Discount (${order.coupon_code || 'Promotional'})`,
          PriceExcl: -parseFloat(order.discount.toString()),
          TaxPercentage: 21,
          Quantity: 1,
        });
      }

      // Create invoice
      const response = await axios.post(
        `${this.config.url}/invoice/add`,
        {
          api_key: this.config.apiKey,
          DebtorCode: debtorCode,
          InvoiceLines: invoiceLines,
          Notes: order.notes,
          Reference: order.order_number,
          SendMethod: 'email', // Send invoice by email
          PaymentMethod: 'online', // Enable online payment
        }
      );

      const invoice = response.data.invoice;
      
      // Get payment URL
      const paymentResponse = await axios.post(
        `${this.config.url}/invoice/getpaymenturl`,
        {
          api_key: this.config.apiKey,
          InvoiceCode: invoice.InvoiceCode,
        }
      );

      invoice.PaymentURL = paymentResponse.data.url;

      logger.info('Created HostFact invoice', {
        orderId: order.id,
        invoiceCode: invoice.InvoiceCode,
        paymentUrl: invoice.PaymentURL,
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to create HostFact invoice:', error);
      throw new Error('Failed to create invoice in HostFact');
    }
  }

  /**
   * Check invoice payment status
   */
  async checkPaymentStatus(invoiceCode: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.config.url}/invoice/show`,
        {
          api_key: this.config.apiKey,
          InvoiceCode: invoiceCode,
        }
      );

      const invoice = response.data.invoice;
      // Status 3 = Paid in HostFact
      return invoice.Status === 3;
    } catch (error) {
      logger.error('Failed to check HostFact payment status:', error);
      return false;
    }
  }

  /**
   * Handle webhook from HostFact
   */
  async handleWebhook(data: any): Promise<void> {
    try {
      if (data.Type === 'invoice' && data.Action === 'payment') {
        const invoiceCode = data.InvoiceCode;
        const isPaid = await this.checkPaymentStatus(invoiceCode);
        
        if (isPaid) {
          // Find order by reference and update payment status
          logger.info('HostFact payment received', { invoiceCode });
          // TODO: Update order payment status
        }
      }
    } catch (error) {
      logger.error('Failed to handle HostFact webhook:', error);
    }
  }
}

export default new HostFactService();