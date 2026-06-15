import os

file_path = "/Volumes/NIKHIL/Study/frontend/src/app/(dashboard)/test-series/page.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace variables and paths
content = content.replace("HierarchyService.getFullHierarchy()", "HierarchyService.getTestSeriesHierarchy()")
content = content.replace("queryKey: [\"courses\", \"hierarchy\"]", "queryKey: [\"test-series\", \"hierarchy\"]")
content = content.replace("courses = []", "testSeries = []")
content = content.replace("creatingCourse", "creatingSeries")
content = content.replace("setCreatingCourse", "setCreatingSeries")
content = content.replace("editingCourse", "editingSeries")
content = content.replace("setEditingCourse", "setEditingSeries")
content = content.replace("course.is_enrolled", "series.is_enrolled")
content = content.replace("course.name", "series.name")
content = content.replace("course.code", "series.code")
content = content.replace("course.description", "series.description")
content = content.replace("course.price", "series.price")
content = content.replace("course.discount_price", "series.discount_price")
content = content.replace("course.status", "series.status")
content = content.replace("course.launch_date", "series.launch_date")
content = content.replace("course.created_by", "series.created_by")
content = content.replace("course.id", "series.id")
content = content.replace("course.enrollment_count", "series.enrollment_count")
content = content.replace("course.sections", "series.sections")
content = content.replace("course.enrolled_at", "series.enrolled_at")
content = content.replace("course_id", "test_series_id")
content = content.replace("courses.length", "testSeries.length")
content = content.replace("courses.map", "testSeries.map")
content = content.replace("sortedCourses", "sortedTestSeries")
content = content.replace("courses]", "testSeries]")
content = content.replace("(course: any)", "(series: any)")
content = content.replace("course =>", "series =>")

content = content.replace("Available Courses", "Available Test Series")
content = content.replace("Select a course", "Select a test series")
content = content.replace("Create New Course", "Create New Test Series")
content = content.replace("Course Name", "Test Series Name")
content = content.replace("Course Code", "Test Series Code")
content = content.replace("Create Course", "Create Test Series")
content = content.replace("Edit Course", "Edit Test Series")
content = content.replace("No courses available yet.", "No test series available yet.")
content = content.replace("Add a new course to your curriculum.", "Add a new test series to your curriculum.")
content = content.replace("Course description", "Test series description")
content = content.replace("Enter course description...", "Enter test series description...")

content = content.replace("`/courses/${course.id}`", "`/test-series/${series.id}`")
content = content.replace("Failed to load courses.", "Failed to load test series.")
content = content.replace("Failed to create course", "Failed to create test series")
content = content.replace("Failed to update course", "Failed to update test series")

content = content.replace("HierarchyService.createCourse", "AdminTestSeriesService.createTestSeries")
content = content.replace("HierarchyService.updateCourse", "AdminTestSeriesService.updateTestSeries")
content = content.replace("import { HierarchyService }", "import { HierarchyService }\nimport { AdminTestSeriesService } from \"@/services/test-series.admin.service\";")
content = content.replace("CoursesPage", "TestSeriesPage")

with open(file_path, "w") as f:
    f.write(content)

print("Replacement complete.")
