import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Play, Clock, User, BookOpen, Download, Lock } from "lucide-react";

export default function Course() {
  const [, params] = useRoute("/courses/:courseId");
  const courseId = params?.courseId ? parseInt(params.courseId) : null;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: enrollments } = useQuery({
    queryKey: ["/api/my-courses"],
  });

  const isEnrolled = enrollments?.some((enrollment: any) => enrollment.courseId === courseId);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Successful",
        description: "You have been enrolled in the course!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-3/4"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card data-testid="card-course-not-found">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-pastoral-gray mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Not Found</h3>
              <p className="text-pastoral-gray text-center">
                The course you're looking for doesn't exist or is no longer available.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="secondary" className="text-pastoral-blue" data-testid="badge-course-status">
              {isEnrolled ? "Enrolled" : "Available"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-course-title">
            {course.title}
          </h1>
          <p className="text-lg text-pastoral-gray mb-6" data-testid="text-course-description">
            {course.description}
          </p>
          <div className="flex items-center space-x-6 text-sm text-pastoral-gray">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span data-testid="text-instructor">
                {course.instructor?.firstName} {course.instructor?.lastName}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span data-testid="text-module-count">
                {course.modules?.length || 0} modules
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Overview */}
            <Card className="mb-6" data-testid="card-course-overview">
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This comprehensive course covers biblical principles of leadership, understanding spiritual warfare, 
                    and practical deliverance ministry. Learn from experienced pastors and biblical scholars as you 
                    develop the skills needed for effective kingdom leadership.
                  </p>
                  <h4 className="text-md font-medium text-gray-900 mt-6 mb-3">What You'll Learn:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Foundational principles of biblical leadership</li>
                    <li>Understanding spiritual warfare and deliverance</li>
                    <li>Practical ministry applications</li>
                    <li>Building strong spiritual foundations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Course Modules */}
            <Card data-testid="card-course-modules">
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {course.modules?.length || 0} modules with video lessons and assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.modules?.map((module: any, moduleIndex: number) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg" data-testid={`module-${module.id}`}>
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900" data-testid={`text-module-title-${module.id}`}>
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-sm text-pastoral-gray mt-1">{module.description}</p>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {module.lessons?.map((lesson: any, lessonIndex: number) => (
                            <div key={lesson.id} className="flex items-center justify-between" data-testid={`lesson-${lesson.id}`}>
                              <div className="flex items-center space-x-3">
                                {isEnrolled ? (
                                  <Play className="w-4 h-4 text-pastoral-blue" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {lessonIndex + 1}. {lesson.title}
                                  </div>
                                  {lesson.duration && (
                                    <div className="text-xs text-pastoral-gray flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{Math.floor(lesson.duration / 60)} min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isEnrolled ? (
                                <Link href={`/lessons/${lesson.id}`}>
                                  <Button size="sm" variant="ghost" data-testid={`button-play-lesson-${lesson.id}`}>
                                    Play
                                  </Button>
                                </Link>
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card data-testid="card-enrollment">
              <CardHeader>
                <CardTitle>
                  {isEnrolled ? "You're Enrolled!" : "Enroll in Course"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-pastoral-green/10 rounded-lg">
                      <BookOpen className="w-8 h-8 text-pastoral-green mx-auto mb-2" />
                      <p className="text-sm text-pastoral-green font-medium">
                        Start your first lesson now!
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-pastoral-gray">Progress</span>
                        <span className="font-medium text-pastoral-green">0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Free Course</h3>
                      <p className="text-sm text-pastoral-gray">
                        Get lifetime access to all course materials
                      </p>
                    </div>
                    <Button
                      className="w-full bg-pastoral-green hover:bg-green-600"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                      data-testid="button-enroll"
                    >
                      {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Features */}
            <Card data-testid="card-course-features">
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Play className="w-4 h-4 text-pastoral-blue" />
                    <span>High-quality video lessons</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-pastoral-blue" />
                    <span>Downloadable resources</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-pastoral-blue" />
                    <span>Interactive discussions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-pastoral-blue" />
                    <span>Lifetime access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
