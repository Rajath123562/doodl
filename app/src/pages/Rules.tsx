/**
 * DOODL Rules & Help Page
 */

import React from 'react';

export const Rules: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="border-b border-[#e8e5de] pb-4">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-[#707687] hover:text-[#1f2330] mb-1"
        >
          ← Back to Home
        </button>
        <h1 className="font-head font-extrabold text-3xl text-[#1f2330]">Rules & How to Play</h1>
        <p className="text-xs text-[#707687]">
          Everything you need to know about DOODL game modes, scoring, and etiquette.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#e8e5de] p-8 shadow-sm space-y-6 text-sm leading-relaxed text-[#555966]">
        <section className="space-y-2">
          <h2 className="font-head font-extrabold text-xl text-[#1f2330]">1. Classic Drawing & Guessing</h2>
          <p>
            Players take turns drawing secret words while other players guess in real-time.
            When it is your turn to draw, you receive three candidate words and 10 seconds to pick one.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-head font-extrabold text-xl text-[#1f2330]">2. Server-Authoritative Scoring</h2>
          <p>
            The faster you guess the word correctly, the more points you earn!
            Points are calculated on the server using remaining round time, speed ranking bonus, and hint penalties.
            The drawer receives 75 points per unique player who correctly guesses their drawing (capped at 300 points).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-head font-extrabold text-xl text-[#1f2330]">3. Game Modes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Classic:</b> Standard rounds with 60–120s timer.</li>
            <li><b>Blitz:</b> Fast-paced 20–45s drawing rounds for rapid guessing.</li>
            <li><b>Drawing Duels:</b> Two drawers draw simultaneously on separate canvases for the same prompt!</li>
            <li><b>Chaos Mode:</b> Random server modifiers (limited palette, thick brush, timer rush).</li>
            <li><b>Team Battles:</b> Team A vs Team B aggregated scoring.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-head font-extrabold text-xl text-[#1f2330]">4. Privacy & Safety</h2>
          <p>
            DOODL is guest-first and requires no passwords or email addresses.
            Drawings and chat messages are filtered to ensure a safe environment for all players.
          </p>
        </section>
      </div>
    </div>
  );
};
