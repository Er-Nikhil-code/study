import { z } from "zod";

export const CreateRoleDto = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(50, "Role name must be less than 50 characters"),
  description: z.string().optional().default(""),
  permissions: z.array(z.string()).optional().default([]),
});

export type CreateRoleDtoType = z.infer<typeof CreateRoleDto>;

export const UpdateRoleDto = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(50, "Role name must be less than 50 characters")
    .optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export type UpdateRoleDtoType = z.infer<typeof UpdateRoleDto>;
