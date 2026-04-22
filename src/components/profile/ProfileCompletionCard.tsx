import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Gift, ChevronRight } from "lucide-react";

interface ProfileCompletionCardProps {
  completedFields: string[];
  missingFields: string[];
  percentage: number;
  onCompleteField?: (field: string) => void;
}

export function ProfileCompletionCard({
  completedFields,
  missingFields,
  percentage,
  onCompleteField,
}: ProfileCompletionCardProps) {
  if (percentage === 100) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                Profile Complete!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-500">
                You've unlocked all features
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Complete Your Profile</CardTitle>
          <Badge variant="secondary" className="font-medium">
            <Gift className="h-3 w-3 mr-1" />
            +50 points
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-primary font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Missing Fields */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Add these to complete
          </p>
          {missingFields.slice(0, 3).map((field) => (
            <Button
              key={field}
              variant="ghost"
              className="w-full justify-between h-auto py-2 px-3 hover:bg-muted/50"
              onClick={() => onCompleteField?.(field)}
            >
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{field}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
          {missingFields.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{missingFields.length - 3} more fields
            </p>
          )}
        </div>

        {/* Completed Fields Preview */}
        {completedFields.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Completed</p>
            <div className="flex flex-wrap gap-1">
              {completedFields.slice(0, 4).map((field) => (
                <Badge key={field} variant="outline" className="text-xs font-normal">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  {field}
                </Badge>
              ))}
              {completedFields.length > 4 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{completedFields.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
