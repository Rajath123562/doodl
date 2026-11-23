/**
 * DOODL Profile, Avatar Studio, XP & Achievements Page
 */

import React from 'react';
import { Avatar } from '../components/Avatar';

interface ProfileProps {
  nickname: string;
  avatarFace: number;
  avatarColor: string;
  onNicknameChange: (name: string) => void;
  onAvatarFaceChange: (face: number) => void;
  onAvatarColorChange: (color: string) => void;
  onNavigate: (route: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  nickname,
  avatarFace,
  avatarColor,
  onNicknameChange,
  onAvatarFaceChange,
  onAvatarColorChange,
  onNavigate,
}) => {
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
        <h1 className="font-head font-extrabold text-3xl text-[#1f2330]">Avatar Studio & Profile</h1>
        <p className="text-xs text-[#707687]">
          Customize your appearance and track your guest gameplay achievements.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#e8e5de] p-8 shadow-sm space-y-6 text-center">
        <Avatar face={avatarFace} color={avatarColor} size="huge" className="mx-auto" />

        <div className="max-w-xs mx-auto">
          <label className="block text-[10px] font-black uppercase text-[#6f7380] mb-1">
            Display Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="w-full text-center bg-[#f8f7f5] border border-[#e3e3df] rounded-xl py-2 font-bold text-sm text-[#1f2330]"
          />
        </div>

        {/* Hairstyle picker */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#707687]">Select Hairstyle:</span>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onAvatarFaceChange(f)}
                className={`w-10 h-10 rounded-xl border text-sm font-bold ${
                  avatarFace === f
                    ? 'bg-[#22283a] text-white border-[#22283a]'
                    : 'bg-[#fbfaf8] border-[#e5e3de]'
                }`}
              >
                {f + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#707687]">Select Color Theme:</span>
          <div className="flex justify-center gap-3">
            {['coral', 'blue', 'green', 'pink', 'purple', 'yellow'].map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onAvatarColorChange(col)}
                className={`w-8 h-8 rounded-full border-2 ${
                  avatarColor === col ? 'border-[#22283a] scale-110 shadow-sm' : 'border-white'
                }`}
                style={{
                  backgroundColor:
                    col === 'coral'
                      ? '#ffd8cd'
                      : col === 'blue'
                      ? '#d8e7ff'
                      : col === 'green'
                      ? '#d5f8e4'
                      : col === 'pink'
                      ? '#ffe1eb'
                      : col === 'purple'
                      ? '#e5dcff'
                      : '#fff1bd',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Local Achievements */}
      <div className="bg-white rounded-3xl border border-[#e8e5de] p-6 shadow-sm space-y-4">
        <h3 className="font-head font-extrabold text-lg text-[#1f2330]">
          Achievements (Saved Locally)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#fbfaf8] border border-[#e8e5de] rounded-2xl flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <strong className="block text-xs font-bold text-[#1f2330]">First Steps</strong>
              <span className="text-[10px] text-[#707687]">Complete 1 match</span>
            </div>
          </div>
          <div className="p-3 bg-[#fbfaf8] border border-[#e8e5de] rounded-2xl flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <strong className="block text-xs font-bold text-[#1f2330]">Sharp Eye</strong>
              <span className="text-[10px] text-[#707687]">First correct guess</span>
            </div>
          </div>
          <div className="p-3 bg-[#fbfaf8] border border-[#e8e5de] rounded-2xl flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <strong className="block text-xs font-bold text-[#1f2330]">Master Artist</strong>
              <span className="text-[10px] text-[#707687]">Draw 5 words</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
