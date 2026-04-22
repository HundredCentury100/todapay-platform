import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, Globe } from "lucide-react";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

const currencyRegions = {
  "Supported": ["USD", "ZWG"],
};

export const CurrencySelector = () => {
  const { currency, setCurrency, isLive, lastUpdated, refreshRates, isRefreshing } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Globe className="h-4 w-4" />
          <span className="font-medium">{currency.code}</span>
          {isLive && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-emerald-500/10 text-emerald-600">
              LIVE
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No currency found.</CommandEmpty>
            {Object.entries(currencyRegions).map(([region, codes]) => (
              <CommandGroup key={region} heading={region}>
                {codes.map(code => {
                  const curr = currencies.find(c => c.code === code);
                  if (!curr) return null;
                  return (
                    <CommandItem
                      key={code}
                      value={code}
                      onSelect={() => {
                        setCurrency(curr);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium w-8">{curr.symbol}</span>
                        <span>{code}</span>
                      </div>
                      {currency.code === code && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <div className="p-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {lastUpdated 
              ? `Updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Using offline rates'
            }
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 gap-1"
            onClick={() => refreshRates()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
