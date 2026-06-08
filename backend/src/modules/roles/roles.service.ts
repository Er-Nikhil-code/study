import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoleDtoType, UpdateRoleDtoType } from "./dto/role.dto";

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private prisma: PrismaService) {}

  async createRole(data: CreateRoleDtoType & {
    designation?: string;
    level?: number;
    parent_id?: string;
  }) {
    const existing = await this.prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestException(`Role "${data.name}" already exists`);
    }

    // Validate parent exists if specified
    if (data.parent_id) {
      const parent = await this.prisma.role.findUnique({
        where: { id: data.parent_id },
      });
      if (!parent) throw new NotFoundException("Parent role not found");
    }

    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description || "",
        designation: data.designation || "",
        level: data.level ?? 0,
        parent_id: data.parent_id || null,
        permissions_json: data.permissions || [],
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });
  }

  async findAllRoles(skip = 0, take = 50, search?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { level: "asc" },
        include: {
          parent: { select: { id: true, name: true, designation: true } },
          children: {
            select: { id: true, name: true, designation: true, level: true },
            orderBy: { level: "asc" },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return { data: roles, total, skip, take };
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, designation: true } },
        children: {
          select: { id: true, name: true, designation: true, level: true },
          orderBy: { level: "asc" },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  async getHierarchyTree() {
    // Get all roles and build a tree
    const allRoles = await this.prisma.role.findMany({
      orderBy: { level: "asc" },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true, designation: true, level: true },
        },
      },
    });

    // Count users per role
    const userCounts = await this.prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });
    const countMap: Record<string, number> = {};
    for (const uc of userCounts) {
      countMap[uc.role] = uc._count.id;
    }

    // Build tree from root nodes (no parent)
    const rootRoles = allRoles.filter((r) => !r.parent_id);
    const buildTree = (role: any): any => ({
      ...role,
      user_count: countMap[role.name] || 0,
      children: allRoles
        .filter((r) => r.parent_id === role.id)
        .map(buildTree),
    });

    return rootRoles.map(buildTree);
  }

  async updateRole(
    id: string,
    data: UpdateRoleDtoType & {
      designation?: string;
      level?: number;
      parent_id?: string | null;
    },
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role with ID "${id}" not found`);

    // Check name conflict
    if (data.name && data.name !== role.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new BadRequestException(`Role "${data.name}" already exists`);
      }
    }

    // Validate parent (prevent circular)
    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (data.parent_id === id) {
        throw new BadRequestException("A role cannot be its own parent");
      }
      const parent = await this.prisma.role.findUnique({
        where: { id: data.parent_id },
      });
      if (!parent) throw new NotFoundException("Parent role not found");
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name || undefined,
        description:
          data.description !== undefined ? data.description : undefined,
        designation:
          data.designation !== undefined ? data.designation : undefined,
        level: data.level !== undefined ? data.level : undefined,
        parent_id: data.parent_id !== undefined ? data.parent_id : undefined,
        permissions_json:
          data.permissions !== undefined ? data.permissions : undefined,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!role) throw new NotFoundException(`Role with ID "${id}" not found`);

    if (["STUDENT", "TEACHER", "ADMIN"].includes(role.name)) {
      throw new BadRequestException(
        `Cannot delete system role "${role.name}"`,
      );
    }

    // Re-parent children to this role's parent
    if (role.children.length > 0) {
      await this.prisma.role.updateMany({
        where: { parent_id: id },
        data: { parent_id: role.parent_id },
      });
    }

    return this.prisma.role.delete({ where: { id } });
  }

  /* ── Assign role to user ── */
  async assignRoleToUser(userId: string, roleName: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    // Validate roleName matches an enum value
    const validRoles = ["STUDENT", "INTERN", "PENDING_TEACHER", "TEACHER", "ADMIN"];
    if (!validRoles.includes(roleName)) {
      throw new BadRequestException(
        `"${roleName}" is a custom role. Use a system role: ${validRoles.join(", ")}`,
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: roleName as any },
    });
  }

  async seedDefaultRoles() {
    const defaultRoles = [
      {
        name: "ADMIN",
        description: "Full platform administration",
        designation: "Administrator",
        level: 0,
        permissions: [
          "manage_users", "manage_roles", "manage_questions", "manage_tests",
          "approve_teachers", "manage_challenges", "view_audit_logs",
          "system_health", "manage_hierarchy",
        ],
      },
      {
        name: "TEACHER",
        description: "Creates and manages content, reviews challenges",
        designation: "Teacher",
        level: 1,
        parent_name: "ADMIN",
        permissions: [
          "create_question", "edit_question", "delete_question",
          "create_test", "edit_test", "publish_test",
          "review_challenge", "approve_question",
        ],
      },
      {
        name: "INTERN",
        description: "Creates questions pending teacher approval",
        designation: "Content Intern",
        level: 2,
        parent_name: "TEACHER",
        permissions: ["create_question", "edit_own_question"],
      },
      {
        name: "STUDENT",
        description: "Takes tests and views results",
        designation: "Student",
        level: 3,
        permissions: ["take_test", "view_results", "submit_challenge"],
      },
    ];

    let adminRole: any = null;
    let teacherRole: any = null;

    for (const roleData of defaultRoles) {
      const existing = await this.prisma.role.findUnique({
        where: { name: roleData.name },
      });

      let parentId: string | null = null;
      if (roleData.parent_name === "ADMIN" && adminRole) parentId = adminRole.id;
      if (roleData.parent_name === "TEACHER" && teacherRole) parentId = teacherRole.id;

      if (!existing) {
        const created = await this.prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            designation: roleData.designation,
            level: roleData.level,
            parent_id: parentId,
            permissions_json: roleData.permissions,
          },
        });
        if (roleData.name === "ADMIN") adminRole = created;
        if (roleData.name === "TEACHER") teacherRole = created;
      } else {
        // Update existing with new fields
        const updated = await this.prisma.role.update({
          where: { id: existing.id },
          data: {
            designation: roleData.designation,
            level: roleData.level,
            parent_id: parentId,
          },
        });
        if (roleData.name === "ADMIN") adminRole = updated;
        if (roleData.name === "TEACHER") teacherRole = updated;
      }
    }

    this.logger.log("✅ Default roles seeded with hierarchy");
  }
}
