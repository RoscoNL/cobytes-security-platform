import { Request, Response } from 'express';
import cartService from '@services/cart.service';
import { logger } from '@utils/logger';

interface AuthRequest extends Request {
  user?: { id: number };
}

export const cartController = {
  // Get current cart
  async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string || 'default-session';
      
      const cart = await cartService.getOrCreateCart(userId, sessionId);
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error fetching cart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cart'
      });
    }
  },

  // Add item to cart
  async addToCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string || 'default-session';
      const { productId, quantity = 1, configuration } = req.body;
      
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }
      
      const cart = await cartService.addToCart(userId, sessionId, {
        productId,
        quantity,
        configuration
      });
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add item to cart'
      });
    }
  },

  // Update cart item quantity
  async updateCartItem(req: AuthRequest, res: Response) {
    try {
      const { cartId, itemId } = req.params;
      const { quantity } = req.body;
      
      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid quantity is required'
        });
      }
      
      const cart = await cartService.updateCartItem(
        parseInt(cartId),
        parseInt(itemId),
        quantity
      );
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error updating cart item:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cart item'
      });
    }
  },

  // Remove item from cart
  async removeFromCart(req: AuthRequest, res: Response) {
    try {
      const { cartId, itemId } = req.params;
      
      const cart = await cartService.removeFromCart(
        parseInt(cartId),
        parseInt(itemId)
      );
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error removing from cart:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove item from cart'
      });
    }
  },

  // Clear cart
  async clearCart(req: AuthRequest, res: Response) {
    try {
      const { cartId } = req.params;
      
      await cartService.clearCart(parseInt(cartId));
      
      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      logger.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cart'
      });
    }
  },

  // Apply coupon
  async applyCoupon(req: AuthRequest, res: Response) {
    try {
      const { cartId } = req.params;
      const { couponCode } = req.body;
      const userId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string || req.session?.id;
      
      if (!couponCode) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required'
        });
      }
      
      const cart = await cartService.applyCoupon(
        parseInt(cartId), 
        couponCode,
        userId,
        sessionId
      );
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error applying coupon:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply coupon'
      });
    }
  },

  // Remove coupon
  async removeCoupon(req: AuthRequest, res: Response) {
    try {
      const { cartId } = req.params;
      
      const cart = await cartService.removeCoupon(parseInt(cartId));
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error removing coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove coupon'
      });
    }
  },

  // Merge guest cart after login
  async mergeCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!userId || !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'User ID and session ID are required'
        });
      }
      
      const cart = await cartService.mergeGuestCart(sessionId, userId);
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error merging cart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to merge cart'
      });
    }
  }
};