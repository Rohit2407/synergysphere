import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-primary text-primary-foreground",
  };

  const Icon = icons[type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
        show ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      } ${colors[type]}`}
      data-testid="notification"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span>{message}</span>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 hover:opacity-70"
          data-testid="notification-close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
