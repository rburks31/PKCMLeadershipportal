import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, BookOpen } from "lucide-react";

export default function ProgressCard() {
  return (
    <>
      {/* Course Progress Card */}
      <Card className="mb-6" data-testid="card-course-progress">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-pastoral-gray">Course Completion</span>
                <span className="font-medium text-pastoral-green" data-testid="text-completion-percentage">0%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-pastoral-green rounded-full h-2" style={{width: "0%"}}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-pastoral-blue" data-testid="text-lessons-completed">0</div>
                <div className="text-pastoral-gray">Lessons Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pastoral-green" data-testid="text-quiz-average">--</div>
                <div className="text-pastoral-gray">Quiz Average</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Preview */}
      <Card className="mb-6" data-testid="card-certificate-preview">
        <CardHeader>
          <CardTitle>Course Certificate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Award className="text-pastoral-gold text-3xl mb-3 mx-auto" />
            <h4 className="font-medium text-gray-900 mb-2">Certificate of Completion</h4>
            <p className="text-sm text-pastoral-gray mb-4">
              Complete all lessons and pass the final assessment to earn your certificate
            </p>
            <div className="text-sm text-pastoral-gray" data-testid="text-remaining-lessons">
              <span>All lessons remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
