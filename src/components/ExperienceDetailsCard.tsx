import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, Star, CheckCircle, AlertCircle, Compass, Utensils, Palette, Mountain, Globe } from "lucide-react";

interface ExperienceDetailsCardProps {
  experienceType?: string;
  duration?: string;
  difficulty?: string;
  groupSize?: string;
  includes?: string[];
  requirements?: string[];
  languages?: string[];
  meetingPoint?: string;
}

const getExperienceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "tours":
      return <Compass className="h-5 w-5" />;
    case "tastings":
      return <Utensils className="h-5 w-5" />;
    case "classes":
    case "workshops":
      return <Palette className="h-5 w-5" />;
    case "adventures":
      return <Mountain className="h-5 w-5" />;
    case "cultural":
      return <Globe className="h-5 w-5" />;
    default:
      return <Star className="h-5 w-5" />;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "moderate":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "challenging":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "difficult":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ExperienceDetailsCard = ({
  experienceType = "Tours",
  duration = "3 hours",
  difficulty = "Easy",
  groupSize = "2-10 people",
  includes = ["Professional guide", "All equipment", "Light refreshments", "Photos included"],
  requirements = ["Comfortable walking shoes", "Weather-appropriate clothing", "Valid ID"],
  languages = ["English", "French", "Portuguese"],
  meetingPoint = "Main entrance - look for guide with orange umbrella",
}: ExperienceDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getExperienceIcon(experienceType)}
          Experience Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg text-center">
            <Clock className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Duration</span>
            <span className="text-sm font-medium">{duration}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg text-center">
            <Star className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Difficulty</span>
            <Badge variant="outline" className={`mt-1 ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </Badge>
          </div>
          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg text-center">
            <Users className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Group Size</span>
            <span className="text-sm font-medium">{groupSize}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg text-center">
            <Globe className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Languages</span>
            <span className="text-sm font-medium">{languages.length} available</span>
          </div>
        </div>

        {/* What's Included */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            What's Included
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {includes.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            What to Bring
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {requirements.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Languages */}
        <div>
          <h4 className="font-medium mb-3">Available Languages</h4>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge key={lang} variant="secondary">
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {/* Meeting Point */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            Meeting Point
          </h4>
          <p className="text-sm text-muted-foreground">{meetingPoint}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceDetailsCard;
