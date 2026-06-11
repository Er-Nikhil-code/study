export const getChessRoleName = (role: string | undefined): string => {
  if (!role) return "User";
  switch (role.toUpperCase()) {
    case "INTERN": return "Pawn";
    case "TEACHER": return "Knight";
    case "ADMIN": return "King";
    case "STUDENT": return "Student";
    default: return role;
  }
};
