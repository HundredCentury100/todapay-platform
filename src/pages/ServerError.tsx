import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ServerErrorProps {
  error?: Error | null;
  resetError?: () => void;
}

const ServerError = ({ error, resetError }: ServerErrorProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background safe-area-px">
      <Card className="w-full max-w-md border shadow-md rounded-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-base">
            We're having trouble loading this page. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-muted rounded-xl text-sm">
              <p className="font-medium text-destructive mb-1">Error details:</p>
              <p className="text-muted-foreground font-mono text-xs break-all">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRetry} 
              className="w-full h-12 rounded-full"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleGoHome} 
              className="w-full h-12 rounded-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </div>
          
          <p className="text-center text-xs text-muted-foreground pt-2">
            If this problem persists, please contact support
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerError;
