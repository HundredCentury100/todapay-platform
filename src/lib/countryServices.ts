// Zimbabwe-focused country services with cross-border support

// Country code → currency code mapping
export const countryToCurrency: Record<string, string> = {
  ZW: "USD", // Zimbabwe uses USD
  ZA: "ZAR",
  BW: "BWP",
  ZM: "ZMW",
  MZ: "MZN",
  NA: "NAD",
};

// Available services - Zimbabwe gets full service set
export function getCountryServices(countryCode: string): string[] {
  if (countryCode === "ZW") {
    return ["Buses", "Events", "Stays", "Rides", "Transfers", "Experiences", "Venues", "Workspaces", "Bill Pay", "Flights", "Rail"];
  }
  // Cross-border neighbours get basic services
  return ["Buses", "Events", "Stays"];
}

// Country code to flag emoji
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

// Country code to name
export const countryNames: Record<string, string> = {
  ZW: "Zimbabwe",
  ZA: "South Africa",
  BW: "Botswana",
  ZM: "Zambia",
  MZ: "Mozambique",
  NA: "Namibia",
};
