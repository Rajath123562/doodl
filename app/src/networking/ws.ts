/**
 * DOODL Real-time WebSocket Client
 * Manages reliable connection, monotonic seq, reconnect backoff, and event dispatch.
 */

import type { ClientIntent, ServerEnvelope, ServerEventType } from '@shared/protocol';

export type EventHandler<T = any> = (payload: T, envelope: ServerEnvelope<T>) => void;

export class DoodlWebSocket {
  private ws: WebSocket | null = null;
  private roomCode: string;
  private seatId: string;
  private grant: string;
  private handlers = new Map<ServerEventType, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isExplicitlyClosed = false;
  private pendingQueue: string[] = [];

  public lastSeq = 0;
  public stateVersion = 0;
  public isConnected = false;

  constructor(roomCode: string, seatId: string, grant: string) {
    this.roomCode = roomCode.toUpperCase();
    this.seatId = seatId;
    this.grant = grant;
  }

  public connect() {
    this.isExplicitlyClosed = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/api/rooms/${this.roomCode}/socket?grant=${encodeURIComponent(this.grant)}`;

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      this.handleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.flushQueue();
      this.dispatch('room.memberJoined', { seat: { id: this.seatId } } as any, {
        v: 1,
        type: 'room.memberJoined',
        seq: this.lastSeq,
        stateVersion: this.stateVersion,
        serverTimeMs: Date.now(),
        payload: null,
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data) as ServerEnvelope;
        if (envelope.seq > this.lastSeq) this.lastSeq = envelope.seq;
        if (envelope.stateVersion > this.stateVersion) this.stateVersion = envelope.stateVersion;

        this.dispatch(envelope.type, envelope.payload, envelope);
      } catch (e) {
        console.error('Failed to parse incoming WebSocket message', e);
      }
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      if (!this.isExplicitlyClosed && event.code !== 1008) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.warn('WebSocket error', err);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  public on<T = any>(type: ServerEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  private dispatch<T = any>(type: ServerEventType, payload: T, envelope: ServerEnvelope<T>) {
    const list = this.handlers.get(type);
    if (list) {
      for (const fn of list) {
        try {
          fn(payload, envelope);
        } catch (e) {
          console.error(`Error in event handler for ${type}`, e);
        }
      }
    }
  }

  public sendIntent(type: ClientIntent, payload: Record<string, unknown> = {}, matchId?: string, turnId?: string) {
    const clientEventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const msg = JSON.stringify({
      v: 1,
      type,
      clientEventId,
      matchId,
      turnId,
      payload,
    });

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.pendingQueue.push(msg);
    }
  }

  private flushQueue() {
    while (this.pendingQueue.length > 0 && this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.pendingQueue.shift();
      if (msg) this.ws.send(msg);
    }
  }

  public close() {
    this.isExplicitlyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
