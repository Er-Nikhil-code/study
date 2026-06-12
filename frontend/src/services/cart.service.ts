import { api } from "@/lib/api";

export const CartService = {
  getCart() {
    return api.get("/cart").then((r) => r.data);
  },
  addToCart(courseId: string) {
    return api.post("/cart/items", { course_id: courseId }).then((r) => r.data);
  },
  removeFromCart(cartItemId: string) {
    return api.delete(`/cart/items/${cartItemId}`).then((r) => r.data);
  }
};
