import { Plus, ArrowLeftRight, Send, MoreHorizontal, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Action {
  icon: LucideIcon;
  label: string;
  to: string;
}

interface ActionGridProps {
  onAdd?: () => void;
  onMore?: () => void;
}

export function ActionGrid({ onAdd, onMore }: ActionGridProps) {
  const navigate = useNavigate();

  const actions: Array<Action & { onClick?: () => void }> = [
    { icon: Plus, label: "Add money", to: "", onClick: onAdd },
    { icon: ArrowLeftRight, label: "Exchange", to: "/wallet/exchange" },
    { icon: Send, label: "Transfer", to: "/pay/send" },
    { icon: MoreHorizontal, label: "More", to: "", onClick: onMore },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-6">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => (a.onClick ? a.onClick() : navigate(a.to))}
          className="flex flex-col items-center gap-2"
        >
          <div className="revolut-action-btn h-12 w-12 rounded-full flex items-center justify-center">
            <a.icon className="h-5 w-5" />
          </div>
          <span className="text-xs text-[hsl(var(--revolut-text))] font-medium">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
