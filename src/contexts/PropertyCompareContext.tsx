import { createContext, useContext, useState, ReactNode } from 'react';
import { Property } from '@/types/stay';
import { toast } from 'sonner';

interface PropertyCompareContextType {
  compareList: Property[];
  addToCompare: (property: Property) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isInCompare: (propertyId: string) => boolean;
  isCompareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
}

const PropertyCompareContext = createContext<PropertyCompareContextType | undefined>(undefined);

const MAX_COMPARE = 3;

export function PropertyCompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Property[]>([]);
  const [isCompareOpen, setCompareOpen] = useState(false);

  const addToCompare = (property: Property) => {
    if (compareList.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} properties`);
      return;
    }
    
    if (compareList.some(p => p.id === property.id)) {
      toast.info('Property already in compare list');
      return;
    }

    setCompareList([...compareList, property]);
    toast.success(`Added to compare (${compareList.length + 1}/${MAX_COMPARE})`);
  };

  const removeFromCompare = (propertyId: string) => {
    setCompareList(compareList.filter(p => p.id !== propertyId));
  };

  const clearCompare = () => {
    setCompareList([]);
    setCompareOpen(false);
  };

  const isInCompare = (propertyId: string) => {
    return compareList.some(p => p.id === propertyId);
  };

  return (
    <PropertyCompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareOpen,
        setCompareOpen
      }}
    >
      {children}
    </PropertyCompareContext.Provider>
  );
}

export function usePropertyCompare() {
  const context = useContext(PropertyCompareContext);
  if (!context) {
    throw new Error('usePropertyCompare must be used within PropertyCompareProvider');
  }
  return context;
}
