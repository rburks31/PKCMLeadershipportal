import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Church, Play, Users, Award, BookOpen, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Church className="text-pastoral-blue text-2xl" />
              <span className="text-xl font-bold text-gray-900">PKCM Leadership and Ministry Class</span>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-pastoral-blue hover:bg-blue-600"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pastoral-blue to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Equip Leaders. Transform Lives.
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Comprehensive training in discipleship and leadership at Promise Kingdom Community Ministries, empowering every follower of Jesus to grow in faith, live out biblical truth, and multiply kingdom impact in their communities.
            </p>
            <Button 
              size="lg" 
              className="bg-pastoral-green hover:bg-green-600 text-lg px-8 py-4"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            What You'll Experience
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="card-feature-video">
              <CardHeader>
                <Play className="w-12 h-12 text-pastoral-blue mb-4" />
                <CardTitle>Video Lessons</CardTitle>
                <CardDescription>
                  High-quality video content from experienced ministry leaders and biblical scholars.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card data-testid="card-feature-progress">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-pastoral-green mb-4" />
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Monitor your learning journey with detailed progress tracking and completion certificates.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card data-testid="card-feature-community">
              <CardHeader>
                <Users className="w-12 h-12 text-pastoral-gold mb-4" />
                <CardTitle>Community Discussion</CardTitle>
                <CardDescription>
                  Connect with fellow pastors and leaders in meaningful discussions and prayer support.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Featured Course
          </h2>
          <Card className="max-w-4xl mx-auto" data-testid="card-featured-course">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    Leadership & Deliverance Training
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Master the fundamentals of biblical leadership and spiritual deliverance ministry
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-pastoral-blue">
                  Popular
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-pastoral-gray" />
                  <span className="text-pastoral-gray">12 hours content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-pastoral-gray" />
                  <span className="text-pastoral-gray">24 lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-pastoral-gray" />
                  <span className="text-pastoral-gray">Certificate included</span>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                This comprehensive course covers biblical principles of leadership, understanding spiritual warfare, 
                and practical deliverance ministry. Learn from experienced pastors and biblical scholars as you 
                develop the skills needed for effective kingdom leadership.
              </p>
              <Button 
                className="bg-pastoral-blue hover:bg-blue-600"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-preview-course"
              >
                Preview Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-pastoral-blue text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Ministry?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of pastors and ministry leaders who are growing in their calling through 
            our biblical training programs.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-pastoral-blue hover:bg-gray-100 text-lg px-8 py-4"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-join-now"
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Church className="text-pastoral-blue text-2xl" />
            <span className="text-xl font-bold">PKCM Leadership and Ministry Class</span>
          </div>
          <p className="text-gray-400">
            Promise Kingdom Community Ministries - Equipping leaders for kingdom impact through biblical education and community.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 Promise Kingdom Community Ministries. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
