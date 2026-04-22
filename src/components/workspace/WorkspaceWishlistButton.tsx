import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addFavoriteWorkspace, removeFavoriteWorkspace, getFavoriteWorkspaces } from "@/services/workspaceService";
import { useOptimisticFavorite } from "@/hooks/useOptimisticFavorite";
import { cn } from "@/lib/utils";

interface WorkspaceWishlistButtonProps {
  workspaceId: string;
  className?: string;
  variant?: "default" | "icon";
}

export const WorkspaceWishlistButton = ({ 
  workspaceId, 
  className,
  variant = "icon" 
}: WorkspaceWishlistButtonProps) => {
  const { user } = useAuth();

  const checkIsFavorite = useCallback(async () => {
    if (!user) return false;
    const favorites = await getFavoriteWorkspaces(user.id);
    return favorites.some((f: any) => f.workspace_id === workspaceId);
  }, [user, workspaceId]);

  const addFavorite = useCallback(async () => {
    if (!user) throw new Error("Must be logged in");
    await addFavoriteWorkspace(user.id, workspaceId);
  }, [user, workspaceId]);

  const removeFavorite = useCallback(async () => {
    if (!user) throw new Error("Must be logged in");
    await removeFavoriteWorkspace(user.id, workspaceId);
  }, [user, workspaceId]);

  const { isFavorite, isToggling, toggleFavorite } = useOptimisticFavorite({
    resourceId: workspaceId,
    resourceType: 'workspace',
    checkIsFavorite,
    addFavorite,
    removeFavorite,
  });

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFavorite}
        disabled={isToggling}
        className={cn(
          "h-9 w-9 rounded-full bg-background/80 hover:bg-background active:scale-95",
          className
        )}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all duration-200",
            isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground",
            isToggling && "animate-pulse"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isFavorite ? "secondary" : "outline"}
      onClick={toggleFavorite}
      disabled={isToggling}
      className={cn(className, "active:scale-95")}
    >
      <Heart
        className={cn(
          "h-4 w-4 mr-2 transition-transform",
          isFavorite ? "fill-red-500 text-red-500 scale-110" : "",
          isToggling && "animate-pulse"
        )}
      />
      {isFavorite ? "Saved" : "Save"}
    </Button>
  );
};
