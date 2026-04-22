import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SeatLayoutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busId: string;
  currentSeats: number;
  onSuccess: () => void;
}

type LayoutFormat = "2-1" | "2-2" | "3-2" | "2-3";

export function SeatLayoutEditor({ open, onOpenChange, busId, currentSeats, onSuccess }: SeatLayoutEditorProps) {
  const [layout, setLayout] = useState<LayoutFormat>("2-2");
  const [rows, setRows] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && busId) {
      const loadLayout = async () => {
        const { data, error } = await supabase
          .from('buses')
          .select('seat_layout, total_seats')
          .eq('id', busId)
          .single();

        if (error) {
          console.error('Error loading seat layout:', error);
          return;
        }

        if (data?.seat_layout) {
          const layoutData = data.seat_layout as any;
          setLayout(layoutData.format || "2-2");
          setRows(layoutData.rows || 10);
        } else {
          const seatsPerRow = getSeatsPerRow(layout);
          setRows(Math.ceil(currentSeats / seatsPerRow));
        }
      };
      loadLayout();
    }
  }, [open, busId, currentSeats]);

  const getSeatsPerRow = (format: LayoutFormat) => {
    const [left, right] = format.split("-").map(Number);
    return left + right;
  };

  const totalSeats = rows * getSeatsPerRow(layout);

  const renderSeatPreview = () => {
    const [leftSeats, rightSeats] = layout.split("-").map(Number);
    
    return (
      <div className="border rounded-xl p-4 bg-muted/10">
        <div className="text-xs font-medium mb-3 text-center text-muted-foreground">Preview</div>
        <div className="space-y-1.5 max-w-xs mx-auto">
          {Array.from({ length: Math.min(rows, 5) }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center items-center gap-4">
              <div className="flex gap-1">
                {Array.from({ length: leftSeats }).map((_, seatIndex) => (
                  <div
                    key={`left-${seatIndex}`}
                    className="w-8 h-8 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center text-[10px] font-medium text-primary"
                  >
                    {String.fromCharCode(65 + seatIndex)}
                  </div>
                ))}
              </div>
              <div className="w-3" />
              <div className="flex gap-1">
                {Array.from({ length: rightSeats }).map((_, seatIndex) => (
                  <div
                    key={`right-${seatIndex}`}
                    className="w-8 h-8 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center text-[10px] font-medium text-primary"
                  >
                    {String.fromCharCode(65 + leftSeats + seatIndex)}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {rows > 5 && (
            <div className="text-center text-xs text-muted-foreground pt-1">
              ... {rows - 5} more rows
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('buses')
        .update({
          seat_layout: { format: layout, rows, totalSeats },
          total_seats: totalSeats
        })
        .eq('id', busId);

      if (error) throw error;

      toast.success(`Seat layout saved: ${layout} format with ${totalSeats} total seats`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving seat layout:', error);
      toast.error('Failed to save seat layout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Seat Layout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          <div>
            <Label className="text-sm">Seat Format</Label>
            <Select value={layout} onValueChange={(value: LayoutFormat) => setLayout(value)}>
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-1">2-1 (Luxury/VIP)</SelectItem>
                <SelectItem value="2-2">2-2 (Standard)</SelectItem>
                <SelectItem value="3-2">3-2 (High Capacity)</SelectItem>
                <SelectItem value="2-3">2-3 (Asymmetric)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getSeatsPerRow(layout)} seats per row
            </p>
          </div>

          <div>
            <Label className="text-sm">Number of Rows</Label>
            <Select value={rows.toString()} onValueChange={(value) => setRows(parseInt(value))}>
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 5).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">Total Capacity</div>
            <div className="text-3xl font-bold text-primary">{totalSeats} <span className="text-base font-medium">seats</span></div>
          </div>

          {renderSeatPreview()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-11">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="h-11">
            {loading ? "Saving..." : "Save Layout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
