import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto/role.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("api/admin/roles")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles("ADMIN")
  async listRoles(
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 50;
    return this.rolesService.findAllRoles(skipNum, takeNum, search);
  }

  @Get("hierarchy")
  @Roles("ADMIN")
  async getHierarchy() {
    return this.rolesService.getHierarchyTree();
  }

  @Get(":id")
  @Roles("ADMIN")
  async getRoleById(@Param("id") id: string) {
    return this.rolesService.findRoleById(id);
  }

  @Post()
  @Roles("ADMIN")
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() body: any) {
    return this.rolesService.createRole(body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  async updateRole(@Param("id") id: string, @Body() body: any) {
    return this.rolesService.updateRole(id, body);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param("id") id: string) {
    await this.rolesService.deleteRole(id);
  }

  @Post("seed")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  async seedRoles() {
    await this.rolesService.seedDefaultRoles();
    return { message: "Default roles seeded successfully" };
  }

  @Post("assign")
  @Roles("ADMIN")
  @HttpCode(HttpStatus.OK)
  async assignRole(@Body() body: { user_id: string; role_name: string }) {
    return this.rolesService.assignRoleToUser(body.user_id, body.role_name);
  }
}
