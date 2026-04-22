import { useCallback } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { favoritePropertiesService } from '@/services/favoritePropertiesService';
import { useOptimisticFavorite } from '@/hooks/useOptimisticFavorite';
import { cn } from '@/lib/utils';

interface PropertyWishlistButtonProps {
  propertyId: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export function PropertyWishlistButton({ 
  propertyId, 
  variant = 'icon',
  className 
}: PropertyWishlistButtonProps) {
  const checkIsFavorite = useCallback(
    () => favoritePropertiesService.isFavorite(propertyId),
    [propertyId]
  );

  const addFavorite = useCallback(
    () => favoritePropertiesService.addFavorite(propertyId),
    [propertyId]
  );

  const removeFavorite = useCallback(
    () => favoritePropertiesService.removeFavorite(propertyId),
    [propertyId]
  );

  const { isFavorite, isToggling, toggleFavorite } = useOptimisticFavorite({
    resourceId: propertyId,
    resourceType: 'property',
    checkIsFavorite,
    addFavorite,
    removeFavorite,
  });

  if (variant === 'button') {
    return (
      <Button
        variant={isFavorite ? 'default' : 'outline'}
        size="sm"
        onClick={toggleFavorite}
        disabled={isToggling}
        className={className}
      >
        <Heart className={cn(
          'h-4 w-4 mr-2 transition-transform',
          isFavorite && 'fill-current scale-110',
          isToggling && 'animate-pulse'
        )} />
        {isFavorite ? 'Saved' : 'Save'}
      </Button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isToggling}
      className={cn(
        'p-2 rounded-full bg-background/80 hover:bg-background transition-all',
        'shadow-md hover:shadow-lg active:scale-95',
        className
      )}
    >
      <Heart 
        className={cn(
          'h-5 w-5 transition-all duration-200',
          isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground hover:text-red-500',
          isToggling && 'animate-pulse'
        )} 
      />
    </button>
  );
}
