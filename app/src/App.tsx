import { useState } from 'react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'lobby' | 'game' | 'rules'>('home');

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#1f2330]">
      {/* Topbar Navigation */}
      <header className="h-[88px] max-w-[1440px] mx-auto px-6 flex items-center justify-between border-b border-[#e8e5de]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#202436] text-white flex items-center justify-center -rotate-6 font-black text-2xl shadow-[0_4px_0_#ffc0af]">
            ✳
          </div>
          <span className="font-head font-black text-3xl tracking-tighter text-[#1f2330]">
            doodl.
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#fefdfb] border border-[#e8e5de] rounded-full">
          <button
            onClick={() => setCurrentRoute('home')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'home'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setCurrentRoute('lobby')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'lobby'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            Play with Friends
          </button>
          <button
            onClick={() => setCurrentRoute('rules')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'rules'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            How to Play
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e6f7eb] text-[#31775a] font-bold text-xs rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#3bbc77] shadow-[0_0_0_2px_#c3f2d2]"></span>
            MULTIPLAYER V3
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-6 py-8">
        {currentRoute === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#fd7259]">
                <span className="w-5 h-0.5 bg-[#fd7259]"></span>
                The Real-Time Social Drawing Game
              </div>
              <h1 className="font-head font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-none">
                Draw, guess, and <span className="text-[#fd7259]">laugh</span> with friends.
              </h1>
              <p className="text-[#707687] text-base sm:text-lg max-w-lg leading-relaxed">
                Connect instantly through the internet from any device. No mandatory account creation.
                Pure server-authoritative multiplayer with real-time vector drawing.
              </p>
              <div className="p-4 bg-white rounded-2xl border border-[#eeece7] shadow-[0_12px_48px_rgba(81,77,68,0.06)] max-w-md space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#6f7380]">
                  Your Player Nickname
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue="DoodleMaster"
                    maxLength={20}
                    className="flex-1 bg-[#f8f7f5] border border-[#e3e3df] rounded-xl px-4 py-2.5 font-bold text-sm text-[#222532] outline-none focus:border-[#fd7259]"
                    placeholder="Enter nickname..."
                  />
                  <button
                    onClick={() => setCurrentRoute('lobby')}
                    className="bg-[#fd7259] hover:bg-[#e95d45] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_0_#dc5b46] active:translate-y-0.5 transition-all"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center min-h-[400px]">
              <div className="absolute inset-4 rounded-[40px] bg-[#e8e1fc] -rotate-3 -z-10"></div>
              <div className="w-full max-w-lg bg-white rounded-3xl border-8 border-white shadow-2xl p-6 rotate-2 space-y-4">
                <div className="flex justify-between items-center border-b border-[#f1f0ed] pb-3 text-xs font-black text-[#888c93]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f9b79e]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffdf84]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9de6bc]"></span>
                  </div>
                  <span className="tracking-widest">WHAT AM I DRAWING?</span>
                  <span className="tracking-widest font-mono text-[#fd7259]">_ _ _ _ _ _</span>
                </div>
                <div className="h-48 bg-[#faf9f6] rounded-2xl flex items-center justify-center border border-dashed border-[#e8e5de]">
                  <span className="text-sm font-bold text-[#a0a3ad]">Canvas ready for multiplayer strokes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentRoute === 'lobby' && (
          <div className="py-8 space-y-6 max-w-3xl mx-auto">
            <h2 className="font-head font-extrabold text-3xl">Game Lobby</h2>
            <p className="text-[#707687]">Invite friends to join using your private room link.</p>
            <div className="bg-white p-6 rounded-2xl border border-[#eae8e2] shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Room Code: <span className="font-mono text-[#fd7259]">DOODL-TEST</span></span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#f5f3f0] rounded-lg">2-12 Players</span>
              </div>
            </div>
          </div>
        )}

        {currentRoute === 'rules' && (
          <div className="py-8 space-y-6 max-w-3xl mx-auto">
            <h2 className="font-head font-extrabold text-3xl">How to Play DOODL</h2>
            <div className="bg-white p-6 rounded-2xl border border-[#eae8e2] shadow-sm space-y-4 text-sm leading-relaxed text-[#707687]">
              <p><strong className="text-[#1f2330]">1. Take Turns Drawing:</strong> One player is chosen as the drawer each turn and receives 3 secret candidate words.</p>
              <p><strong className="text-[#1f2330]">2. Guess in Real-Time:</strong> All other players type guesses in the chat. The first correct guess scores maximum points!</p>
              <p><strong className="text-[#1f2330]">3. Speed Bonus & Hints:</strong> Fast guesses earn extra speed bonuses. Revealing hints deducts points.</p>
              <p><strong className="text-[#1f2330]">4. Win the Match:</strong> Complete all rounds to determine the ultimate Doodle Champion!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
