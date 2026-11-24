/**
 * DOODL V4.2 — Party Mix Multi-Stage Engine
 * Implements P01–P08 acceptance criteria:
 * - 4 sequential stages: Classic -> Blitz -> Chaos -> Drawing Telephone
 * - Presets: Standard (45/30/40s) vs Short (30/20/25s)
 * - Chaos modifiers: monochrome, three_color, no_eraser, giant_brush
 * - Unified 300pt scoring: round(100 * (M - r) / (M - 1)) per competitive stage
 * - Stage lifecycle: STAGE_INTRO -> STAGE_PLAY -> STAGE_RESULTS -> NEXT
 */

import type {
  PublicSeat,
  PartyStageId,
  PartyStageConfig,
  ChaosModifierId,
  PartyStageResult,
  PartyStageRankingItem,
} from '../shared/game-types';
import { calculateNormalizedPartyPoints } from '../shared/rules';

export class PartyMixEngine {
  private matchId: string;
  private preset: 'standard' | 'short';
  private currentStageIndex: number = 0;
  private participants: { seatId: string; nickname: string }[] = [];
  private rawStageScores: Map<string, number> = new Map(); // seatId -> raw score in current stage
  private cumulativePartyPoints: Map<string, number> = new Map(); // seatId -> total normalized points (max 300)
  private stageHistory: PartyStageResult[] = [];

  private static readonly STAGES: { id: PartyStageId; name: string }[] = [
    { id: 'classic', name: 'Classic Drawing' },
    { id: 'blitz', name: 'Blitz Speedrun' },
    { id: 'chaos', name: 'Chaos Modifiers' },
    { id: 'telephone', name: 'Drawing Telephone' },
  ];

  private static readonly CHAOS_MODIFIERS: ChaosModifierId[] = [
    'monochrome',
    'three_color',
    'no_eraser',
    'giant_brush',
  ];

  constructor(matchId: string, preset: 'standard' | 'short' = 'standard') {
    this.matchId = matchId;
    this.preset = preset;
  }

  public initMatch(seats: PublicSeat[]) {
    const eligible = seats.filter((s) => s.connected && s.role !== 'spectator');
    if (eligible.length < 4) {
      throw new Error(`Party Mix requires at least 4 players (got ${eligible.length})`);
    }

    this.participants = eligible.map((s) => ({ seatId: s.id, nickname: s.nickname }));
    this.currentStageIndex = 0;
    this.rawStageScores.clear();
    this.cumulativePartyPoints.clear();
    this.stageHistory = [];

    for (const p of this.participants) {
      this.cumulativePartyPoints.set(p.seatId, 0);
    }
  }

  public getCurrentStageConfig(): PartyStageConfig {
    const stage = PartyMixEngine.STAGES[this.currentStageIndex];
    let drawSeconds: number;

    if (stage.id === 'classic') {
      drawSeconds = this.preset === 'short' ? 30 : 45;
    } else if (stage.id === 'blitz') {
      drawSeconds = this.preset === 'short' ? 20 : 30;
    } else if (stage.id === 'chaos') {
      drawSeconds = this.preset === 'short' ? 25 : 40;
    } else {
      drawSeconds = 45; // Telephone default
    }

    let chaosModifier: ChaosModifierId | undefined = undefined;
    if (stage.id === 'chaos') {
      const idx = Math.floor(Math.random() * PartyMixEngine.CHAOS_MODIFIERS.length);
      chaosModifier = PartyMixEngine.CHAOS_MODIFIERS[idx];
    }

    return {
      stageId: stage.id,
      stageIndex: this.currentStageIndex,
      totalStages: 4,
      name: stage.name,
      drawSeconds,
      chaosModifier,
    };
  }

  public recordRawScore(seatId: string, deltaPoints: number) {
    const current = this.rawStageScores.get(seatId) || 0;
    this.rawStageScores.set(seatId, current + deltaPoints);
  }

  public completeCurrentStage(): PartyStageResult {
    const stage = PartyMixEngine.STAGES[this.currentStageIndex];
    const M = this.participants.length;

    // Sort participants by raw stage score descending
    const sorted = [...this.participants]
      .map((p) => ({
        seatId: p.seatId,
        nickname: p.nickname,
        rawScore: this.rawStageScores.get(p.seatId) || 0,
      }))
      .sort((a, b) => b.rawScore - a.rawScore);

    // Compute standard competition ranking (1, 2, 2, 4)
    const rankings: PartyStageRankingItem[] = [];
    let currentRank = 1;

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].rawScore < sorted[i - 1].rawScore) {
        currentRank = i + 1;
      }

      // Telephone (Stage 4, index 3) awards 0 party points
      const isCompetitive = this.currentStageIndex < 3;
      const normalized = isCompetitive
        ? calculateNormalizedPartyPoints(M, currentRank, sorted[i].rawScore)
        : 0;

      rankings.push({
        seatId: sorted[i].seatId,
        nickname: sorted[i].nickname,
        rank: currentRank,
        rawScore: sorted[i].rawScore,
        normalizedPoints: normalized,
      });

      // Add to cumulative score
      const prior = this.cumulativePartyPoints.get(sorted[i].seatId) || 0;
      this.cumulativePartyPoints.set(sorted[i].seatId, prior + normalized);
    }

    const stageResult: PartyStageResult = {
      stageId: stage.id,
      stageIndex: this.currentStageIndex,
      stageName: stage.name,
      rankings,
    };

    this.stageHistory.push(stageResult);
    this.rawStageScores.clear();
    return stageResult;
  }

  public advanceStage(): { hasMoreStages: boolean; nextStageIndex: number } {
    this.currentStageIndex++;
    return {
      hasMoreStages: this.currentStageIndex < 4,
      nextStageIndex: this.currentStageIndex,
    };
  }

  public getCumulativePoints(seatId: string): number {
    return this.cumulativePartyPoints.get(seatId) || 0;
  }

  public getFinalLeaderboard(): { seatId: string; nickname: string; totalPoints: number; rank: number }[] {
    const sorted = [...this.participants]
      .map((p) => ({
        seatId: p.seatId,
        nickname: p.nickname,
        totalPoints: this.cumulativePartyPoints.get(p.seatId) || 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    let currentRank = 1;
    return sorted.map((item, idx) => {
      if (idx > 0 && item.totalPoints < sorted[idx - 1].totalPoints) {
        currentRank = idx + 1;
      }
      return { ...item, rank: currentRank };
    });
  }

  public getStageIndex(): number {
    return this.currentStageIndex;
  }

  public getMatchId(): string {
    return this.matchId;
  }
}
