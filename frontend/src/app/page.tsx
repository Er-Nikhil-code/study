import Link from "next/link";
import { BookOpen, Users, Award } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Study Platform</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Learn and Teach with Confidence
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Join thousands of students and teachers using Study Platform to
          achieve academic excellence through interactive learning and
          comprehensive exam preparation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started Free
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Why Choose Study Platform?
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-blue-600 transition">
              <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Comprehensive Content
              </h4>
              <p className="text-gray-700">
                Access thousands of practice questions, detailed explanations,
                and learning materials across all subjects.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-blue-600 transition">
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Expert Instructors
              </h4>
              <p className="text-gray-700">
                Learn from experienced teachers who provide guidance, feedback,
                and support throughout your learning journey.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-blue-600 transition">
              <Award className="w-12 h-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Track Progress
              </h4>
              <p className="text-gray-700">
                Monitor your performance with detailed analytics and get
                personalized recommendations for improvement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Study Platform. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
