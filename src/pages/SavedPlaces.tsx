import { useState } from "react";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Home, Briefcase, MapPin, Plus, Trash2, Map, List } from "lucide-react";
import { motion } from "framer-motion";
import { BaseMap } from "@/components/maps/BaseMap";
import { MapMarker } from "@/components/maps/MapMarker";

// Mock saved places - in production this would come from Supabase
const mockSavedPlaces = [
  {
    id: "1",
    name: "Home",
    address: "123 Main Street, City Center",
    icon: Home,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    lat: -17.8292,
    lng: 31.0522,
  },
  {
    id: "2", 
    name: "Work",
    address: "456 Business Park, Downtown",
    icon: Briefcase,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    lat: -17.8350,
    lng: 31.0450,
  },
];

const SavedPlaces = () => {
  const [places] = useState(mockSavedPlaces);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const center = places.length > 0
    ? { lat: places.reduce((s, p) => s + p.lat, 0) / places.length, lng: places.reduce((s, p) => s + p.lng, 0) / places.length }
    : { lat: -17.8292, lng: 31.0522 };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Saved Places</h1>
              <p className="text-xs text-muted-foreground">Quick access to your favorite locations</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl press-effect"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            >
              {viewMode === 'list' ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-4 space-y-4">
          {/* Map View */}
          {viewMode === 'map' && places.length > 0 && (
            <div className="h-[50vh] rounded-2xl overflow-hidden border">
              <BaseMap center={center} zoom={13} className="h-full w-full" scrollWheelZoom dragging>
                {places.map((place) => (
                  <MapMarker
                    key={place.id}
                    position={{ lat: place.lat, lng: place.lng }}
                    type="property"
                    size="md"
                  />
                ))}
              </BaseMap>
            </div>
          )}

          {/* Saved Places List */}
          {places.length > 0 ? (
            <div className="space-y-3">
              {places.map((place, index) => {
                const Icon = place.icon;
                return (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-4 rounded-2xl border-0 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${place.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${place.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{place.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center rounded-2xl border-0 shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Saved Places</h3>
              <p className="text-muted-foreground mb-4">Save your favorite locations for quick access</p>
            </Card>
          )}

          {/* Add New Place Button */}
          <Button className="w-full rounded-xl h-12 gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            Add New Place
          </Button>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default SavedPlaces;
