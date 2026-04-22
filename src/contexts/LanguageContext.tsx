import { createContext, useContext, useState, ReactNode } from "react";

export type Language = {
  code: string;
  name: string;
  flag: string;
};

export const languages: Language[] = [
  // Major Pan-African Languages
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  
  // East Africa
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "am", name: "አማርኛ", flag: "🇪🇹" },
  { code: "so", name: "Soomaali", flag: "🇸🇴" },
  
  // West Africa
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  
  // Southern Africa
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "sn", name: "Shona", flag: "🇿🇼" },
  { code: "tn", name: "Setswana", flag: "🇧🇼" },
  { code: "bem", name: "Bemba", flag: "🇿🇲" },
];

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

// Comprehensive translations object
const translations: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.buses": "Buses",
    "nav.events": "Events",
    "nav.bookings": "My Bookings",
    "nav.help": "Help",
    "nav.profile": "Profile",
    "nav.signin": "Sign In",
    "nav.signup": "Sign Up",
    "nav.signout": "Sign Out",
    
    // Search
    "search.from": "From",
    "search.to": "To",
    "search.date": "Date",
    "search.search": "Search",
    "search.passengers": "Passengers",
    "search.adults": "Adults",
    "search.children": "Children",
    
    // Booking
    "booking.confirm": "Confirm Booking",
    "booking.reference": "Booking Reference",
    "booking.status": "Status",
    "booking.passenger": "Passenger",
    "booking.contact": "Contact Details",
    "booking.payment": "Payment",
    "booking.total": "Total",
    "booking.seats": "Seats",
    "booking.confirmed": "Booking Confirmed",
    "booking.pending": "Pending",
    "booking.cancelled": "Cancelled",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.back": "Back",
    "common.next": "Next",
    "common.price": "Price",
    "common.available": "Available",
    "common.unavailable": "Unavailable",
    
    // Bus Results
    "bus.available": "Available Buses",
    "bus.departure": "Departure",
    "bus.arrival": "Arrival",
    "bus.duration": "Duration",
    "bus.operator": "Operator",
    "bus.amenities": "Amenities",
    "bus.seats": "Seats Available",
    
    // Event Results
    "event.available": "Available Events",
    "event.venue": "Venue",
    "event.date": "Date",
    "event.time": "Time",
    "event.tickets": "Tickets Available",
    "event.type": "Event Type",
  },
  zu: {
    // Navigation
    "nav.home": "Ikhaya",
    "nav.buses": "Amabhasi",
    "nav.events": "Imicimbi",
    "nav.bookings": "Ama-booking ami",
    "nav.help": "Usizo",
    "nav.profile": "Iphrofayela",
    "nav.signin": "Ngena ngemvume",
    "nav.signup": "Bhalisela",
    "nav.signout": "Phuma",
    
    // Search
    "search.from": "Kusuka",
    "search.to": "Kuya",
    "search.date": "Usuku",
    "search.search": "Sesha",
    "search.passengers": "Abagibeli",
    "search.adults": "Abantu abadala",
    "search.children": "Izingane",
    
    // Booking
    "booking.confirm": "Qinisekisa ukubhukha",
    "booking.reference": "Inombolo yokubhukha",
    "booking.status": "Isimo",
    "booking.passenger": "Umgibeli",
    "booking.contact": "Imininingwane yokuxhumana",
    "booking.payment": "Inkokhelo",
    "booking.total": "Isamba",
    "booking.seats": "Izihlalo",
    "booking.confirmed": "Ukubhukha kuqinisekisiwe",
    "booking.pending": "Kulindile",
    "booking.cancelled": "Kukhanselwe",
    
    // Common
    "common.loading": "Iyalayisha...",
    "common.error": "Iphutha",
    "common.success": "Impumelelo",
    "common.cancel": "Khansela",
    "common.submit": "Thumela",
    "common.save": "Londoloza",
    "common.edit": "Hlela",
    "common.delete": "Susa",
    "common.back": "Emuva",
    "common.next": "Okulandelayo",
    "common.price": "Intengo",
    "common.available": "Iyatholakala",
    "common.unavailable": "Ayitholakali",
    
    // Bus Results
    "bus.available": "Amabhasi atholakalayo",
    "bus.departure": "Ukusuka",
    "bus.arrival": "Ukufika",
    "bus.duration": "Isikhathi",
    "bus.operator": "Umshayeli",
    "bus.amenities": "Izinsiza",
    "bus.seats": "Izihlalo ezitholakalayo",
    
    // Event Results
    "event.available": "Imicimbi etholakalayo",
    "event.venue": "Indawo",
    "event.date": "Usuku",
    "event.time": "Isikhathi",
    "event.tickets": "Amathikithi atholakalayo",
    "event.type": "Uhlobo lomcimbi",
  },
  af: {
    // Navigation
    "nav.home": "Tuis",
    "nav.buses": "Busse",
    "nav.events": "Geleenthede",
    "nav.bookings": "My Besprekings",
    "nav.help": "Hulp",
    "nav.profile": "Profiel",
    "nav.signin": "Teken in",
    "nav.signup": "Registreer",
    "nav.signout": "Teken uit",
    
    // Search
    "search.from": "Van",
    "search.to": "Na",
    "search.date": "Datum",
    "search.search": "Soek",
    "search.passengers": "Passasiers",
    "search.adults": "Volwassenes",
    "search.children": "Kinders",
    
    // Booking
    "booking.confirm": "Bevestig Bespreking",
    "booking.reference": "Besprekingsverwysing",
    "booking.status": "Status",
    "booking.passenger": "Passasier",
    "booking.contact": "Kontakbesonderhede",
    "booking.payment": "Betaling",
    "booking.total": "Totaal",
    "booking.seats": "Sitplekke",
    "booking.confirmed": "Bespreking Bevestig",
    "booking.pending": "Hangend",
    "booking.cancelled": "Gekanselleer",
    
    // Common
    "common.loading": "Laai...",
    "common.error": "Fout",
    "common.success": "Sukses",
    "common.cancel": "Kanselleer",
    "common.submit": "Dien in",
    "common.save": "Stoor",
    "common.edit": "Redigeer",
    "common.delete": "Skrap",
    "common.back": "Terug",
    "common.next": "Volgende",
    "common.price": "Prys",
    "common.available": "Beskikbaar",
    "common.unavailable": "Nie beskikbaar nie",
    
    // Bus Results
    "bus.available": "Beskikbare Busse",
    "bus.departure": "Vertrek",
    "bus.arrival": "Aankoms",
    "bus.duration": "Duur",
    "bus.operator": "Operateur",
    "bus.amenities": "Geriewe",
    "bus.seats": "Sitplekke Beskikbaar",
    
    // Event Results
    "event.available": "Beskikbare Geleenthede",
    "event.venue": "Lokaal",
    "event.date": "Datum",
    "event.time": "Tyd",
    "event.tickets": "Kaartjies Beskikbaar",
    "event.type": "Geleentheid Tipe",
  },
  sn: {
    // Navigation
    "nav.home": "Kumba",
    "nav.buses": "Mabhazi",
    "nav.events": "Zviitiko",
    "nav.bookings": "Zvandakachengeta",
    "nav.help": "Rubatsiro",
    "nav.profile": "Profaera",
    "nav.signin": "Pinda Mukati",
    "nav.signup": "Nyoresa",
    "nav.signout": "Buda",
    
    // Search
    "search.from": "Kubva",
    "search.to": "Kuenda",
    "search.date": "Zuva",
    "search.search": "Tsvaga",
    "search.passengers": "Vafambi",
    "search.adults": "Vakuru",
    "search.children": "Vana",
    
    // Booking
    "booking.confirm": "Simbisa Kuchengeta",
    "booking.reference": "Nhamba Yekuchengeta",
    "booking.status": "Chimiro",
    "booking.passenger": "Mufambi",
    "booking.contact": "Ruzivo Rwekubatana",
    "booking.payment": "Kubhadhara",
    "booking.total": "Zvose",
    "booking.seats": "Zvigaro",
    "booking.confirmed": "Kuchengeta Kwasimbiswa",
    "booking.pending": "Zvichimirira",
    "booking.cancelled": "Zvakadzorwa",
    
    // Common
    "common.loading": "Zviri kurodha...",
    "common.error": "Kukanganisa",
    "common.success": "Kubudirira",
    "common.cancel": "Dzora",
    "common.submit": "Tumira",
    "common.save": "Chengetedza",
    "common.edit": "Gadzirisa",
    "common.delete": "Bvisa",
    "common.back": "Dzokera",
    "common.next": "Zvitevera",
    "common.price": "Mutengo",
    "common.available": "Zviripo",
    "common.unavailable": "Hazvipo",
    
    // Bus Results
    "bus.available": "Mabhazi Aripo",
    "bus.departure": "Kubva",
    "bus.arrival": "Kusvika",
    "bus.duration": "Nguva",
    "bus.operator": "Mutyairi",
    "bus.amenities": "Zvinodiwa",
    "bus.seats": "Zvigaro Zviripo",
    
    // Event Results
    "event.available": "Zviitiko Zviripo",
    "event.venue": "Nzvimbo",
    "event.date": "Zuva",
    "event.time": "Nguva",
    "event.tickets": "Matikiti Aripo",
    "event.type": "Rudzi Rwechiitiko",
  },
  tn: {
    // Navigation
    "nav.home": "Gae",
    "nav.buses": "Dibese",
    "nav.events": "Ditiragalo",
    "nav.bookings": "Dibukiso tsa me",
    "nav.help": "Thuso",
    "nav.profile": "Profaele",
    "nav.signin": "Tsena",
    "nav.signup": "Kwala",
    "nav.signout": "Tswa",
    
    // Search
    "search.from": "Go tswa",
    "search.to": "Go ya",
    "search.date": "Letlha",
    "search.search": "Batla",
    "search.passengers": "Bapalami",
    "search.adults": "Bagolo",
    "search.children": "Bana",
    
    // Booking
    "booking.confirm": "Tlhomamisa Poloko",
    "booking.reference": "Nomoro ya Poloko",
    "booking.status": "Seemo",
    "booking.passenger": "Mopalami",
    "booking.contact": "Dintlha tsa Tlhaeletsano",
    "booking.payment": "Tuelo",
    "booking.total": "Kakaretso",
    "booking.seats": "Ditulo",
    "booking.confirmed": "Poloko e Tlhomamisitswe",
    "booking.pending": "E emetse",
    "booking.cancelled": "E khansetswe",
    
    // Common
    "common.loading": "E a loda...",
    "common.error": "Phoso",
    "common.success": "Katlego",
    "common.cancel": "Khansela",
    "common.submit": "Romela",
    "common.save": "Boloka",
    "common.edit": "Baakanya",
    "common.delete": "Phimola",
    "common.back": "Morago",
    "common.next": "Latelang",
    "common.price": "Tlhotlhwa",
    "common.available": "E teng",
    "common.unavailable": "Ga e yo",
    
    // Bus Results
    "bus.available": "Dibese tse di Leng Teng",
    "bus.departure": "Go tswa",
    "bus.arrival": "Go goroga",
    "bus.duration": "Nako",
    "bus.operator": "Motshetsi",
    "bus.amenities": "Dithuso",
    "bus.seats": "Ditulo tse di Leng Teng",
    
    // Event Results
    "event.available": "Ditiragalo tse di Leng Teng",
    "event.venue": "Lefelo",
    "event.date": "Letlha",
    "event.time": "Nako",
    "event.tickets": "Dikete tse di Leng Teng",
    "event.type": "Mofuta wa Tiragalo",
  },
  bem: {
    // Navigation
    "nav.home": "Ku Ng'anda",
    "nav.buses": "Imbasu",
    "nav.events": "Ifikalenga",
    "nav.bookings": "Ifibukila Fyandi",
    "nav.help": "Ubwafwilisho",
    "nav.profile": "Ipurofayili",
    "nav.signin": "Ingila",
    "nav.signup": "Ilemba Ishina",
    "nav.signout": "Fuma",
    
    // Search
    "search.from": "Ukufuma",
    "search.to": "Ukuya",
    "search.date": "Ubushiku",
    "search.search": "Londelela",
    "search.passengers": "Abendesha",
    "search.adults": "Abakulu",
    "search.children": "Abana",
    
    // Booking
    "booking.confirm": "Ishibisha Ukubukila",
    "booking.reference": "Inombolo ya Kubukila",
    "booking.status": "Incende",
    "booking.passenger": "Uwendesha",
    "booking.contact": "Ifya Kulandana",
    "booking.payment": "Ukulipila",
    "booking.total": "Fyonse",
    "booking.seats": "Ifipuna",
    "booking.confirmed": "Ukubukila Kwashibishiwa",
    "booking.pending": "Chilelekesha",
    "booking.cancelled": "Chakafyufulwa",
    
    // Common
    "common.loading": "Chilelodilapo...",
    "common.error": "Iciposhele",
    "common.success": "Ukukonkela",
    "common.cancel": "Fyufya",
    "common.submit": "Tumina",
    "common.save": "Sunga",
    "common.edit": "Sinja",
    "common.delete": "Fimya",
    "common.back": "Ukubwelela",
    "common.next": "Icilandile",
    "common.price": "Umtengo",
    "common.available": "Chili Apo",
    "common.unavailable": "Tachilapo",
    
    // Bus Results
    "bus.available": "Imbasu Ishili Apo",
    "bus.departure": "Ukufuma",
    "bus.arrival": "Ukufika",
    "bus.duration": "Intanshi",
    "bus.operator": "Uwendesha",
    "bus.amenities": "Ifikolesha",
    "bus.seats": "Ifipuna Fishili Apo",
    
    // Event Results
    "event.available": "Ifikalenga Fishili Apo",
    "event.venue": "Incende",
    "event.date": "Ubushiku",
    "event.time": "Intanshi",
    "event.tickets": "Amatikiti Yaliapo",
    "event.type": "Ubumi bwa Kalenga",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(languages[0]);

  const t = (key: string): string => {
    return translations[language.code]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
