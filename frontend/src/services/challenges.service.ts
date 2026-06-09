import { api } from "@/lib/api";

export const ChallengesService = {
  getAssignedChallenges(params?: { status?: string; skip?: number; take?: number }) {
    return api.get("/challenges/assigned", { params }).then(res => res.data);
  },

  resolveChallenge(id: string, data: {
    action: "ACCEPT" | "REJECT" | "REVISE_SOLUTION" | "REVISE_ANSWER_KEY" | "ESCALATE" | "FORWARD_TO_INTERN";
    resolution_note?: string;
    revised_answer_key?: any;
    revised_solution_json?: any;
  }) {
    return api.post(`/challenges/${id}/resolve`, data).then(res => res.data);
  }
};
