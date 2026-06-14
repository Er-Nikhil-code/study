import { api } from "@/lib/api";

export const NotesService = {
  createNote(data: { topic_id: string; title: string; content_html: string }) {
    return api.post("/notes", data).then(res => res.data);
  },

  getById(id: string) {
    return api.get(`/notes/${id}`).then(res => res.data);
  },

  getMyNotes() {
    return api.get("/notes").then(res => res.data);
  },

  getPendingNotes() {
    return api.get("/notes/pending").then(res => res.data);
  },

  reviewNote(id: string, data: { status: "APPROVED" | "REJECTED"; rejection_note?: string; content_html?: string }) {
    return api.patch(`/notes/${id}/review`, data).then(res => res.data);
  },

  updateNote(id: string, data: { title?: string; content_html?: string; topic_id?: string }) {
    return api.patch(`/notes/${id}`, data).then(res => res.data);
  },

  getApprovedNotes(topicId: string) {
    return api.get(`/notes/topic/${topicId}`).then(res => res.data);
  },

  deleteNote(id: string) {
    return api.delete(`/notes/${id}`).then(res => res.data);
  }
};
