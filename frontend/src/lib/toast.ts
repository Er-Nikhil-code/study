import { toast } from "sonner";

export const notify = {
  loginSuccess() {
    toast.success("Logged in successfully");
  },

  logoutSuccess() {
    toast.success("Logged out successfully");
  },

  profileUpdated() {
    toast.success("Profile updated");
  },

  testSubmitted() {
    toast.success("Test submitted successfully");
  },

  challengeCreated() {
    toast.success("Challenge submitted");
  },

  teacherApproved() {
    toast.success("Teacher approved");
  },

  apiError() {
    toast.error("Something went wrong");
  },

  networkError() {
    toast.error("Network connection lost");
  },
};
