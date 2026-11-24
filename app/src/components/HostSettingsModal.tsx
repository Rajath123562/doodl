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
          {/* Game Mode */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Game Mode</label>
            <select
              value={settings.gameMode}
              onChange={(e) => {
                const gm = e.target.value as GameMode;
                const max = gm === 'party_mix' ? Math.min(settings.maxPlayers, 12) : gm === 'telephone' ? Math.min(settings.maxPlayers, 16) : settings.maxPlayers;
                const min = gm === 'telephone' || gm === 'party_mix' ? Math.max(max, 4) : max;
                setSettings({ ...settings, gameMode: gm, maxPlayers: min });
              }}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              <option value="classic">Classic (Drawing & Guessing, 2–20 players)</option>
              <option value="telephone">Drawing Telephone (Chain Reaction, 4–16 players)</option>
              <option value="party_mix">Party Mix (4-Stage Variety, 4–12 players)</option>
            </select>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-xs font-bold text-[#1f2330] mb-1">Max Players</label>
            <select
              value={settings.maxPlayers}
              onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
              className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
            >
              {settings.gameMode === 'classic' && (
                <>
                  <option value={2}>2 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={6}>6 Players</option>
                  <option value={8}>8 Players</option>
                  <option value={12}>12 Players</option>
                  <option value={16}>16 Players</option>
                  <option value={20}>20 Players</option>
                </>
              )}
              {settings.gameMode === 'telephone' && (
                <>
                  <option value={4}>4 Players (Min)</option>
                  <option value={6}>6 Players</option>
                  <option value={8}>8 Players</option>
                  <option value={12}>12 Players</option>
                  <option value={16}>16 Players (Max)</option>
                </>
              )}
              {settings.gameMode === 'party_mix' && (
                <>
                  <option value={4}>4 Players (Min)</option>
                  <option value={6}>6 Players</option>
                  <option value={8}>8 Players</option>
                  <option value={10}>10 Players</option>
                  <option value={12}>12 Players (Max)</option>
                </>
              )}
            </select>
          </div>

          {/* Automatic Letter Hints */}
          {settings.gameMode !== 'telephone' && (
            <div>
              <label className="block text-xs font-bold text-[#1f2330] mb-1">Automatic Letter Hints</label>
              <select
                value={settings.autoHintsEnabled !== false ? 'yes' : 'no'}
                onChange={(e) => setSettings({ ...settings, autoHintsEnabled: e.target.value === 'yes' })}
                className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-3 py-2 text-sm font-bold text-[#1f2330] outline-none"
              >
                <option value="yes">Enabled (Server Scheduled Reveals)</option>
                <option value="no">Disabled (No Letter Reveals)</option>
              </select>
            </div>
          )}

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
