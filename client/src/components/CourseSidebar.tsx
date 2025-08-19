import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Play, Lock, FileText, User, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseSidebarProps {
  courseId: number;
  currentLessonId?: number;
}

export default function CourseSidebar({ courseId, currentLessonId }: CourseSidebarProps) {
  const [, params] = useRoute("/lessons/:lessonId");
  const activeLessonId = currentLessonId || (params?.lessonId ? parseInt(params.lessonId) : null);
  
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([1])); // First module open by default

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/courses", courseId, "progress"],
    enabled: !!courseId,
  });

  const toggleModule = (moduleId: number) => {
    const newOpenModules = new Set(openModules);
    if (newOpenModules.has(moduleId)) {
      newOpenModules.delete(moduleId);
    } else {
      newOpenModules.add(moduleId);
    }
    setOpenModules(newOpenModules);
  };

  const isModuleOpen = (moduleId: number) => openModules.has(moduleId);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="hidden lg:flex lg:w-80 bg-white shadow-sm border-r border-gray-200 flex-col animate-pulse">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const progressPercentage = progress?.progress_percentage || 0;
  const completedLessons = progress?.completed_lessons || 0;

  return (
    <div className="hidden lg:flex lg:w-80 bg-white shadow-sm border-r border-gray-200 flex-col" data-testid="course-sidebar">
      {/* Course Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-course-title">
          {course.title}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-pastoral-gray">
          <User className="w-4 h-4 text-pastoral-blue" />
          <span data-testid="text-instructor-name">
            {course.instructor?.firstName} {course.instructor?.lastName}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-pastoral-gray">Progress</span>
            <span className="text-pastoral-green font-medium" data-testid="text-sidebar-progress">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-pastoral-green rounded-full h-2 transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-bar-sidebar"
            ></div>
          </div>
        </div>
      </div>

      {/* Modules and Lessons */}
      <div className="flex-1 overflow-y-auto">
        {course.modules?.map((module: any, moduleIndex: number) => {
          const isOpen = isModuleOpen(module.id);
          const hasCurrentLesson = module.lessons?.some((lesson: any) => lesson.id === activeLessonId);
          
          return (
            <div key={module.id} className="border-b border-gray-100" data-testid={`module-${module.id}`}>
              <Collapsible open={isOpen} onOpenChange={() => toggleModule(module.id)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-pastoral-blue/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-pastoral-blue">
                            {moduleIndex + 1}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900" data-testid={`text-module-title-${module.id}`}>
                          {module.title}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-6 pb-4">
                    <div className="ml-6 space-y-2">
                      {module.lessons?.map((lesson: any, lessonIndex: number) => {
                        const isCurrentLesson = lesson.id === activeLessonId;
                        const isCompleted = false; // TODO: Get from lesson progress
                        
                        return (
                          <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                            <div
                              className={cn(
                                "flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors cursor-pointer",
                                isCurrentLesson
                                  ? "bg-pastoral-blue text-white"
                                  : "hover:bg-gray-50"
                              )}
                              data-testid={`lesson-${lesson.id}`}
                            >
                              <div className="flex-shrink-0">
                                {lesson.videoUrl ? (
                                  <Play className={cn(
                                    "w-4 h-4",
                                    isCurrentLesson ? "text-white" : "text-pastoral-blue"
                                  )} />
                                ) : (
                                  <FileText className={cn(
                                    "w-4 h-4",
                                    isCurrentLesson ? "text-white" : "text-gray-400"
                                  )} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "text-sm font-medium truncate",
                                  isCurrentLesson ? "text-white" : "text-gray-900"
                                )}>
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {lesson.duration ? (
                                  <span className={cn(
                                    "text-xs",
                                    isCurrentLesson ? "text-white/80" : "text-pastoral-gray"
                                  )}>
                                    {formatDuration(lesson.duration)}
                                  </span>
                                ) : (
                                  <Lock className={cn(
                                    "w-3 h-3",
                                    isCurrentLesson ? "text-white/60" : "text-gray-400"
                                  )} />
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>

      {/* Download Resources Button */}
      <div className="p-6 border-t border-gray-200">
        <Button 
          className="w-full bg-pastoral-green text-white hover:bg-green-600 transition-colors"
          data-testid="button-download-resources"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Resources
        </Button>
      </div>
    </div>
  );
}
