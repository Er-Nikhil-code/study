import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from "@nestjs/common";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.sub);
  }

  @Post("items")
  addToCart(@Request() req: any, @Body() data: { course_id: string }) {
    return this.cartService.addToCart(req.user.sub, data.course_id);
  }

  @Delete("items/:id")
  removeFromCart(@Request() req: any, @Param("id") id: string) {
    return this.cartService.removeFromCart(req.user.sub, id);
  }
}
