import { useNavigate } from 'react-router-dom';
import { X, Star, MapPin, Check, Minus, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePropertyCompare } from '@/contexts/PropertyCompareContext';
import { cn } from '@/lib/utils';

const COMPARE_FEATURES = [
  { key: 'property_type', label: 'Property Type' },
  { key: 'star_rating', label: 'Star Rating' },
  { key: 'city', label: 'Location' },
  { key: 'min_price', label: 'Price from' },
  { key: 'review_score', label: 'Guest Rating' },
];

const COMMON_AMENITIES = [
  'wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 
  'bar', 'room_service', 'air_conditioning', 'pet_friendly'
];

export function PropertyCompareDrawer() {
  const navigate = useNavigate();
  const { 
    compareList, 
    removeFromCompare, 
    clearCompare, 
    isCompareOpen, 
    setCompareOpen 
  } = usePropertyCompare();

  const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    
    switch (key) {
      case 'star_rating':
        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{value}</span>
          </div>
        );
      case 'min_price':
        return `$${value}/night`;
      case 'review_score':
        return `${value}/10`;
      case 'property_type':
        return value.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      default:
        return value;
    }
  };

  const hasAmenity = (property: any, amenity: string) => {
    return property.amenities?.includes(amenity);
  };

  const formatAmenity = (amenity: string) => {
    return amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Compare Button */}
      {!isCompareOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            size="lg"
            onClick={() => setCompareOpen(true)}
            className="shadow-lg"
          >
            Compare ({compareList.length})
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <Sheet open={isCompareOpen} onOpenChange={setCompareOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <SheetTitle>Compare Properties ({compareList.length})</SheetTitle>
            <Button variant="ghost" size="sm" onClick={clearCompare}>
              Clear All
            </Button>
          </SheetHeader>

          <ScrollArea className="h-full py-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                {/* Property Headers */}
                <thead>
                  <tr>
                    <th className="text-left p-2 w-32" />
                    {compareList.map((property) => (
                      <th key={property.id} className="p-2 min-w-[200px]">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeFromCompare(property.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              setCompareOpen(false);
                              navigate(`/stays/${property.id}`);
                            }}
                          >
                            <img
                              src={property.images?.[0] || '/placeholder.svg'}
                              alt={property.name}
                              className="w-full h-32 object-cover rounded-lg mb-2"
                            />
                            <h3 className="font-semibold text-sm line-clamp-2">
                              {property.name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {property.city}
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Basic Features */}
                  {COMPARE_FEATURES.map((feature) => (
                    <tr key={feature.key} className="border-t">
                      <td className="p-2 text-sm font-medium text-muted-foreground">
                        {feature.label}
                      </td>
                      {compareList.map((property) => (
                        <td key={property.id} className="p-2 text-sm text-center">
                          {formatValue(feature.key, (property as any)[feature.key])}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Amenities Section */}
                  <tr className="border-t bg-muted/50">
                    <td colSpan={compareList.length + 1} className="p-2 text-sm font-semibold">
                      Amenities
                    </td>
                  </tr>
                  {COMMON_AMENITIES.map((amenity) => (
                    <tr key={amenity} className="border-t">
                      <td className="p-2 text-sm text-muted-foreground">
                        {formatAmenity(amenity)}
                      </td>
                      {compareList.map((property) => (
                        <td key={property.id} className="p-2 text-center">
                          {hasAmenity(property, amenity) ? (
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* View Property Buttons */}
                  <tr className="border-t">
                    <td className="p-2" />
                    {compareList.map((property) => (
                      <td key={property.id} className="p-2 text-center">
                        <Button
                          size="sm"
                          onClick={() => {
                            setCompareOpen(false);
                            navigate(`/stays/${property.id}`);
                          }}
                        >
                          View Property
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
