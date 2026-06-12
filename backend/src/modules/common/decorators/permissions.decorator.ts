import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

/**
 * Requires the user to have AT LEAST ONE of the provided permissions.
 * The 'ADMIN' system role bypasses this check completely.
 * 
 * @param permissions Array of permission strings required to access the endpoint
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
