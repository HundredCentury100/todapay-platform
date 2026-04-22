import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type LocationContextType = {
  userCountry: string;
  setUserCountry: (country: string) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [userCountry, setUserCountry] = useState<string>(() => {
    return localStorage.getItem("userCountry") || "South Africa";
  });

  useEffect(() => {
    localStorage.setItem("userCountry", userCountry);
  }, [userCountry]);

  return (
    <LocationContext.Provider value={{ userCountry, setUserCountry }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useUserLocation must be used within LocationProvider");
  }
  return context;
};

// Ensure proper module export
export { LocationProvider as default };
