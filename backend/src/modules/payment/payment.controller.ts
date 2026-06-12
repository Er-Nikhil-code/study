import { Controller, Get, Post, Body, UseGuards, Request } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller("payment")
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get("key")
  getKey() {
    return { key: process.env.RAZORPAY_KEY_ID || "test" };
  }

  @Post("create-order")
  createOrder(@Request() req: any) {
    return this.paymentService.createOrder(req.user.sub);
  }

  @Post("verify")
  verifyPayment(
    @Request() req: any,
    @Body() data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) {
    return this.paymentService.verifyPayment(req.user.sub, data);
  }
}
