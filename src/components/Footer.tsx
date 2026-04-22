import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: "about", to: "/about" },
    { label: "privacy", to: "/privacy" },
    { label: "terms", to: "/terms" },
  ];

  const browseLinks = [
    { label: "buses", to: "/buses" },
    { label: "events", to: "/events" },
    { label: "stays", to: "/stays" },
    { label: "workspaces", to: "/workspaces" },
    { label: "venues", to: "/venues" },
    { label: "rides", to: "/ride-booking" },
  ];

  return (
    <footer className="hidden md:block border-t border-border/50 bg-secondary/30 mt-auto">
      <div className="container-wide section-padding-sm">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold tracking-tight">fulticket</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your global super app for travel, events, and spaces. Book anywhere, anytime.
            </p>
          </div>

          {/* Browse */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">browse</h3>
            <ul className="space-y-3">
              {browseLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">company</h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">contact</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:support@fulticket.com" 
                  className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                >
                  support@fulticket.com
                </a>
              </li>
              <li>
                <Link 
                  to="/help" 
                  className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                >
                  help center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-border/50" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} fulticket from{" "}
            <a 
              href="https://www.suvat.group" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Suvat Group
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            available worldwide 🌍
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
