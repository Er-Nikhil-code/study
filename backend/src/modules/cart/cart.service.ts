import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: { include: { course: true } } }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { user_id: userId },
        include: { items: { include: { course: true } } }
      });
    }
    return cart;
  }

  async addToCart(userId: string, courseId: string) {
    const cart = await this.getCart(userId);
    
    // Check if already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cart_id_course_id: { cart_id: cart.id, course_id: courseId } }
    });

    if (existingItem) {
      return cart;
    }

    await this.prisma.cartItem.create({
      data: { cart_id: cart.id, course_id: courseId }
    });

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, cartItemId: string) {
    const cart = await this.getCart(userId);
    
    await this.prisma.cartItem.deleteMany({
      where: { id: cartItemId, cart_id: cart.id }
    });

    return this.getCart(userId);
  }
}
