/**
 * DOODL Host Settings Modal Component
 */

import React, { useState } from 'react';
import type { RoomSettings, GameMode, WordPackId } from '@shared/game-types';

interface HostSettingsModalProps {
  initialSettings: RoomSettings;
  onSave: (settings: RoomSettings) => void;
  onClose: () => void;
}

export const HostSettingsModal: React.FC<HostSettingsModalProps> = ({
  initialSettings,
  onSave,
  onClose,
}) => {
  const [settings, setSettings] = useState<RoomSettings>({ ...initialSettings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#eee9e2] shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6">
        <div className="flex items-center justify-between border-b border-[#f0eee9] pb-4">
          <h2 className="font-head font-extrabold text-2xl text-[#1f2330]">Room Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f2ee] flex items-center justify-center text-[#707687] hover:bg-[#e9e8e4]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Max Players */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Max Players (2 - 12)</label>
            <select
              value={settings.maxPlayers}
              onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              {[2, 4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n} Players
                </option>
              ))}
            </select>
          </div>

          {/* Rounds Per Player */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Rounds per Player (1 - 5)</label>
            <select
              value={settings.cyclesPerPlayer}
              onChange={(e) => setSettings({ ...settings, cyclesPerPlayer: Number(e.target.value) })}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Turn each' : 'Turns each'}
                </option>
              ))}
            </select>
          </div>

          {/* Draw Seconds */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Draw Time (seconds)</label>
            <select
              value={settings.drawSeconds}
              onChange={(e) => setSettings({ ...settings, drawSeconds: Number(e.target.value) })}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              {settings.gameMode === 'blitz' ? (
                <>
                  <option value={20}>20 Seconds</option>
                  <option value={30}>30 Seconds (Default)</option>
                  <option value={45}>45 Seconds</option>
                </>
              ) : (
                <>
                  <option value={60}>60 Seconds</option>
                  <option value={75}>75 Seconds</option>
                  <option value={90}>90 Seconds (Default)</option>
                  <option value={120}>120 Seconds</option>
                </>
              )}
            </select>
          </div>

          {/* Game Mode */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Game Mode</label>
            <select
              value={settings.gameMode}
              onChange={(e) => {
                const gm = e.target.value as GameMode;
                const newDraw = gm === 'blitz' ? 30 : 90;
                setSettings({ ...settings, gameMode: gm, drawSeconds: newDraw });
              }}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              <option value="classic">Classic (Standard Turn Rotation)</option>
              <option value="blitz">Blitz (Fast-paced Rounds)</option>
              <option value="duels">Drawing Duels (2 Simultaneous Drawers)</option>
              <option value="chaos">Chaos Mode (Seeded Modifiers)</option>
              <option value="teams">Team Battles (A vs B Squads)</option>
            </select>
          </div>

          {/* Word Pack */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Word Category</label>
            <select
              value={settings.wordPack}
              onChange={(e) => setSettings({ ...settings, wordPack: e.target.value as WordPackId })}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              <option value="everyday">Everyday Objects & Concepts</option>
              <option value="animals">Animals & Creatures</option>
              <option value="food">Food & Drinks</option>
              <option value="places">World Places & Landmarks</option>
              <option value="objects">Tools, Gadgets & Treasures</option>
              <option value="nature">Nature & Weather</option>
              <option value="sports">Sports & Activities</option>
              <option value="science">Science & Technology</option>
            </select>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#fd7259] hover:bg-[#e95d45] text-white py-3 rounded-xl font-bold text-sm shadow-[0_3px_0_#dc5b46] active:translate-y-0.5"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 bg-[#f4f2ee] hover:bg-[#eae8e3] text-[#252835] py-3 rounded-xl font-bold text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
