import { api } from "@/lib/api";

export const AdminTestSeriesService = {
  getAdminTestSeries() {
    return api.get("/tests/series/manage").then((r) => r.data);
  },

  getTestSeriesDetail(id: string) {
    return api.get(`/tests/series/${id}`).then((r) => r.data);
  },

  createTestSeries(data: { name: string; description: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: string }) {
    return api.post("/tests/series", data).then((r) => r.data);
  },

  updateTestSeries(id: string, data: { name?: string; description?: string; price?: number; discount_price?: number; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; launch_date?: string }) {
    return api.patch(`/tests/series/${id}`, data).then((r) => r.data);
  },

  deleteTestSeries(id: string) {
    return api.delete(`/tests/series/${id}`).then((r) => r.data);
  },

  assignTestSeriesStaff(seriesId: string, userId: string) {
    return api.post(`/tests/series/${seriesId}/staff`, { user_id: userId }).then((r) => r.data);
  },

  removeTestSeriesStaff(seriesId: string, userId: string) {
    return api.delete(`/tests/series/${seriesId}/staff/${userId}`).then((r) => r.data);
  },

  addTestsToSeries(seriesId: string, testIds: string[]) {
    return api.post(`/tests/series/${seriesId}/tests`, { test_ids: testIds }).then((r) => r.data);
  },

  removeTestFromSeries(seriesId: string, testId: string) {
    return api.delete(`/tests/series/${seriesId}/tests/${testId}`).then((r) => r.data);
  }
};
