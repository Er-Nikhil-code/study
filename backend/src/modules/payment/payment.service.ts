import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { HierarchyService } from "../hierarchy/hierarchy.service";
import { BrevoService } from "../email/brevo.service";

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService,
    private brevoService: BrevoService
  ) {
    this.razorpay = new Razorpay({
      key_id: (process.env.RAZORPAY_KEY_ID || "test").trim(),
      key_secret: (process.env.RAZORPAY_KEY_SECRET || "test").trim(),
    });
  }

  async createOrder(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: { include: { course: true, test_series: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    let totalAmount = 0;
    cart.items.forEach((item) => {
      let price = 0;
      if (item.course) {
        price = item.course.discount_price ?? item.course.price ?? 0;
      } else if (item.test_series) {
        price = item.test_series.discount_price ?? item.test_series.price ?? 0;
      }
      totalAmount += price;
    });

    if (totalAmount === 0) {
      for (const item of cart.items) {
        if (item.course_id) {
          await this.hierarchyService.enrollCourse(item.course_id, userId);
        } else if (item.test_series_id) {
          const existing = await this.prisma.testSeriesEnrollment.findUnique({
            where: { user_id_test_series_id: { user_id: userId, test_series_id: item.test_series_id } }
          });
          if (!existing) {
            await this.prisma.testSeriesEnrollment.create({
              data: { user_id: userId, test_series_id: item.test_series_id }
            });
          }
        }
      }
      
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const itemsList = cart.items.map(i => ({
          name: i.course?.name || i.test_series?.name || "Unknown Item",
          price: 0
        }));
        const invoiceNumber = `INV-FREE-${Date.now()}`;
        
        this.brevoService.sendInvoiceEmail({
          email: user.email,
          firstName: user.first_name || "User",
          lastName: user.last_name,
          userId: user.id,
          phone: user.phone_number,
          invoiceNumber,
          amount: 0,
          date: new Date(),
          items: itemsList
        }).catch(err => console.error("Failed to send free invoice email", err));
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
            create: cart.items.map((i) => {
              let price_paid = 0;
              if (i.course) price_paid = i.course.discount_price ?? i.course.price ?? 0;
              else if (i.test_series) price_paid = i.test_series.discount_price ?? i.test_series.price ?? 0;
              
              return {
                course_id: i.course_id,
                test_series_id: i.test_series_id,
                price_paid,
              };
            }),
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
      include: { 
        items: { include: { course: true, test_series: true } },
        user: true 
      },
    });

    for (const item of order.items) {
      if (item.course_id) {
        await this.hierarchyService.enrollCourse(item.course_id, userId);
      } else if (item.test_series_id) {
        const existing = await this.prisma.testSeriesEnrollment.findUnique({
          where: { user_id_test_series_id: { user_id: userId, test_series_id: item.test_series_id } }
        });
        if (!existing) {
          await this.prisma.testSeriesEnrollment.create({
            data: { user_id: userId, test_series_id: item.test_series_id }
          });
        }
      }
    }

    await this.prisma.cart.delete({ where: { user_id: userId } });

    const invoice = await this.prisma.invoice.create({
      data: {
        order_id: order.id,
        invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    if (order.user) {
      const itemsList = order.items.map(i => ({
        name: i.course?.name || i.test_series?.name || "Unknown Item",
        price: i.price_paid
      }));

      this.brevoService.sendInvoiceEmail({
        email: order.user.email,
        firstName: order.user.first_name || "User",
        lastName: order.user.last_name,
        userId: order.user.id,
        phone: order.user.phone_number,
        invoiceNumber: invoice.invoice_number,
        amount: order.total_amount,
        date: order.created_at,
        items: itemsList
      }).catch(err => console.error("Failed to send invoice email", err));
    }

    return { success: true, orderId: order.id, invoice };
  }
}
