import { z } from "zod";

// Booking Form Validation
export const busSearchSchema = z.object({
  from: z.string()
    .trim()
    .min(2, "Departure city must be at least 2 characters")
    .max(100, "Departure city must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-]+$/, "Only letters, spaces, and hyphens allowed"),
  to: z.string()
    .trim()
    .min(2, "Arrival city must be at least 2 characters")
    .max(100, "Arrival city must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-]+$/, "Only letters, spaces, and hyphens allowed"),
  date: z.date({
    required_error: "Please select a date",
  }).refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "Date must be today or in the future",
  }),
});

export const roundTripBusSearchSchema = busSearchSchema.extend({
  returnDate: z.date({
    required_error: "Please select a return date",
  }).refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "Return date must be today or in the future",
  }),
}).refine((data) => data.returnDate >= data.date, {
  message: "Return date must be after departure date",
  path: ["returnDate"],
});

export const eventSearchSchema = z.object({
  location: z.string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location must be less than 100 characters"),
  eventType: z.string()
    .min(1, "Please select an event type"),
  date: z.date({
    required_error: "Please select a date",
  }).refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "Date must be today or in the future",
  }),
});

// Merchant Registration Validation
export const merchantRegistrationSchema = z.object({
  business_name: z.string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(200, "Business name must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-&'.]+$/, "Invalid business name format"),
  business_email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  business_phone: z.string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{8,20}$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  business_address: z.string()
    .trim()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  operator_name: z.string()
    .trim()
    .min(2, "Operator name must be at least 2 characters")
    .max(200, "Operator name must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-&'.]+$/, "Invalid operator name format"),
  role: z.enum(["bus_operator", "event_organizer", "travel_agent", "booking_agent"]),
});

// Payment Form Validation
export const paymentFormSchema = z.object({
  transactionRef: z.string()
    .trim()
    .min(4, "Transaction reference must be at least 4 characters")
    .max(100, "Transaction reference must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\-_]+$/, "Only alphanumeric characters, dashes, and underscores allowed"),
});

// Auth Validation
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password needs: 1 uppercase, 1 lowercase, and 1 number"),
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(1, "Password is required"),
});

// Passenger Details Validation
export const passengerDetailsSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z.string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{8,20}$/, "Invalid phone number format"),
});
