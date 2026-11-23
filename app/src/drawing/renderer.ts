/**
 * DOODL High-Precision Vector Canvas Engine
 * Handles normalized integer coordinates (0..65535), DPI scaling, smooth interpolation, and vector replay.
 */

import type { StrokeCommand, NormalizedPoint, DrawingTool } from '@shared/game-types';

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private commands: StrokeCommand[] = [];
  private activeLocalStroke: StrokeCommand | null = null;
  private onStrokeBegin?: (stroke: StrokeCommand) => void;
  private onStrokeAppend?: (strokeId: string, points: NormalizedPoint[]) => void;
  private onStrokeEnd?: (strokeId: string, point?: NormalizedPoint) => void;

  private isDrawing = false;
  private activeTool: DrawingTool = 'pencil';
  private activeColor = '#202638';
  private activeSize = 7;
  private activeSticker = '⭐';
  private isInteractive = false;

  private batchPoints: NormalizedPoint[] = [];
  private batchTimer: any = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('2D context not available');
    this.ctx = context;

    this.setupPointerListeners();
    this.resize();
  }

  public setCallbacks(callbacks: {
    onStrokeBegin?: (stroke: StrokeCommand) => void;
    onStrokeAppend?: (strokeId: string, points: NormalizedPoint[]) => void;
    onStrokeEnd?: (strokeId: string, point?: NormalizedPoint) => void;
  }) {
    this.onStrokeBegin = callbacks.onStrokeBegin;
    this.onStrokeAppend = callbacks.onStrokeAppend;
    this.onStrokeEnd = callbacks.onStrokeEnd;
  }

  public setInteractive(enabled: boolean) {
    this.isInteractive = enabled;
  }

  public setTool(tool: DrawingTool) {
    this.activeTool = tool;
  }

  public setColor(color: string) {
    this.activeColor = color;
  }

  public setSize(size: number) {
    this.activeSize = size;
  }

  public setSticker(sticker: string) {
    this.activeSticker = sticker;
  }

  public resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.redrawAll();
  }

  private normalizeCoords(clientX: number, clientY: number): NormalizedPoint {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(65535, Math.round(((clientX - rect.left) / rect.width) * 65535)));
    const y = Math.max(0, Math.min(65535, Math.round(((clientY - rect.top) / rect.height) * 65535)));
    return { x, y };
  }

  private denormalizeCoords(point: NormalizedPoint): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (point.x / 65535) * rect.width,
      y: (point.y / 65535) * rect.height,
    };
  }

  private setupPointerListeners() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.isInteractive) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.isDrawing = true;

      const normPoint = this.normalizeCoords(e.clientX, e.clientY);
      const strokeId = `stk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      this.activeLocalStroke = {
        strokeId,
        turnId: '',
        canvasId: 'main',
        tool: this.activeTool,
        color: this.activeColor,
        size: this.activeSize,
        points: [normPoint],
        stickerId: this.activeTool === 'sticker' ? this.activeSticker : undefined,
      };

      this.batchPoints = [normPoint];
      this.onStrokeBegin?.(this.activeLocalStroke);

      this.renderStrokeCommand(this.activeLocalStroke);

      this.batchTimer = setInterval(() => {
        if (this.batchPoints.length > 0 && this.activeLocalStroke) {
          this.onStrokeAppend?.(this.activeLocalStroke.strokeId, [...this.batchPoints]);
          this.batchPoints = [];
        }
      }, 35); // ~28 Hz batching
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing || !this.activeLocalStroke) return;

      const normPoint = this.normalizeCoords(e.clientX, e.clientY);
      this.activeLocalStroke.points.push(normPoint);
      this.batchPoints.push(normPoint);

      // Render immediate segment
      const pts = this.activeLocalStroke.points;
      if (pts.length >= 2) {
        this.renderSegment(
          this.activeLocalStroke,
          pts[pts.length - 2],
          pts[pts.length - 1],
          pts.length
        );
      }
    });

    const finishStroke = (e: PointerEvent) => {
      if (!this.isDrawing || !this.activeLocalStroke) return;
      this.isDrawing = false;
      if (this.batchTimer) {
        clearInterval(this.batchTimer);
        this.batchTimer = null;
      }

      const endPoint = this.normalizeCoords(e.clientX, e.clientY);
      if (this.batchPoints.length > 0) {
        this.onStrokeAppend?.(this.activeLocalStroke.strokeId, [...this.batchPoints]);
        this.batchPoints = [];
      }

      this.onStrokeEnd?.(this.activeLocalStroke.strokeId, endPoint);
      this.commands.push(this.activeLocalStroke);
      this.activeLocalStroke = null;
    };

    this.canvas.addEventListener('pointerup', finishStroke);
    this.canvas.addEventListener('pointercancel', finishStroke);
  }

  public applyRemoteOps(ops: StrokeCommand[]) {
    for (const op of ops) {
      const existing = this.commands.find((c) => c.strokeId === op.strokeId);
      if (existing) {
        // Append points
        const startIdx = existing.points.length;
        existing.points.push(...op.points);
        for (let i = Math.max(1, startIdx); i < existing.points.length; i++) {
          this.renderSegment(existing, existing.points[i - 1], existing.points[i], i);
        }
      } else {
        this.commands.push(op);
        this.renderStrokeCommand(op);
      }
    }
  }

  public clear() {
    this.commands = [];
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  public redrawAll() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    for (const cmd of this.commands) {
      this.renderStrokeCommand(cmd);
    }
  }

  private renderStrokeCommand(cmd: StrokeCommand) {
    if (cmd.points.length === 0) return;
    if (cmd.tool === 'sticker') {
      const p = this.denormalizeCoords(cmd.points[0]);
      this.ctx.font = `${cmd.size * 4}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(cmd.stickerId || '⭐', p.x, p.y);
      return;
    }

    if (cmd.points.length === 1) {
      const p = this.denormalizeCoords(cmd.points[0]);
      this.ctx.fillStyle = cmd.tool === 'eraser' ? '#ffffff' : cmd.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, cmd.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      return;
    }

    if (cmd.tool === 'line') {
      const start = this.denormalizeCoords(cmd.points[0]);
      const end = this.denormalizeCoords(cmd.points[cmd.points.length - 1]);
      this.ctx.strokeStyle = cmd.color;
      this.ctx.lineWidth = cmd.size;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
      return;
    }

    for (let i = 1; i < cmd.points.length; i++) {
      this.renderSegment(cmd, cmd.points[i - 1], cmd.points[i], i);
    }
  }

  private renderSegment(cmd: StrokeCommand, p1: NormalizedPoint, p2: NormalizedPoint, index: number) {
    const start = this.denormalizeCoords(p1);
    const end = this.denormalizeCoords(p2);

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (cmd.tool === 'eraser') {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = cmd.size * 2.5;
    } else if (cmd.tool === 'rainbow') {
      const hue = (index * 8) % 360;
      this.ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
      this.ctx.lineWidth = cmd.size;
    } else {
      this.ctx.strokeStyle = cmd.color;
      this.ctx.lineWidth = cmd.size;
    }

    this.ctx.stroke();
  }

  public exportPNG(): string {
    return this.canvas.toDataURL('image/png');
  }
}
