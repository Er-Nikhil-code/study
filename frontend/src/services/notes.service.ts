import { api } from "@/lib/api";

export const NotesService = {
  createNote(data: { topic_id: string; title: string; pdf_url: string }) {
    return api.post("/notes", data).then(res => res.data);
  },

  getById(id: string) {
    return api.get(`/notes/${id}`).then(res => res.data);
  },

  getMyNotes() {
    return api.get("/notes").then(res => res.data);
  },

  updateNote(id: string, data: { title?: string; pdf_url?: string; topic_id?: string }) {
    return api.patch(`/notes/${id}`, data).then(res => res.data);
  },

  getNotesByTopic(topicId: string) {
    return api.get(`/notes/topic/${topicId}`).then(res => res.data);
  },

  deleteNote(id: string) {
    return api.delete(`/notes/${id}`).then(res => res.data);
  }
};
