import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  label?: string;
  fallbackPath?: string;
}

const BackButton = ({ className = "", label, fallbackPath = "/" }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Always try to go back in history; fallback if we're at the entry point
    // window.history.length is unreliable on mobile browsers (Safari pre-populates)
    // Instead, use a simple approach: try navigate(-1), but if we're on a deep page
    // and there's no referrer or we came from external, use fallback
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size={label ? "sm" : "icon"}
      onClick={handleBack}
      className={`gap-2 hover:bg-primary/10 ${className}`}
    >
      <ArrowLeft className="h-5 w-5" />
      {label && <span>{label}</span>}
    </Button>
  );
};

export default BackButton;
