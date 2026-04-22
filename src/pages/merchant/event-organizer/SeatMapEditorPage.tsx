import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { toast } from "sonner";
import { Loader2, Grid3X3, Save, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SeatCell {
  row: number;
  col: number;
  active: boolean;
  seatNumber: string;
  tierId?: string;
}

const SeatMapEditorPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedTierId, setSelectedTierId] = useState("");
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(15);
  const [grid, setGrid] = useState<SeatCell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [existingSeats, setExistingSeats] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTiers();
      loadExistingSeats();
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTiers = async () => {
    const { data } = await supabase
      .from("event_ticket_tiers")
      .select("id, name, price")
      .eq("event_id", selectedEventId)
      .order("price");
    setTiers(data || []);
    if (data && data.length > 0) setSelectedTierId(data[0].id);
  };

  const loadExistingSeats = async () => {
    const { data } = await supabase
      .from("event_seats")
      .select("*")
      .eq("event_id", selectedEventId)
      .order("seat_row")
      .order("seat_column");
    
    setExistingSeats(data || []);
    
    if (data && data.length > 0) {
      const maxRow = Math.max(...data.map(s => s.seat_row));
      const maxCol = Math.max(...data.map(s => s.seat_column));
      setRows(Math.max(maxRow, 10));
      setCols(Math.max(maxCol, 15));
      
      const newGrid = initGrid(Math.max(maxRow, 10), Math.max(maxCol, 15));
      data.forEach(seat => {
        if (newGrid[seat.seat_row - 1] && newGrid[seat.seat_row - 1][seat.seat_column - 1]) {
          newGrid[seat.seat_row - 1][seat.seat_column - 1] = {
            row: seat.seat_row,
            col: seat.seat_column,
            active: true,
            seatNumber: seat.seat_number,
            tierId: seat.ticket_tier_id,
          };
        }
      });
      setGrid(newGrid);
    } else {
      setGrid(initGrid(rows, cols));
    }
  };

  const initGrid = (r: number, c: number): SeatCell[][] => {
    return Array.from({ length: r }, (_, ri) =>
      Array.from({ length: c }, (_, ci) => ({
        row: ri + 1,
        col: ci + 1,
        active: false,
        seatNumber: `${String.fromCharCode(65 + ri)}${ci + 1}`,
        tierId: undefined,
      }))
    );
  };

  const resetGrid = () => {
    setGrid(initGrid(rows, cols));
  };

  const toggleCell = (ri: number, ci: number) => {
    setGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[ri][ci];
      cell.active = !cell.active;
      if (cell.active) cell.tierId = selectedTierId;
      return newGrid;
    });
  };

  const handleMouseDown = (ri: number, ci: number) => {
    const cell = grid[ri][ci];
    setDragMode(cell.active ? "remove" : "add");
    setIsDragging(true);
    toggleCell(ri, ci);
  };

  const handleMouseEnter = (ri: number, ci: number) => {
    if (!isDragging) return;
    setGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      newGrid[ri][ci].active = dragMode === "add";
      if (dragMode === "add") newGrid[ri][ci].tierId = selectedTierId;
      return newGrid;
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    try {
      // Delete existing seats
      await supabase.from("event_seats").delete().eq("event_id", selectedEventId);

      const seats = grid.flatMap(row =>
        row.filter(c => c.active).map(c => ({
          event_id: selectedEventId,
          ticket_tier_id: c.tierId || selectedTierId,
          seat_number: c.seatNumber,
          seat_row: c.row,
          seat_column: c.col,
          status: "available" as const,
        }))
      );

      if (seats.length > 0) {
        const { error } = await supabase.from("event_seats").insert(seats);
        if (error) throw error;
      }

      toast.success(`Saved ${seats.length} seats`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = grid.flat().filter(c => c.active).length;
  const tierColor = (tierId?: string) => {
    if (!tierId) return "bg-primary/80";
    const idx = tiers.findIndex(t => t.id === tierId);
    const colors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500"];
    return colors[idx % colors.length];
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seating Map Editor</h1>
        <p className="text-muted-foreground">Design your venue layout by clicking or dragging to place seats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent>
                  {events.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEventId && (
              <>
                <div>
                  <Label>Assign to Tier</Label>
                  <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      {tiers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name} (${t.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Rows</Label>
                    <Input type="number" min={1} max={50} value={rows} onChange={e => {
                      const v = Number(e.target.value);
                      setRows(v);
                      setGrid(initGrid(v, cols));
                    }} />
                  </div>
                  <div>
                    <Label>Columns</Label>
                    <Input type="number" min={1} max={50} value={cols} onChange={e => {
                      const v = Number(e.target.value);
                      setCols(v);
                      setGrid(initGrid(rows, v));
                    }} />
                  </div>
                </div>

                {/* Tier Legend */}
                <div className="space-y-2">
                  <Label>Tier Legend</Label>
                  {tiers.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <div className={cn("w-4 h-4 rounded", tierColor(t.id))} />
                      <span>{t.name} — ${t.price}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    {activeCount} seats placed
                  </Badge>
                  <Button onClick={handleSave} className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Layout
                  </Button>
                  <Button variant="outline" onClick={resetGrid} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Seat Grid */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            {!selectedEventId ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Grid3X3 className="w-12 h-12 mb-3 opacity-40" />
                <p>Select an event to start designing the seating map</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <Badge variant="secondary" className="px-8 py-1.5 text-xs">STAGE</Badge>
                </div>
                <div
                  className="overflow-auto select-none"
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="inline-block min-w-full">
                    {grid.map((row, ri) => (
                      <div key={ri} className="flex items-center gap-0.5 mb-0.5">
                        <span className="text-[10px] font-mono w-5 text-muted-foreground text-center shrink-0">
                          {String.fromCharCode(65 + ri)}
                        </span>
                        {row.map((cell, ci) => (
                          <motion.button
                            key={`${ri}-${ci}`}
                            className={cn(
                              "w-8 h-8 rounded text-[9px] font-semibold transition-colors",
                              cell.active
                                ? `${tierColor(cell.tierId)} text-white`
                                : "bg-muted/40 hover:bg-muted border border-transparent hover:border-border"
                            )}
                            onMouseDown={() => handleMouseDown(ri, ci)}
                            onMouseEnter={() => handleMouseEnter(ri, ci)}
                            whileTap={{ scale: 0.9 }}
                          >
                            {cell.active ? cell.seatNumber : ""}
                          </motion.button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeatMapEditorPage;
