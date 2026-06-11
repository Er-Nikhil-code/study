import {
  Controller,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { TeacherService } from "./teacher.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("teacher")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("TEACHER", "ADMIN")
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  @Get("interns")
  async getInterns(@Request() req: any) {
    return this.teacherService.getInterns(req.user.sub);
  }
}
