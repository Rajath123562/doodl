/**
 * DOODL Real-Time Guess Chat Component
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@shared/game-types';

interface GuessChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendChat?: (text: string) => void;
  disabled?: boolean;
  hasGuessed?: boolean;
  isDrawer?: boolean;
}

export const GuessChat: React.FC<GuessChatProps> = ({
  messages,
  onSendMessage,
  onSendChat,
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

    if ((isDrawer || hasGuessed) && onSendChat) {
      onSendChat(trimmed);
    } else {
      onSendMessage(trimmed);
    }
    setInputText('');
  };

  return (
    <div className="bg-white border border-[#e9e7e2] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
      <div className="h-10 sm:h-12 px-2.5 sm:px-4 border-b border-[#f0eee9] flex items-center justify-between bg-[#faf9f6]">
        <h3 className="font-head font-extrabold text-xs sm:text-sm text-[#1f2330]">Guess & Chat</h3>
        <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#48a26e] bg-[#ebf7ec] px-1.5 sm:px-2 py-0.5 rounded-full">
          {hasGuessed || isDrawer ? 'SOLVED CHAT' : 'LIVE CHAT'}
        </span>
      </div>

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-1 sm:space-y-1.5 min-h-0">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="text-center font-bold text-[10px] sm:text-xs py-1 px-2 rounded-lg bg-[#edfaef] text-[#31775a]"
              >
                {msg.text}
              </div>
            );
          }

          if (msg.isClose) {
            return (
              <div
                key={msg.id}
                className="text-center font-bold text-[10px] sm:text-xs py-1 px-2 rounded-lg bg-[#fff8e7] text-[#a07421]"
              >
                ⚠️ <b>{msg.nickname}</b> is close to the word!
              </div>
            );
          }

          const isSolvedChannel = msg.channel === 'solved';

          return (
            <div key={msg.id} className="text-[11px] sm:text-xs">
              <span className="font-bold text-[#1f2330] mr-1">
                {isSolvedChannel && <span className="text-[#3bbc77] mr-0.5">🔒</span>}
                {msg.nickname}:
              </span>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg inline-block break-words ${
                isSolvedChannel ? 'bg-[#eaf7ed] text-[#24633b]' : 'text-[#555966] bg-[#f6f5f2]'
              }`}>
                {msg.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Guess compose input */}
      <form onSubmit={handleSubmit} className="p-2 sm:p-2.5 border-t border-[#f0efea] flex gap-1.5 sm:gap-2 bg-white">
        <input
          type="text"
          value={inputText}
          disabled={disabled}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isDrawer
              ? 'Chat with solved players & drawer...'
              : hasGuessed
              ? 'You guessed it! Chat here...'
              : 'Type your guess here...'
          }
          className="flex-1 bg-[#fbfaf8] border border-[#e9e7e3] rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 text-base sm:text-xs font-bold text-[#222532] outline-none focus:border-[#fd7259] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !inputText.trim()}
          className="bg-[#fd7259] hover:bg-[#e95d45] text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold text-xs shadow-[0_2px_0_#dc5b46] sm:shadow-[0_3px_0_#dc5b46] disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5"
        >
          Send
        </button>
      </form>
    </div>
  );
};
