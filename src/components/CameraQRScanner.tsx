import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraQRScannerProps {
  onScan: (qrCodeData: string) => void;
  isScanning?: boolean;
}

const CameraQRScanner = ({ onScan, isScanning = false }: CameraQRScannerProps) => {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current || isCameraActive) return;

    setIsInitializing(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (!isScanning) {
            onScan(decodedText);
            toast({
              title: "QR Code Scanned",
              description: "Processing check-in...",
            });
          }
        },
        (errorMessage) => {
          // Ignore error messages during scanning
        }
      );

      setIsCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (scanner && isCameraActive) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
      setIsCameraActive(false);
      setScanner(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Camera Scanner</h3>
          {isCameraActive ? (
            <Button onClick={stopScanner} variant="outline" size="sm">
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </Button>
          ) : (
            <Button onClick={startScanner} variant="default" size="sm" disabled={isInitializing}>
              {isInitializing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Start Camera
            </Button>
          )}
        </div>

        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full rounded-lg overflow-hidden bg-muted min-h-[300px] flex items-center justify-center"
        >
          {!isCameraActive && (
            <div className="text-center text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Click "Start Camera" to begin scanning</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Point your camera at a QR code to scan automatically
        </p>
      </div>
    </Card>
  );
};

export default CameraQRScanner;
