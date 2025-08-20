import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
import ProgressCard from "@/components/ProgressCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Eye, Calendar, Download, ThumbsUp, Reply, ChevronLeft, ChevronRight, Award } from "lucide-react";

export default function Lesson() {
  const [, params] = useRoute("/lessons/:lessonId");
  const lessonId = params?.lessonId ? parseInt(params.lessonId) : null;
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
  });

  const { data: discussions } = useQuery({
    queryKey: ["/api/lessons", lessonId, "discussions"],
    enabled: !!lessonId,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/lessons/${lessonId}/discussions`, { content });
    },
    onSuccess: () => {
      toast({
        title: "Comment Posted",
        description: "Your comment has been added to the discussion.",
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "discussions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Post Comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (data: { isCompleted: boolean; progressPercentage: number }) => {
      await apiRequest("POST", `/api/lessons/${lessonId}/progress`, data);
    },
    onSuccess: () => {
      toast({
        title: "Progress Updated",
        description: "Your lesson progress has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMarkComplete = () => {
    progressMutation.mutate({ isCompleted: true, progressPercentage: 100 });
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      commentMutation.mutate(comment);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-screen">
          <div className="flex-1 animate-pulse">
            <div className="aspect-video bg-gray-200"></div>
            <div className="p-8">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded mb-8 w-3/4"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card data-testid="card-lesson-not-found">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lesson Not Found</h3>
              <p className="text-pastoral-gray text-center">
                The lesson you're looking for doesn't exist or is no longer available.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">PKCM Leadership and Ministry Class</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-pastoral-blue transition-colors">My Courses</a>
              <a href="/" className="text-gray-700 hover:text-pastoral-blue transition-colors">Browse</a>
              <a href="/" className="text-gray-700 hover:text-pastoral-blue transition-colors">Community</a>
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-pastoral-blue">
                  <img 
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full" 
                  />
                  <span>{user?.firstName || "Student"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Course Sidebar - Hidden on mobile, visible on lg+ */}
        <div className="hidden lg:flex lg:w-80 bg-white shadow-sm border-r border-gray-200 flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-course-title">
              Leadership & Deliverance Training
            </h2>
            <div className="flex items-center space-x-2 text-sm text-pastoral-gray">
              <span data-testid="text-instructor">Pastor Michael Thompson</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-pastoral-gray">Progress</span>
                <span className="text-pastoral-green font-medium" data-testid="text-progress">0%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-pastoral-green rounded-full h-2" style={{width: "0%"}}></div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-gray-100">
              <div className="px-6 py-4">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="font-medium text-gray-900">Module 1: Foundations of Leadership</span>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-center space-x-3 py-2 px-3 rounded-lg bg-pastoral-blue text-white" data-testid="lesson-current">
                    <span className="flex-1 text-sm">Biblical Principles of Leadership</span>
                    <span className="text-xs">12:34</span>
                  </div>
                  <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="flex-1 text-sm text-gray-700">Servant Leadership Model</span>
                    <span className="text-xs text-gray-500">15:22</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <Button className="w-full bg-pastoral-green text-white hover:bg-green-600" data-testid="button-download-resources">
              Download Resources
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black">
            <VideoPlayer 
              videoUrl={lesson.videoUrl}
              title={lesson.title}
            />
          </div>

          {/* Lesson Content */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:space-x-8">
                <div className="lg:w-2/3">
                  <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2" data-testid="text-lesson-title">
                      {lesson.title}
                    </h1>
                    <p className="text-pastoral-gray mb-4" data-testid="text-lesson-description">
                      {lesson.description || "Explore the foundational principles of godly leadership as demonstrated by biblical figures and taught by Jesus Christ himself."}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-pastoral-gray">
                      {lesson.duration && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span data-testid="text-lesson-duration">{Math.floor(lesson.duration / 60)} minutes</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Updated recently</span>
                      </span>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <Card className="mb-6" data-testid="card-lesson-overview">
                    <CardHeader>
                      <CardTitle>Lesson Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-blue max-w-none">
                        <div className="text-gray-700 leading-relaxed mb-4">
                          {lesson.content || (
                            <>
                              <p className="mb-4">
                                In this foundational lesson, we'll examine the key characteristics of biblical leadership through the examples of Moses, David, and Jesus. You'll learn how to apply these timeless principles in modern ministry contexts.
                              </p>
                              <h4 className="text-md font-medium text-gray-900 mt-6 mb-3">Key Learning Objectives:</h4>
                              <ul className="list-disc list-inside space-y-2 text-gray-700">
                                <li>Identify core biblical leadership principles</li>
                                <li>Understand the servant leadership model</li>
                                <li>Apply leadership lessons from Scripture</li>
                                <li>Develop personal leadership practices</li>
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Downloadable Resources */}
                  {lesson.resourcesUrl && (
                    <Card className="mb-6" data-testid="card-downloadable-resources">
                      <CardHeader>
                        <CardTitle>Downloadable Resources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <a href="#" className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-testid="link-resource-pdf">
                            <Download className="w-5 h-5 text-pastoral-blue" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Leadership Study Guide</div>
                              <div className="text-sm text-pastoral-gray">PDF • 2.3 MB</div>
                            </div>
                            <Download className="w-4 h-4 text-pastoral-gray" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Discussion Section */}
                  <Card data-testid="card-discussion">
                    <CardHeader>
                      <CardTitle>Discussion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Add Comment Form */}
                      <div className="mb-6">
                        <Textarea 
                          placeholder="Share your thoughts or ask a question..."
                          className="mb-2"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          data-testid="textarea-comment"
                        />
                        <div className="flex justify-end">
                          <Button 
                            className="bg-pastoral-blue text-white hover:bg-blue-600"
                            onClick={handleSubmitComment}
                            disabled={commentMutation.isPending || !comment.trim()}
                            data-testid="button-submit-comment"
                          >
                            {commentMutation.isPending ? "Posting..." : "Post Comment"}
                          </Button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-4">
                        {discussions?.map((discussion: any) => (
                          <div key={discussion.id} className="flex space-x-3" data-testid={`comment-${discussion.id}`}>
                            <img 
                              src={discussion.user?.profileImageUrl || "https://images.unsplash.com/photo-1494790108755-2616b612c2db?w=40&h=40&fit=crop&crop=face"} 
                              alt="User avatar" 
                              className="w-10 h-10 rounded-full" 
                            />
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {discussion.user?.firstName} {discussion.user?.lastName}
                                  </span>
                                  <span className="text-sm text-pastoral-gray">
                                    {new Date(discussion.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm">
                                  {discussion.content}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-pastoral-gray">
                                <button className="hover:text-pastoral-blue transition-colors">
                                  <ThumbsUp className="w-4 h-4 inline mr-1" /> 0
                                </button>
                                <button className="hover:text-pastoral-blue transition-colors">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Sidebar */}
                <div className="lg:w-1/3 mt-8 lg:mt-0">
                  <ProgressCard />

                  {/* Navigation Controls */}
                  <Card data-testid="card-lesson-navigation">
                    <CardHeader>
                      <CardTitle>Lesson Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full text-gray-500 cursor-not-allowed"
                          disabled
                          data-testid="button-previous-lesson"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Previous Lesson
                        </Button>
                        <Button 
                          className="w-full bg-pastoral-blue hover:bg-blue-600"
                          data-testid="button-next-lesson"
                        >
                          Next: Servant Leadership Model
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button 
                          className="w-full bg-pastoral-green text-white hover:bg-green-600"
                          onClick={handleMarkComplete}
                          disabled={progressMutation.isPending}
                          data-testid="button-mark-complete"
                        >
                          {progressMutation.isPending ? "Updating..." : "Mark as Complete"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
