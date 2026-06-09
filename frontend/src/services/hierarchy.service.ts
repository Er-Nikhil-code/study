import { api } from "@/lib/api";

export const HierarchyService = {
  getFullHierarchy() {
    return api.get("/admin/hierarchy").then((r) => r.data);
  },

  createCourse(data: { name: string; code: string }) {
    return api.post("/admin/hierarchy/courses", data).then((r) => r.data);
  },

  createSection(data: { course_id: string; name: string; order: number }) {
    return api.post("/admin/hierarchy/sections", data).then((r) => r.data);
  },

  createChapter(data: { section_id: string; name: string; order: number }) {
    return api.post("/admin/hierarchy/chapters", data).then((r) => r.data);
  },

  createTopic(data: { chapter_id: string; name: string; order: number }) {
    return api.post("/admin/hierarchy/topics", data).then((r) => r.data);
  }
};
