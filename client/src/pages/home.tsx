import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { Play, Clock, BookOpen, Users, Award } from "lucide-react";

export default function Home() {
  const { data: myCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/my-courses"],
  });

  const { data: allCourses, isLoading: allCoursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-welcome">
            Welcome to PKCM Leadership and Ministry Class
          </h1>
          <p className="text-pastoral-gray">
            Continue growing in discipleship and leadership, empowering you to multiply kingdom impact in your community.
          </p>
        </div>

        {/* My Courses Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6" data-testid="text-my-courses">
            My Courses
          </h2>
          
          {coursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} data-testid={`skeleton-course-${i}`}>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myCourses && Array.isArray(myCourses) && myCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(myCourses as any[]).map((enrollment: any) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow" data-testid={`card-enrolled-course-${enrollment.course.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-pastoral-blue">
                        Enrolled
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                    <CardDescription>{enrollment.course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-pastoral-gray">Progress</span>
                          <span className="font-medium text-pastoral-green">0%</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-pastoral-gray">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>0 lessons completed</span>
                        </span>
                      </div>
                      <Link href={`/courses/${enrollment.course.id}`}>
                        <Button className="w-full bg-pastoral-blue hover:bg-blue-600" data-testid={`button-continue-course-${enrollment.course.id}`}>
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card data-testid="card-no-enrolled-courses">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-16 h-16 text-pastoral-gray mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrolled Courses</h3>
                <p className="text-pastoral-gray text-center mb-6">
                  Discover our courses below and start your leadership journey today.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Browse Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-browse-courses">
              Browse Courses
            </h2>
          </div>
          
          {allCoursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} data-testid={`skeleton-browse-course-${i}`}>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allCourses && Array.isArray(allCourses) && allCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(allCourses as any[]).map((course: any) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow" data-testid={`card-course-${course.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-pastoral-green border-pastoral-green">
                        Available
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-pastoral-gray">
                        <div className="flex items-center space-x-1">
                          <Play className="w-4 h-4" />
                          <span>Video lessons</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Community</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Self-paced</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4" />
                          <span>Certificate</span>
                        </div>
                      </div>
                      <Link href={`/courses/${course.id}`}>
                        <Button className="w-full bg-pastoral-green hover:bg-green-600" data-testid={`button-view-course-${course.id}`}>
                          View Course
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card data-testid="card-no-courses">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-16 h-16 text-pastoral-gray mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Available</h3>
                <p className="text-pastoral-gray text-center">
                  Check back soon for new leadership training courses.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </Layout>
  );
}
