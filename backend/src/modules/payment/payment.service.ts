import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { HierarchyService } from "../hierarchy/hierarchy.service";

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "test",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
    });
  }

  async createOrder(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: { include: { course: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    let totalAmount = 0;
    cart.items.forEach((item) => {
      const price = item.course.discount_price ?? item.course.price ?? 0;
      totalAmount += price;
    });

    if (totalAmount === 0) {
      for (const item of cart.items) {
        await this.hierarchyService.enrollCourse(item.course_id, userId);
      }
      await this.prisma.cart.delete({ where: { user_id: userId } });
      return { free: true, orderId: null, amount: 0 };
    }

    try {
      const razorpayOrder = await this.razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // in paise
        currency: "INR",
        receipt: `rcpt_${userId.slice(-10)}_${Date.now().toString().slice(-6)}`,
      });

      const order = await this.prisma.order.create({
        data: {
          user_id: userId,
          total_amount: totalAmount,
          razorpay_order_id: razorpayOrder.id,
          status: "PENDING",
          items: {
            create: cart.items.map((i) => ({
              course_id: i.course_id,
              price_paid: i.course.discount_price ?? i.course.price ?? 0,
            })),
          },
        },
      });

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        dbOrderId: order.id,
      };
    } catch (error: any) {
      console.error("Razorpay Create Order Error:", error);
      throw new BadRequestException(error.message || "Failed to create Razorpay order");
    }

  }

  async verifyPayment(userId: string, data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestException("Invalid payment signature");
    }

    const order = await this.prisma.order.update({
      where: { razorpay_order_id },
      data: {
        status: "COMPLETED",
        razorpay_payment_id,
        razorpay_signature,
      },
      include: { items: true },
    });

    for (const item of order.items) {
      await this.hierarchyService.enrollCourse(item.course_id, userId);
    }

    await this.prisma.cart.delete({ where: { user_id: userId } });

    const invoice = await this.prisma.invoice.create({
      data: {
        order_id: order.id,
        invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    return { success: true, orderId: order.id, invoice };
  }
}
