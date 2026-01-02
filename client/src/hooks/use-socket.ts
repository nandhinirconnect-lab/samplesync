import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { EffectPayload, TimeSyncResponse } from '@shared/schema';

// Simple offset calculation: 
// We assume symmetrical latency.
// offset = serverTime - (clientTime + latency/2)
// correctedTime = Date.now() + offset

export interface ParticipantStats {
  activeNow: number;
  totalJoined: number;
}

export function useSocket(eventId?: number, role: 'host' | 'attendee' = 'attendee', pin?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [lastEffect, setLastEffect] = useState<EffectPayload | null>(null);
  const [participants, setParticipants] = useState<ParticipantStats>({ activeNow: 0, totalJoined: 0 });

  useEffect(() => {
    if (!eventId) return;

    // Connect to namespace or default
    const socket = io({
      query: { eventId: eventId.toString(), role },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
      
      // Notify server that we're joining the event
      if (eventId && pin) {
        socket.emit('join_event', { pin, eventId, role });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('effect', (payload: EffectPayload) => {
      // Calculate delay until start
      const now = Date.now() + timeOffset;
      const delay = Math.max(0, payload.startAt - now);
      
      // Schedule the effect update
      setTimeout(() => {
        setLastEffect(payload);
      }, delay);
    });

    socket.on('participant_update', (stats: { active: number; total: number }) => {
      setParticipants({ activeNow: stats.active, totalJoined: stats.total });
    });

    // Time Sync Logic
    const sync = async () => {
      const clientPerfStart = performance.now();
      const clientEpochStart = Date.now();
      socket.emit('time:sync', { clientPerf: clientPerfStart, clientEpoch: clientEpochStart }, (response: TimeSyncResponse) => {
        const clientPerfEnd = performance.now();
        const rtt = clientPerfEnd - clientPerfStart;
        const currentLatency = rtt / 2;

        // Server provides both monotonic and epoch timestamps
        const serverEpoch = response.serverEpoch;
        // Compute offset in epoch ms: serverEpoch - (clientEpoch + latency)
        const computedOffset = serverEpoch - (clientEpochStart + currentLatency);

        setLatency(currentLatency);
        setTimeOffset(prev => (prev * 0.6) + (computedOffset * 0.4));
      });
    };

    // initial sync and periodic
    sync();
    const syncInterval = setInterval(sync, 1500);

    return () => {
      clearInterval(syncInterval);
      socket.disconnect();
    };
  }, [eventId, role, pin]);

  const emitEffect = (type: EffectPayload['type'], options: Partial<EffectPayload> = {}) => {
    if (!socketRef.current) return;
    
    // Schedule start time with margin based on measured latency (use smaller baseline)
    const now = Date.now() + timeOffset;
    const margin = Math.max(100, Math.ceil(latency * 1.2));
    const startAt = now + margin;

    const payload: EffectPayload = {
      type,
      startAt,
      ...options
    };
    
    // Immediate local effect (for both host and attendee)
    setLastEffect(payload); 
    
    // Broadcast to all participants if host
    if (role === 'host' && socketRef.current && eventId) {
      socketRef.current.emit('host_effect', { eventId, effect: payload });
    }
  };

  return { isConnected, latency, timeOffset, lastEffect, emitEffect, participants };
}
