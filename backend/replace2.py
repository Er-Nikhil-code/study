import os

file_path = "/Volumes/NIKHIL/Study/frontend/src/app/(dashboard)/test-series/[seriesId]/page.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace identifiers and text
content = content.replace("courseId", "seriesId")
content = content.replace("course_id", "test_series_id")
content = content.replace("course.", "series.")
content = content.replace("course?.id", "series?.id")
content = content.replace("course?", "series?")
content = content.replace("course!", "series!")
content = content.replace("CourseDetail", "TestSeriesDetail")
content = content.replace("courseData", "seriesData")
content = content.replace("setCourseData", "setSeriesData")
content = content.replace("course data", "test series data")

# Update HierarchyService bindings
content = content.replace("HierarchyService.getCourseEnrollments", "HierarchyService.getTestSeriesEnrollments")
content = content.replace("HierarchyService.assignCourseStaff", "AdminTestSeriesService.assignTestSeriesStaff")
content = content.replace("HierarchyService.removeCourseStaff", "AdminTestSeriesService.removeTestSeriesStaff")

# Labels
content = content.replace("Course Status", "Test Series Status")
content = content.replace("Course Settings", "Test Series Settings")
content = content.replace("Back to Courses", "Back to Test Series")
content = content.replace("href=\"/courses\"", "href=\"/test-series\"")

# Handle API calls inside components, such as HierarchyBuilder
content = content.replace("await HierarchyService.getFullHierarchy()", "await HierarchyService.getTestSeriesHierarchy()")
content = content.replace("import { HierarchyService }", "import { HierarchyService }\nimport { AdminTestSeriesService } from \"@/services/test-series.admin.service\";")

with open(file_path, "w") as f:
    f.write(content)

print("Replacement 2 complete.")
