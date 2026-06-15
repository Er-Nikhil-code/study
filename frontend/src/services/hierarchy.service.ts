import { api } from "@/lib/api";

export const HierarchyService = {
  getFullHierarchy() {
    return api.get("/admin/hierarchy").then((r) => r.data);
  },

  getTestSeriesHierarchy() {
    return api.get("/admin/hierarchy/test-series").then((r) => r.data);
  },

  reorder(items: { id: string; type: 'SECTION' | 'CHAPTER' | 'TOPIC'; order: number }[]) {
    return api.post("/admin/hierarchy/reorder", items).then((r) => r.data);
  },

  createCourse(data: { name: string; code: string; description: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: string }) {
    return api.post("/admin/hierarchy/courses", data).then((r) => r.data);
  },

  createSection(data: { course_id?: string; test_series_id?: string; name: string; description: string; order: number }) {
    return api.post("/admin/hierarchy/sections", data).then((r) => r.data);
  },

  createChapter(data: { section_id: string; name: string; description: string; order: number }) {
    return api.post("/admin/hierarchy/chapters", data).then((r) => r.data);
  },

  createTopic(data: { chapter_id: string; name: string; description: string; order: number }) {
    return api.post("/admin/hierarchy/topics", data).then((r) => r.data);
  },

  updateCourse(id: string, data: { name?: string; code?: string; description?: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: string }) {
    return api.patch(`/admin/hierarchy/courses/${id}`, data).then((r) => r.data);
  },

  deleteCourse(id: string) {
    return api.delete(`/admin/hierarchy/courses/${id}`).then((r) => r.data);
  },

  deleteTestSeries(id: string) {
    return api.delete(`/admin/hierarchy/test-series/${id}`).then((r) => r.data);
  },

  enrollCourse(courseId: string) {
    return api.post(`/admin/hierarchy/courses/${courseId}/enroll`).then((r) => r.data);
  },

  getCourseEnrollments(courseId: string) {
    return api.get(`/admin/hierarchy/courses/${courseId}/enrollments`).then((r) => r.data);
  },

  getTestSeriesEnrollments(seriesId: string) {
    return api.get(`/admin/hierarchy/test-series/${seriesId}/enrollments`).then((r) => r.data);
  },

  updateSection(id: string, data: { name?: string; description?: string; order?: number }) {
    return api.patch(`/admin/hierarchy/sections/${id}`, data).then((r) => r.data);
  },

  updateChapter(id: string, data: { name?: string; description?: string; order?: number }) {
    return api.patch(`/admin/hierarchy/chapters/${id}`, data).then((r) => r.data);
  },

  updateTopic(id: string, data: { name?: string; description?: string; order?: number }) {
    return api.patch(`/admin/hierarchy/topics/${id}`, data).then((r) => r.data);
  },

  deleteSection(id: string) {
    return api.delete(`/admin/hierarchy/sections/${id}`).then((r) => r.data);
  },

  deleteChapter(id: string) {
    return api.delete(`/admin/hierarchy/chapters/${id}`).then((r) => r.data);
  },

  deleteTopic(id: string) {
    return api.delete(`/admin/hierarchy/topics/${id}`).then((r) => r.data);
  },

  markNotesViewed(topicId: string) {
    return api.post(`/admin/hierarchy/topics/${topicId}/view-notes`).then((r) => r.data);
  },

  assignCourseStaff(courseId: string, userId: string) {
    return api.post(`/admin/hierarchy/courses/${courseId}/staff`, { user_id: userId }).then(r => r.data);
  },

  removeCourseStaff(courseId: string, userId: string) {
    return api.delete(`/admin/hierarchy/courses/${courseId}/staff/${userId}`).then(r => r.data);
  },

  assignSectionManagers(sectionId: string, managerIds: string[]) {
    return api.patch(`/admin/hierarchy/sections/${sectionId}/assign`, { manager_ids: managerIds }).then(r => r.data);
  }
};
