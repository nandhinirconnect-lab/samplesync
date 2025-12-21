import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { EffectPayload, TimeSyncResponse } from '@shared/schema';

// Simple offset calculation: 
// We assume symmetrical latency.
// offset = serverTime - (clientTime + latency/2)
// correctedTime = Date.now() + offset

export function useSocket(eventId?: number, role: 'host' | 'attendee' = 'attendee') {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [lastEffect, setLastEffect] = useState<EffectPayload | null>(null);

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

    // Time Sync Logic
    const syncInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('time:sync', { clientSendTime: start }, (response: TimeSyncResponse) => {
        const end = Date.now();
        const rtt = end - start;
        const currentLatency = rtt / 2;
        
        // Calculate offset
        // Server Time = Client Time + Offset
        // Offset = Server Time - Client Time
        // We use the midpoint of the RTT as the "Server Time" instant matching "Client Send + Latency"
        const serverTimeAtReceive = response.serverReceiveTime;
        const computedOffset = serverTimeAtReceive - (start + currentLatency);
        
        setLatency(currentLatency);
        setTimeOffset(prev => (prev * 0.8) + (computedOffset * 0.2)); // Smooth it out
      });
    }, 2000);

    return () => {
      clearInterval(syncInterval);
      socket.disconnect();
    };
  }, [eventId, role, timeOffset]);

  const emitEffect = (type: EffectPayload['type'], options: Partial<EffectPayload> = {}) => {
    if (!socketRef.current || role !== 'host') return;
    
    // Future scheduling: 100ms in future to allow propagation
    const now = Date.now() + timeOffset;
    const startAt = now + 150; 

    const payload: EffectPayload = {
      type,
      startAt,
      ...options
    };
    
    // Optimistic update for host
    setLastEffect(payload); 
    socketRef.current.emit('effect', payload);
  };

  return { isConnected, latency, timeOffset, lastEffect, emitEffect };
}
