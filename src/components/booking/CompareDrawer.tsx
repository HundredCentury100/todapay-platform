import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowRight } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";

interface ComparableItem {
  id: string;
  name: string;
  operator?: string;
  price: number;
  duration?: string;
  amenities?: string[];
  availableSeats?: number;
  rating?: number;
  departureTime?: string;
  arrivalTime?: string;
}

interface CompareDrawerProps {
  maxItems?: number;
}

export const CompareDrawer = ({ maxItems = 3 }: CompareDrawerProps) => {
  const [items, setItems] = useState<ComparableItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();

  const addItem = (item: ComparableItem) => {
    if (items.length >= maxItems) return;
    if (items.find(i => i.id === item.id)) return;
    
    setItems([...items, item]);
    if (!isOpen) setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const clearAll = () => {
    setItems([]);
  };

  // Make addItem available globally
  if (typeof window !== 'undefined') {
    (window as any).addToCompare = addItem;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="fixed bottom-4 right-4 z-50"
          disabled={items.length === 0}
        >
          Compare ({items.length}/{maxItems})
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Compare Options</SheetTitle>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No items to compare</p>
            <p className="text-sm text-muted-foreground">
              Click "Add to Compare" on bus or event cards to start comparing
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeItem(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{item.operator || item.name}</h3>
                    {item.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <span>★ {item.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {item.departureTime && item.arrivalTime && (
                      <div>
                        <span className="text-muted-foreground">Time: </span>
                        <span>{item.departureTime} - {item.arrivalTime}</span>
                      </div>
                    )}

                    {item.duration && (
                      <div>
                        <span className="text-muted-foreground">Duration: </span>
                        <span>{item.duration}</span>
                      </div>
                    )}

                    {item.availableSeats !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Available: </span>
                        <Badge variant="secondary">{item.availableSeats} seats</Badge>
                      </div>
                    )}

                    {item.amenities && item.amenities.length > 0 && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Amenities:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.amenities.slice(0, 3).map((amenity) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {item.amenities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.amenities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {convertPrice(item.price)}
                      </span>
                      <Button size="sm" onClick={() => navigate(`/bus/${item.id}`)}>
                        Select <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export const AddToCompareButton = ({ item }: { item: ComparableItem }) => {
  const handleClick = () => {
    if (typeof window !== 'undefined' && (window as any).addToCompare) {
      (window as any).addToCompare(item);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      <Plus className="h-4 w-4 mr-1" />
      Compare
    </Button>
  );
};
