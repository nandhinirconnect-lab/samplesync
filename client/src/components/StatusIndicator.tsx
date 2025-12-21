import { cn } from "@/lib/utils";

interface StatusProps {
  connected: boolean;
  latency?: number;
  label?: string;
  className?: string;
}

export function StatusIndicator({ connected, latency, label, className }: StatusProps) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md", className)}>
      <div className="relative flex h-2.5 w-2.5">
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          connected ? "bg-green-400" : "bg-red-400"
        )}></span>
        <span className={cn(
          "relative inline-flex rounded-full h-2.5 w-2.5",
          connected ? "bg-green-500" : "bg-red-500"
        )}></span>
      </div>
      
      <span className="text-xs font-medium text-white/80">
        {connected ? (
          label || "Connected"
        ) : (
          "Disconnected"
        )}
      </span>

      {connected && latency !== undefined && (
        <span className="text-[10px] text-white/40 font-mono ml-1 border-l border-white/10 pl-2">
          {Math.round(latency)}ms
        </span>
      )}
    </div>
  );
}
