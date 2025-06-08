import { Request, Response } from 'express';
import productService from '@services/product.service';
import { logger } from '@utils/logger';

export const productController = {
  // Get all active products
  async getProducts(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const products = await productService.getAllProducts(includeInactive);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products'
      });
    }
  },

  // Get single product by ID
  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(parseInt(id));
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product'
      });
    }
  },

  // Get products by category
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const products = await productService.getProductsByCategory(category as any);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Error fetching products by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products'
      });
    }
  },

  // Get featured products
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      const products = await productService.getFeaturedProducts();
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Error fetching featured products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured products'
      });
    }
  }
};