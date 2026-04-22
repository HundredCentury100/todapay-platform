import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AddToCalendarButtonProps {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCalendarButton({
  title,
  description = "",
  location = "",
  startDate,
  endDate,
  allDay = false,
  className,
  variant = "outline",
  size = "default",
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateForICS = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const formatDateForGoogle = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const generateICSFile = () => {
    const end = endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FulTicket//Event Calendar//EN
BEGIN:VEVENT
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(end)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar file downloaded');
  };

  const openGoogleCalendar = () => {
    const end = endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(end)}`,
      details: description,
      location: location,
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const openOutlookCalendar = () => {
    const end = endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      startdt: startDate.toISOString(),
      enddt: end.toISOString(),
      body: description,
      location: location,
    });

    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
  };

  const openYahooCalendar = () => {
    const end = endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      v: '60',
      title: title,
      st: format(startDate, "yyyyMMdd'T'HHmmss"),
      et: format(end, "yyyyMMdd'T'HHmmss"),
      desc: description,
      in_loc: location,
    });

    window.open(`https://calendar.yahoo.com/?${params.toString()}`, '_blank');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={generateICSFile}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics file
          <span className="ml-auto text-xs text-muted-foreground">Apple, Outlook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openGoogleCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openOutlookCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openYahooCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Yahoo Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AddToCalendarButton;
