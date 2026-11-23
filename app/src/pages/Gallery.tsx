/**
 * DOODL Art Gallery & Export Page
 */

import React from 'react';

export const Gallery: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#e8e5de] pb-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-xs font-bold text-[#707687] hover:text-[#1f2330] mb-1"
          >
            ← Back to Home
          </button>
          <h1 className="font-head font-extrabold text-3xl text-[#1f2330]">Personal Art Gallery</h1>
          <p className="text-xs text-[#707687]">
            Your saved drawings are stored privately on this device.
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-white rounded-3xl border border-[#e8e5de] shadow-sm space-y-3">
        <span className="text-5xl block">🎨</span>
        <h3 className="font-head font-extrabold text-xl text-[#1f2330]">Gallery is Empty</h3>
        <p className="text-xs text-[#707687] max-w-sm mx-auto">
          Draw something during a multiplayer match or in the Daily Doodle challenge and click "Save to Gallery" to see it here!
        </p>
        <button
          type="button"
          onClick={() => onNavigate('daily')}
          className="bg-[#fd7259] text-white px-5 py-2.5 rounded-xl font-bold text-xs"
        >
          Try Daily Doodle
        </button>
      </div>
    </div>
  );
};
