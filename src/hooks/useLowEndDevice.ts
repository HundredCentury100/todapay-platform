import { useState, useEffect } from 'react';

interface DeviceCapabilities {
  isLowEnd: boolean;
  /** Logical CPU cores */
  cores: number;
  /** Device memory in GB (if available) */
  memory: number | null;
  /** Effective connection type */
  connectionType: string | null;
}

/**
 * Detect low-end devices to reduce animations and heavy rendering.
 * Low-end heuristic: ≤4 cores OR ≤4GB RAM OR slow connection.
 */
export function useLowEndDevice(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || null;
    const connection = (navigator as any).connection;
    const connectionType = connection?.effectiveType || null;
    
    const isLowEnd = 
      cores <= 4 || 
      (memory !== null && memory <= 4) || 
      connectionType === 'slow-2g' || 
      connectionType === '2g';

    return { isLowEnd, cores, memory, connectionType };
  });

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const update = () => {
      setCapabilities(prev => ({
        ...prev,
        connectionType: connection.effectiveType,
        isLowEnd: 
          prev.cores <= 4 || 
          (prev.memory !== null && prev.memory <= 4) || 
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g',
      }));
    };

    connection.addEventListener('change', update);
    return () => connection.removeEventListener('change', update);
  }, []);

  return capabilities;
}
