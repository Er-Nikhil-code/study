export const PERMISSIONS = {
  // AI Features
  USE_AI_GENERATOR: "use_ai_generator",
  CHAT_WITH_AI: "chat_with_ai",

  // Content & Hierarchy
  MANAGE_HIERARCHY: "manage_hierarchy",
  CREATE_NOTES: "create_notes",
  REVIEW_NOTES: "review_notes",

  // Questions
  CREATE_QUESTION: "create_question",
  EDIT_QUESTION: "edit_question",
  EDIT_OWN_QUESTION: "edit_own_question",
  DELETE_QUESTION: "delete_question",
  APPROVE_QUESTION: "approve_question",
  MANAGE_QUESTIONS: "manage_questions", // Catch-all for questions

  // Tests
  CREATE_TEST: "create_test",
  EDIT_TEST: "edit_test",
  PUBLISH_TEST: "publish_test",
  MANAGE_TESTS: "manage_tests", // Catch-all for tests

  // Challenges
  SUBMIT_CHALLENGE: "submit_challenge",
  REVIEW_CHALLENGE: "review_challenge",
  MANAGE_CHALLENGES: "manage_challenges",

  // User Management
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  APPROVE_TEACHERS: "approve_teachers",

  // System
  VIEW_AUDIT_LOGS: "view_audit_logs",
  SYSTEM_HEALTH: "system_health",

  // Student specific
  TAKE_TEST: "take_test",
  VIEW_RESULTS: "view_results",
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];
