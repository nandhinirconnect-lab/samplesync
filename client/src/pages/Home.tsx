import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/GlowButton";
import { useCreateEvent, useJoinEvent } from "@/hooks/use-events";
import { Zap, Smartphone, ArrowRight, Music, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [pin, setPin] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createEvent = useCreateEvent();
  const joinEvent = useJoinEvent();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      toast({
        title: "Event name required",
        description: "Please enter a name for your event.",
        variant: "destructive",
      });
      return;
    }
    
    const hostId = uuidv4();
    createEvent.mutate({
      name: eventName.trim(),
      hostId,
    });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN.",
        variant: "destructive",
      });
      return;
    }
    
    joinEvent.mutate(pin, {
      onError: (err) => {
        toast({
          title: "Join Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/10 mb-4"
          >
            <Zap className="w-12 h-12 text-primary" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white">
            TORCH<span className="text-gradient">SYNC</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xs mx-auto">
            Synchronize every phone in the crowd for an immersive light show.
          </p>
        </div>

        <div className="space-y-6">
          {/* Join Form */}
          <div className="glass-panel rounded-2xl p-1">
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                className="flex-1 bg-transparent border-none text-center text-xl font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/50 focus:ring-0 text-white h-14"
                pattern="\d{4}"
                inputMode="numeric"
              />
              <button
                type="submit"
                disabled={joinEvent.isPending || pin.length !== 4}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-6 font-bold disabled:opacity-50 transition-colors"
              >
                {joinEvent.isPending ? "..." : <ArrowRight />}
              </button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {!showCreateForm ? (
            <GlowButton 
              variant="primary" 
              size="lg" 
              className="w-full"
              onClick={() => setShowCreateForm(true)}
              disabled={createEvent.isPending}
            >
              Host an Event
            </GlowButton>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="glass-panel rounded-xl p-4">
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event name (e.g., New Year Party)"
                  maxLength={100}
                  className="w-full bg-transparent border-none text-white placeholder:text-muted-foreground focus:ring-0 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <GlowButton 
                  variant="primary" 
                  size="lg" 
                  className="flex-1"
                  type="submit"
                  disabled={createEvent.isPending || !eventName.trim()}
                >
                  {createEvent.isPending ? "Creating..." : "Create"}
                </GlowButton>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEventName("");
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl px-6 font-bold disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 pt-8">
          <div className="glass-panel p-4 rounded-xl flex flex-col items-center text-center gap-2">
            <Smartphone className="w-6 h-6 text-secondary" />
            <span className="text-xs text-white/60">No App Required</span>
          </div>
          <div className="glass-panel p-4 rounded-xl flex flex-col items-center text-center gap-2">
            <Music className="w-6 h-6 text-accent" />
            <span className="text-xs text-white/60">Music Sync</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
