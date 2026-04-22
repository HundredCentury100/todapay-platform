import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AgentBookingProvider } from "@/contexts/AgentBookingContext";
import { TripCartProvider } from "@/contexts/TripCartContext";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SkipLink } from "@/components/ui/accessibility";
import { toast } from "sonner";

// Global error handlers for React Query
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toasts for queries that don't have their own error handling
      if (query.meta?.showErrorToast !== false) {
        console.error("Query error:", error);
        // Don't toast for auth-related 401/403 errors (handled elsewhere)
        const message = error instanceof Error ? error.message : "An error occurred";
        if (!message.includes("JWT") && !message.includes("unauthorized")) {
          toast.error("Failed to load data. Please try again.");
        }
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only show error toasts for mutations that don't have their own error handling
      if (mutation.meta?.showErrorToast !== false) {
        console.error("Mutation error:", error);
        const message = error instanceof Error ? error.message : "An error occurred";
        if (!message.includes("JWT") && !message.includes("unauthorized")) {
          toast.error(message || "Operation failed. Please try again.");
        }
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes("4")) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Global unhandled rejection handler for non-React errors
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ImpersonationProvider>
            <NotificationProvider>
              <LanguageProvider>
                <CurrencyProvider>
                  <LocationProvider>
                    <AgentBookingProvider>
                      <TripCartProvider>
                        <TooltipProvider>
                          <SkipLink targetId="main-content" />
                          <App />
                        </TooltipProvider>
                      </TripCartProvider>
                    </AgentBookingProvider>
                  </LocationProvider>
                </CurrencyProvider>
              </LanguageProvider>
            </NotificationProvider>
          </ImpersonationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
