import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const LocationPicker = lazy(() => import('./LocationPicker').then(mod => ({ default: mod.LocationPicker })));

interface LazyLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  initialAddress?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  biasLocation?: { lat: number; lng: number };
}

export function LazyLocationPicker(props: LazyLocationPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);

  const loadingHeight = props.compact ? 'h-12' : 'h-[400px]';

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center ${loadingHeight}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={`flex items-center justify-center ${loadingHeight}`}><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <LocationPicker {...props} />
    </Suspense>
  );
}

export default LazyLocationPicker;
