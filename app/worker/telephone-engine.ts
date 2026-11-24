/**
 * DOODL V4.2 — Drawing Telephone Engine (Authoritative Simultaneous Router)
 * Implements T01–T09 acceptance criteria:
 * - Alternating simultaneous steps: Prompt (40s) -> Draw (60s) -> Describe (35s)
 * - Permutation routing: chain c at step s assigned to seat (c + s) % N
 * - Private single-prior-artifact delivery
 * - Draft auto-finalization on timeout
 * - Final reveal album compilation
 */

import type {
  PublicSeat,
  TelephoneChain,
  TelephoneArtifact,
  TelephoneAssignment,
  TelephoneStepType,
  StrokeCommand,
} from '../shared/game-types';
import { generateRandomId } from './auth';

export class TelephoneEngine {
  private matchId: string;
  private participants: { seatId: string; nickname: string }[] = [];
  private totalSteps: number = 4;
  private currentStepIndex: number = 0;
  private chains: Map<string, TelephoneChain> = new Map(); // chainId -> chain
  private drafts: Map<string, { text?: string; strokes?: StrokeCommand[] }> = new Map(); // `${step}_${seatId}` -> draft
  private submittedSeats: Set<string> = new Set();
  private stepDeadlineAtMs: number = 0;

  constructor(matchId: string) {
    this.matchId = matchId;
  }

  public initMatch(seats: PublicSeat[], requestedChainLength?: number): { totalSteps: number } {
    const eligible = seats.filter((s) => s.connected && s.role !== 'spectator');
    if (eligible.length < 4) {
      throw new Error(`Drawing Telephone requires at least 4 players (got ${eligible.length})`);
    }

    this.participants = eligible.map((s) => ({ seatId: s.id, nickname: s.nickname }));
    const N = this.participants.length;
    this.totalSteps = Math.min(N, requestedChainLength && requestedChainLength >= 4 ? requestedChainLength : N);
    this.currentStepIndex = 0;
    this.chains.clear();
    this.drafts.clear();
    this.submittedSeats.clear();

    // Initialize N independent chains
    for (let c = 0; c < N; c++) {
      const chainId = `chain_${c}_${generateRandomId('tel')}`;
      this.chains.set(chainId, {
        id: chainId,
        originSeatId: this.participants[c].seatId,
        originNickname: this.participants[c].nickname,
        artifacts: [],
      });
    }

    return { totalSteps: this.totalSteps };
  }

  public getStepType(stepIndex: number): TelephoneStepType {
    if (stepIndex === 0) return 'prompt';
    if (stepIndex % 2 === 1) return 'draw';
    return 'describe';
  }

  public getStepDurationSeconds(stepIndex: number): number {
    const type = this.getStepType(stepIndex);
    if (type === 'prompt') return 40;
    if (type === 'draw') return 60;
    return 35; // describe
  }

  public startStep(stepIndex: number, nowMs: number = Date.now()): {
    assignments: Map<string, TelephoneAssignment>; // seatId -> assignment
    deadlineAtMs: number;
    stepType: TelephoneStepType;
  } {
    this.currentStepIndex = stepIndex;
    this.submittedSeats.clear();
    const duration = this.getStepDurationSeconds(stepIndex) * 1000;
    this.stepDeadlineAtMs = nowMs + duration;
    const stepType = this.getStepType(stepIndex);
    const N = this.participants.length;
    const chainList = Array.from(this.chains.values());
    const assignments = new Map<string, TelephoneAssignment>();

    // Permutation Routing: Chain c at step s is assigned to participant (c + s) % N
    for (let c = 0; c < N; c++) {
      const seatIndex = (c + stepIndex) % N;
      const assignedParticipant = this.participants[seatIndex];
      const chain = chainList[c];

      let previousArtifact: TelephoneAssignment['previousArtifact'] = undefined;
      if (stepIndex > 0) {
        const prior = chain.artifacts[stepIndex - 1];
        if (prior) {
          previousArtifact = {
            stepType: prior.stepType,
            text: prior.text,
            strokes: prior.strokes,
            authorNickname: prior.authorNickname,
            isMissing: prior.isMissing,
          };
        }
      }

      assignments.set(assignedParticipant.seatId, {
        matchId: this.matchId,
        stepIndex,
        totalSteps: this.totalSteps,
        chainId: chain.id,
        stepType,
        previousArtifact,
        deadlineAtMs: this.stepDeadlineAtMs,
      });
    }

    return { assignments, deadlineAtMs: this.stepDeadlineAtMs, stepType };
  }

  public saveDraft(seatId: string, stepIndex: number, text?: string, strokes?: StrokeCommand[]) {
    if (stepIndex !== this.currentStepIndex) return;
    this.drafts.set(`${stepIndex}_${seatId}`, { text, strokes });
  }

  public submitArtifact(
    seatId: string,
    stepIndex: number,
    text?: string,
    strokes?: StrokeCommand[]
  ): { allSubmitted: boolean; artifact: TelephoneArtifact } {
    if (stepIndex !== this.currentStepIndex) {
      throw new Error(`Step index mismatch: expected ${this.currentStepIndex}, got ${stepIndex}`);
    }

    const N = this.participants.length;
    const seatIndex = this.participants.findIndex((p) => p.seatId === seatId);
    if (seatIndex === -1) {
      throw new Error(`Seat ${seatId} not in participants`);
    }

    // Invert routing to locate chain: (c + s) % N = seatIndex -> c = (seatIndex - s + N) % N
    const chainIndex = (seatIndex - stepIndex + N) % N;
    const chainList = Array.from(this.chains.values());
    const chain = chainList[chainIndex];

    const participant = this.participants[seatIndex];
    const stepType = this.getStepType(stepIndex);

    const artifact: TelephoneArtifact = {
      id: generateRandomId('art'),
      chainId: chain.id,
      stepIndex,
      stepType,
      authorSeatId: seatId,
      authorNickname: participant.nickname,
      text: stepType === 'draw' ? undefined : (text || 'Something mysterious'),
      strokes: stepType === 'draw' ? (strokes || []) : undefined,
      isMissing: false,
      timestampMs: Date.now(),
    };

    chain.artifacts[stepIndex] = artifact;
    this.submittedSeats.add(seatId);

    return {
      allSubmitted: this.submittedSeats.size >= N,
      artifact,
    };
  }

  public autoFinalizeStep(stepIndex: number): void {
    if (stepIndex !== this.currentStepIndex) return;
    const N = this.participants.length;
    const chainList = Array.from(this.chains.values());
    const stepType = this.getStepType(stepIndex);

    for (let c = 0; c < N; c++) {
      const seatIndex = (c + stepIndex) % N;
      const participant = this.participants[seatIndex];
      const chain = chainList[c];

      if (!chain.artifacts[stepIndex]) {
        const draft = this.drafts.get(`${stepIndex}_${participant.seatId}`);
        const artifact: TelephoneArtifact = {
          id: generateRandomId('art'),
          chainId: chain.id,
          stepIndex,
          stepType,
          authorSeatId: participant.seatId,
          authorNickname: participant.nickname,
          text: stepType === 'draw' ? undefined : (draft?.text || 'A curious scribble'),
          strokes: stepType === 'draw' ? (draft?.strokes || []) : undefined,
          isMissing: !draft?.text && (!draft?.strokes || draft.strokes.length === 0),
          missingReason: 'Timed out before submitting',
          timestampMs: Date.now(),
        };
        chain.artifacts[stepIndex] = artifact;
        this.submittedSeats.add(participant.seatId);
      }
    }
  }

  public isComplete(): boolean {
    return this.currentStepIndex >= this.totalSteps - 1 && this.submittedSeats.size >= this.participants.length;
  }

  public getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  public getTotalSteps(): number {
    return this.totalSteps;
  }

  public getDeadlineAtMs(): number {
    return this.stepDeadlineAtMs;
  }

  public getAllChains(): TelephoneChain[] {
    return Array.from(this.chains.values());
  }
}
