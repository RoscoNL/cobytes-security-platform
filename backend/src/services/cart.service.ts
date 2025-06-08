import { AppDataSource } from '../config/typeorm';
import { Cart, CartStatus } from '../models/cart.model';
import { CartItem } from '../models/cartItem.model';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

interface AddToCartDto {
  productId: number;
  quantity: number;
  configuration?: any;
}

class CartService {
  private get cartRepository() {
    return AppDataSource.getRepository(Cart);
  }

  private get cartItemRepository() {
    return AppDataSource.getRepository(CartItem);
  }

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  async getOrCreateCart(userId?: number, sessionId?: string): Promise<Cart> {
    let cart: Cart | null = null;

    // Try to find existing cart
    if (userId) {
      cart = await this.cartRepository.findOne({
        where: { user: { id: userId }, status: CartStatus.ACTIVE },
        relations: ['items', 'items.product', 'user']
      });
    } else if (sessionId) {
      cart = await this.cartRepository.findOne({
        where: { session_id: sessionId, status: CartStatus.ACTIVE },
        relations: ['items', 'items.product']
      });
    }

    // Create new cart if not found
    if (!cart) {
      cart = this.cartRepository.create({
        session_id: sessionId,
        user: userId ? { id: userId } as User : undefined,
        items: [],
        status: CartStatus.ACTIVE
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: number | undefined, sessionId: string | undefined, data: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const product = await this.productRepository.findOne({ where: { id: data.productId, is_active: true } });

    if (!product) {
      throw new Error('Product not found or inactive');
    }

    // Check if item already exists in cart
    let cartItem = cart.items.find(item => item.product.id === product.id);

    if (cartItem) {
      // Update quantity
      cartItem.quantity += data.quantity;
      cartItem.price = product.price; // Update to current price
      await this.cartItemRepository.save(cartItem);
    } else {
      // Add new item
      cartItem = this.cartItemRepository.create({
        cart: cart,
        product: product,
        quantity: data.quantity,
        price: product.price,
        configuration: data.configuration
      });
      await this.cartItemRepository.save(cartItem);
      cart.items.push(cartItem);
    }

    // Recalculate totals
    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return this.getCart(cart.id);
  }

  async updateCartItem(cartId: number, itemId: number, quantity: number): Promise<Cart> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { id: cartId } },
      relations: ['cart']
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
      await this.cartItemRepository.remove(cartItem);
    } else {
      cartItem.quantity = quantity;
      await this.cartItemRepository.save(cartItem);
    }

    const cart = await this.getCart(cartId);
    cart.calculateTotals();
    await this.cartRepository.save(cart);

    return cart;
  }

  async removeFromCart(cartId: number, itemId: number): Promise<Cart> {
    return this.updateCartItem(cartId, itemId, 0);
  }

  async getCart(cartId: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product', 'user']
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    return cart;
  }

  async clearCart(cartId: number): Promise<void> {
    await this.cartItemRepository.delete({ cart: { id: cartId } });
    const cart = await this.getCart(cartId);
    cart.calculateTotals();
    await this.cartRepository.save(cart);
  }

  async mergeGuestCart(sessionId: string, userId: number): Promise<Cart> {
    const guestCart = await this.cartRepository.findOne({
      where: { session_id: sessionId, status: CartStatus.ACTIVE },
      relations: ['items', 'items.product']
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      await this.addToCart(userId, undefined, {
        productId: guestItem.product.id,
        quantity: guestItem.quantity,
        configuration: guestItem.configuration
      });
    }

    // Mark guest cart as converted
    guestCart.status = CartStatus.CONVERTED;
    await this.cartRepository.save(guestCart);

    return this.getCart(userCart.id);
  }

  async applyCoupon(cartId: number, couponCode: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    
    // TODO: Implement coupon validation and discount calculation
    // For now, apply a fixed 10% discount
    cart.coupon_code = couponCode;
    cart.discount_amount = cart.subtotal * 0.1;
    cart.calculateTotals();
    
    await this.cartRepository.save(cart);
    return cart;
  }

  async removeCoupon(cartId: number): Promise<Cart> {
    const cart = await this.getCart(cartId);
    cart.coupon_code = null as any;
    cart.discount_amount = 0;
    cart.calculateTotals();
    
    await this.cartRepository.save(cart);
    return cart;
  }
}

export default new CartService();