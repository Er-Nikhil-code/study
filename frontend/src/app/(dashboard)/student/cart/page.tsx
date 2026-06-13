"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { CartService } from "@/services/cart.service";
import { PaymentService } from "@/services/payment.service";
import { Trash2, CreditCard, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import authService from "@/services/auth.service";

export default function CartPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => CartService.getCart(),
  });

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setProcessing(false);
        return;
      }

      const orderData = await PaymentService.createOrder();

      if (orderData.free) {
        alert("Courses enrolled successfully!");
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        router.push("/student/dashboard");
        return;
      }

      const keyData = await PaymentService.getKey();
      const user = authService.getUser();
      const options = {
        key: keyData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CODIFY",
        description: "Course Enrollment",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            await PaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert("Payment successful! You are now enrolled.");
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            router.push("/student/dashboard");
          } catch (e) {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Student",
          email: user?.email || "",
          contact: " ", // Use a single space to prevent Razorpay from falling back to browser cookies while keeping the box visually empty
        },
        theme: {
          color: "#EF4444",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to initiate checkout");
    } finally {
      setProcessing(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      await CartService.removeFromCart(id);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (e) {
      alert("Failed to remove item");
    }
  };

  const items = cart?.items || [];
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.course.discount_price ?? item.course.price ?? 0), 0);

  return (
    <>
      <SectionTitle title="Your Cart" subtitle="Review your selected courses before checkout" />

      {isLoading ? (
        <div className="mt-6 text-zinc-500">Loading cart...</div>
      ) : items.length === 0 ? (
        <Panel className="mt-6 text-center py-12 border-dashed border-white/10">
          <ShoppingCart size={32} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-500">Your cart is empty.</p>
          <button onClick={() => router.push("/courses")} className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition">
            Explore Courses
          </button>
        </Panel>
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              const priceToPay = item.course.discount_price ?? item.course.price ?? 0;
              return (
                <Panel key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-red-500/30 transition group">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{item.course.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2 max-w-md">{item.course.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      {item.course.discount_price > 0 && (
                        <div className="text-xs line-through text-zinc-500">₹{item.course.price}</div>
                      )}
                      <div className="font-bold text-emerald-400 text-lg">₹{priceToPay}</div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-zinc-500 hover:text-red-500 transition rounded-full hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Panel>
              );
            })}
          </div>

          <div>
            <Panel className="sticky top-6 border border-red-500/20 bg-black/40">
              <h3 className="font-semibold text-white mb-4 text-lg border-b border-white/10 pb-3">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Courses ({items.length})</span>
                  <span className="text-zinc-200">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
                <hr className="border-white/10 my-4" />
                <div className="flex justify-between text-white font-bold text-xl">
                  <span>Total</span>
                  <span className="text-emerald-400">₹{totalAmount}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-500 hover:to-red-400 disabled:opacity-50 transition active:scale-[0.98]"
              >
                <CreditCard size={18} />
                {processing ? "Processing..." : `Checkout ₹${totalAmount}`}
              </button>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
