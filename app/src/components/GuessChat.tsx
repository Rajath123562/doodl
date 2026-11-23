/**
 * DOODL Real-Time Guess Chat Component
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@shared/game-types';

interface GuessChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  hasGuessed?: boolean;
  isDrawer?: boolean;
}

export const GuessChat: React.FC<GuessChatProps> = ({
  messages,
  onSendMessage,
  disabled = false,
  hasGuessed = false,
  isDrawer = false,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <div className="bg-white border border-[#e9e7e2] rounded-2xl overflow-hidden shadow-sm flex flex-col h-[580px]">
      <div className="h-14 px-4 border-b border-[#f0eee9] flex items-center justify-between bg-[#faf9f6]">
        <h3 className="font-head font-extrabold text-sm text-[#1f2330]">Guess & Chat</h3>
        <span className="text-[10px] font-black uppercase text-[#48a26e] bg-[#ebf7ec] px-2 py-0.5 rounded-full">
          LIVE CHAT
        </span>
      </div>

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="text-center font-bold text-xs py-1.5 px-3 rounded-lg bg-[#edfaef] text-[#31775a]"
              >
                {msg.text}
              </div>
            );
          }

          if (msg.isClose) {
            return (
              <div
                key={msg.id}
                className="text-center font-bold text-xs py-1 px-2.5 rounded-lg bg-[#fff8e7] text-[#a07421]"
              >
                ⚠️ <b>{msg.nickname}</b> is close to the word!
              </div>
            );
          }

          return (
            <div key={msg.id} className="text-xs">
              <span className="font-bold text-[#1f2330] mr-1.5">{msg.nickname}:</span>
              <span className="text-[#555966] bg-[#f6f5f2] px-2 py-1 rounded-lg inline-block break-words">
                {msg.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Guess compose input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#f0efea] flex gap-2">
        <input
          type="text"
          value={inputText}
          disabled={disabled || isDrawer || hasGuessed}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isDrawer
              ? 'Drawers cannot guess!'
              : hasGuessed
              ? 'You already guessed correctly! ✓'
              : 'Type your guess here...'
          }
          className="flex-1 bg-[#fbfaf8] border border-[#e9e7e3] rounded-xl px-3 py-2.5 text-xs font-bold text-[#222532] outline-none focus:border-[#fd7259] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || isDrawer || hasGuessed || !inputText.trim()}
          className="bg-[#fd7259] hover:bg-[#e95d45] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-[0_3px_0_#dc5b46] disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5"
        >
          Send
        </button>
      </form>
    </div>
  );
};
