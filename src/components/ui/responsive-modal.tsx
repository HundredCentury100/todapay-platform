import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveModal = ({ open, onOpenChange, children, className }: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={className}>
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export const ResponsiveModalHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const isMobile = useIsMobile();
  const Wrapper = isMobile ? DrawerHeader : DialogHeader;
  return <Wrapper className={className}>{children}</Wrapper>;
};

export const ResponsiveModalTitle = React.forwardRef<HTMLHeadingElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    const isMobile = useIsMobile();
    const Comp = isMobile ? DrawerTitle : DialogTitle;
    return <Comp ref={ref} className={className}>{children}</Comp>;
  }
);
ResponsiveModalTitle.displayName = "ResponsiveModalTitle";

export const ResponsiveModalDescription = React.forwardRef<HTMLParagraphElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    const isMobile = useIsMobile();
    const Comp = isMobile ? DrawerDescription : DialogDescription;
    return <Comp ref={ref} className={className}>{children}</Comp>;
  }
);
ResponsiveModalDescription.displayName = "ResponsiveModalDescription";

export const ResponsiveModalFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const isMobile = useIsMobile();
  const Wrapper = isMobile ? DrawerFooter : DialogFooter;
  return <Wrapper className={className}>{children}</Wrapper>;
};
