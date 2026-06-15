import os

file_path_1 = "/Volumes/NIKHIL/Study/frontend/src/app/(dashboard)/test-series/[seriesId]/page.tsx"
with open(file_path_1, "r") as f:
    content1 = f.read()

# Fix 'course' state variable name
content1 = content1.replace("const [course, setCourse] = useState", "const [series, setSeries] = useState")
content1 = content1.replace("setCourse(c)", "setSeries(c)")
content1 = content1.replace("setCourse(newCourse)", "setSeries(newCourse)")
content1 = content1.replace("if (!course ", "if (!series ")
content1 = content1.replace("if (!course)", "if (!series)")
content1 = content1.replace("fetchCourse", "fetchSeries")

# Also `CourseLeaderboard seriesId={seriesId}` -> `CourseLeaderboard courseId={seriesId}` since it expects courseId
content1 = content1.replace("<CourseLeaderboard seriesId={seriesId} />", "<CourseLeaderboard courseId={seriesId} />")
# And enroll function call
content1 = content1.replace("HierarchyService.enrollTestSeries(series.id)", "StudentService.enrollInTestSeries(series.id)")
content1 = content1.replace("StudentService.enrollInTestSeries(series.id)", "StudentService.enrollInTestSeries(series.id)")
content1 = content1.replace("await HierarchyService.enrollCourse", "await HierarchyService.enrollCourse") # Wait, if it was replaced with enrollTestSeries?
content1 = content1.replace("HierarchyService.enrollCourse(series.id)", "api.post(`/student/test-series/${series.id}/enroll`)")

# Add missing import for `api` if used
if "import { api }" not in content1:
    content1 = content1.replace("import { HierarchyService }", "import { api }\nimport { HierarchyService }")

with open(file_path_1, "w") as f:
    f.write(content1)

file_path_2 = "/Volumes/NIKHIL/Study/frontend/src/app/(dashboard)/test-series/page.tsx"
with open(file_path_2, "r") as f:
    content2 = f.read()

content2 = content2.replace("setEditingSeries(course)", "setEditingSeries(series)")

with open(file_path_2, "w") as f:
    f.write(content2)

print("Fix complete.")
