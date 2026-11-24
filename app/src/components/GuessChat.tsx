/**
 * DOODL Real-Time Guess Chat Component
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@shared/game-types';

export interface GuessChatProps {
  messages: ChatMessage[];
  hasGuessed?: boolean;
  isDrawer?: boolean;
  onSendMessage?: (text: string) => void;
  onSendChat?: (text: string) => void;
  disabled?: boolean;
  showComposer?: boolean;
}

export interface GuessComposerProps {
  onSendMessage: (text: string) => void;
  onSendChat?: (text: string) => void;
  disabled?: boolean;
  hasGuessed?: boolean;
  isDrawer?: boolean;
}

export const GuessComposer: React.FC<GuessComposerProps> = ({
  onSendMessage,
  onSendChat,
  disabled = false,
  hasGuessed = false,
  isDrawer = false,
}) => {
  const [inputText, setInputText] = useState('');

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

  const placeholder = isDrawer
    ? 'Chat with solved players & drawer...'
    : hasGuessed
    ? 'You guessed it! Chat here...'
    : 'Type your guess here...';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex items-center gap-2 bg-white border border-[#e9e7e2] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-sm min-h-[50px] shrink-0"
    >
      <input
        type="text"
        value={inputText}
        disabled={disabled}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={placeholder}
        maxLength={80}
        aria-label={isDrawer || hasGuessed ? 'Chat message' : 'Your guess'}
        className="flex-1 min-w-0 bg-[#fbfaf8] border border-[#e9e7e3] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm font-bold text-[#222532] outline-none focus:border-[#fd7259] focus:bg-white placeholder:text-[#858794] disabled:opacity-50 transition-colors"
      />
      <button
        type="submit"
        disabled={disabled || !inputText.trim()}
        aria-label="Send"
        className="shrink-0 bg-[#fd7259] hover:bg-[#e95d45] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-sm shadow-[0_2px_0_#dc5b46] sm:shadow-[0_3px_0_#dc5b46] disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5 min-h-[44px] min-w-[56px] sm:min-w-[70px] flex items-center justify-center transition-all"
      >
        Send
      </button>
    </form>
  );
};

export const GuessChat: React.FC<GuessChatProps> = ({
  messages,
  hasGuessed = false,
  isDrawer = false,
  onSendMessage,
  onSendChat,
  disabled = false,
  showComposer = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-white border border-[#e9e7e2] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
      <div className="h-10 sm:h-12 px-2.5 sm:px-4 border-b border-[#f0eee9] flex items-center justify-between bg-[#faf9f6] shrink-0">
        <h3 className="font-head font-extrabold text-xs sm:text-sm text-[#1f2330]">Guess & Chat</h3>
        <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#48a26e] bg-[#ebf7ec] px-1.5 sm:px-2 py-0.5 rounded-full">
          {hasGuessed || isDrawer ? 'SOLVED CHAT' : 'LIVE CHAT'}
        </span>
      </div>

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-1 sm:space-y-1.5 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] sm:text-xs text-[#858794] italic">
            No messages yet. Start guessing!
          </div>
        ) : (
          messages.map((msg) => {
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
                <span
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg inline-block break-words ${
                    isSolvedChannel ? 'bg-[#eaf7ed] text-[#24633b]' : 'text-[#555966] bg-[#f6f5f2]'
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            );
          })
        )}
      </div>

      {showComposer && onSendMessage && (
        <div className="p-2 border-t border-[#f0efea] shrink-0">
          <GuessComposer
            onSendMessage={onSendMessage}
            onSendChat={onSendChat}
            disabled={disabled}
            hasGuessed={hasGuessed}
            isDrawer={isDrawer}
          />
        </div>
      )}
    </div>
  );
};
