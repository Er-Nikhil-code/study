import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoleDtoType, UpdateRoleDtoType } from "./dto/role.dto";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(data: CreateRoleDtoType) {
    // Check if role already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestException(`Role "${data.name}" already exists`);
    }

    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description || "",
        permissions_json: data.permissions || [],
      },
    });
  }

  async findAllRoles(skip = 0, take = 20, search?: string) {
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data: roles,
      total,
      skip,
      take,
    };
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  async updateRole(id: string, data: UpdateRoleDtoType) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    // Check if new name conflicts with another role
    if (data.name && data.name !== role.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new BadRequestException(`Role "${data.name}" already exists`);
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name || undefined,
        description: data.description || undefined,
        permissions_json:
          data.permissions !== undefined ? data.permissions : undefined,
      },
    });
  }

  async deleteRole(id: string) {
    // Prevent deleting default system roles
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    if (["STUDENT", "TEACHER", "ADMIN"].includes(role.name)) {
      throw new BadRequestException(`Cannot delete system role "${role.name}"`);
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }

  async seedDefaultRoles() {
    const defaultRoles = [
      {
        name: "STUDENT",
        description: "Student role for taking tests",
        permissions: ["take_test", "view_results", "submit_challenge"],
      },
      {
        name: "TEACHER",
        description: "Teacher role for creating content",
        permissions: [
          "create_question",
          "edit_question",
          "delete_question",
          "create_test",
          "edit_test",
          "publish_test",
          "review_challenge",
        ],
      },
      {
        name: "ADMIN",
        description: "Admin role for system management",
        permissions: [
          "manage_users",
          "manage_roles",
          "manage_questions",
          "manage_tests",
          "approve_teachers",
          "manage_challenges",
          "view_audit_logs",
          "system_health",
        ],
      },
    ];

    for (const roleData of defaultRoles) {
      const existing = await this.prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existing) {
        await this.prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            permissions_json: roleData.permissions,
          },
        });
      }
    }
  }
}
