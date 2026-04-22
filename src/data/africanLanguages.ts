// Language support - Zimbabwe focused with regional neighbours
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  countries: string[];
  speakers: number; // in millions
}

export const africanLanguages: Language[] = [
  // Zimbabwe's official & national languages
  { code: "en", name: "English", nativeName: "English", flag: "🇿🇼", countries: ["Zimbabwe", "South Africa", "Zambia", "Botswana", "Mozambique"], speakers: 700 },
  { code: "sn", name: "Shona", nativeName: "chiShona", flag: "🇿🇼", countries: ["Zimbabwe", "Mozambique"], speakers: 11 },
  { code: "nd", name: "Ndebele", nativeName: "isiNdebele", flag: "🇿🇼", countries: ["Zimbabwe", "South Africa"], speakers: 5 },
  
  // Other Zimbabwe languages
  { code: "to", name: "Tonga", nativeName: "chiTonga", flag: "🇿🇼", countries: ["Zimbabwe", "Zambia"], speakers: 1.5 },
  { code: "ve", name: "Venda", nativeName: "Tshivenḓa", flag: "🇿🇼", countries: ["Zimbabwe", "South Africa"], speakers: 1.3 },
  { code: "ny", name: "Chewa", nativeName: "Chichewa", flag: "🇿🇼", countries: ["Zimbabwe", "Malawi", "Zambia", "Mozambique"], speakers: 9 },
  { code: "ka", name: "Kalanga", nativeName: "Ikalanga", flag: "🇿🇼", countries: ["Zimbabwe", "Botswana"], speakers: 0.7 },
  { code: "so2", name: "Sotho", nativeName: "Sesotho", flag: "🇿🇼", countries: ["Zimbabwe", "South Africa", "Lesotho"], speakers: 6 },
  { code: "ts", name: "Tsonga", nativeName: "Xitsonga", flag: "🇿🇼", countries: ["Zimbabwe", "South Africa", "Mozambique"], speakers: 3.5 },
  { code: "nm", name: "Nambya", nativeName: "Chinambya", flag: "🇿🇼", countries: ["Zimbabwe"], speakers: 0.1 },
  { code: "sl2", name: "Sign Language", nativeName: "Zimbabwe Sign Language", flag: "🇿🇼", countries: ["Zimbabwe"], speakers: 0.3 },
  
  // Regional neighbour languages (for cross-border users)
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦", countries: ["South Africa", "Namibia"], speakers: 7 },
  { code: "zu", name: "isiZulu", nativeName: "isiZulu", flag: "🇿🇦", countries: ["South Africa"], speakers: 12 },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇲🇿", countries: ["Mozambique"], speakers: 30 },
  { code: "bem", name: "Bemba", nativeName: "ChiBemba", flag: "🇿🇲", countries: ["Zambia"], speakers: 4 },
  { code: "tn", name: "Setswana", nativeName: "Setswana", flag: "🇧🇼", countries: ["Botswana", "South Africa"], speakers: 5 },
];

// Mobile money providers - Zimbabwe focused
export const mobileMoneyByCountry: Record<string, string[]> = {
  "Zimbabwe": ["ecocash", "onemoney", "telecash", "innbucks"],
};

// Payment gateways for Zimbabwe
export const paymentGatewaysByRegion: Record<string, string[]> = {
  "Zimbabwe": ["paynow", "dpo"],
};
