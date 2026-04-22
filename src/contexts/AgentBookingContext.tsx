import { createContext, useContext, useState, ReactNode } from "react";
import { AgentClient } from "@/types/merchant";

interface AgentBookingState {
  isAgentBooking: boolean;
  selectedClient: AgentClient | null;
  agentProfileId: string | null;
  agentCommissionRate: number;
}

interface AgentBookingContextType extends AgentBookingState {
  setAgentBooking: (client: AgentClient, agentProfileId: string, commissionRate: number) => void;
  clearAgentBooking: () => void;
}

const AgentBookingContext = createContext<AgentBookingContextType | undefined>(undefined);

export const AgentBookingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AgentBookingState>({
    isAgentBooking: false,
    selectedClient: null,
    agentProfileId: null,
    agentCommissionRate: 0,
  });

  const setAgentBooking = (client: AgentClient, agentProfileId: string, commissionRate: number) => {
    setState({
      isAgentBooking: true,
      selectedClient: client,
      agentProfileId,
      agentCommissionRate: commissionRate,
    });
  };

  const clearAgentBooking = () => {
    setState({
      isAgentBooking: false,
      selectedClient: null,
      agentProfileId: null,
      agentCommissionRate: 0,
    });
  };

  return (
    <AgentBookingContext.Provider value={{ ...state, setAgentBooking, clearAgentBooking }}>
      {children}
    </AgentBookingContext.Provider>
  );
};

export const useAgentBooking = () => {
  const context = useContext(AgentBookingContext);
  if (context === undefined) {
    throw new Error("useAgentBooking must be used within an AgentBookingProvider");
  }
  return context;
};
