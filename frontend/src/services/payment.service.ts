import { api } from "@/lib/api";

export const PaymentService = {
  createOrder() {
    return api.post("/payment/create-order").then((r) => r.data);
  },
  verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return api.post("/payment/verify", data).then((r) => r.data);
  }
};
