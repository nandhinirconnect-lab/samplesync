import { io } from 'socket.io-client';

function rndHostId() {
  try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2, 10); }
}

async function createEvent() {
  const res = await fetch('http://127.0.0.1:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `SocketTest ${Date.now()}`, hostId: rndHostId() }),
  });
  if (!res.ok) throw new Error('Failed to create event: ' + res.status);
  return res.json();
}

function delay(ms){ return new Promise(r=>setTimeout(r, ms)); }

(async function main(){
  try {
    const event = await createEvent();
    const eventId = event.id;
    console.log('Created event', { id: eventId, pin: event.pin });

    const attendee = io('http://127.0.0.1:5000', { query: { eventId: String(eventId), role: 'attendee' }, transports: ['websocket'] });
    attendee.on('connect', ()=>console.log('[attendee] connected', attendee.id));
    attendee.on('effect', (payload)=>console.log('[attendee] received effect', payload));
    attendee.on('connect_error', (err)=>console.error('[attendee] connect_error', err.message));

    const host = io('http://127.0.0.1:5000', { query: { eventId: String(eventId), role: 'host' }, transports: ['websocket'] });
    host.on('connect', async ()=>{
      console.log('[host] connected', host.id);
      await delay(500);
      const payload = { type: 'PULSE', startAt: Date.now() + 200, duration: 500 };
      console.log('[host] emitting', payload);
      host.emit('host_effect', { eventId, effect: payload });
    });
    host.on('connect_error', (err)=>console.error('[host] connect_error', err.message));

    // wait to observe
    await delay(4000);
    attendee.disconnect();
    host.disconnect();
    console.log('Test finished');
    process.exit(0);
  } catch (err) {
    console.error('Test error', err);
    process.exit(1);
  }
})();
