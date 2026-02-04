import React, { useState, useRef, useEffect } from 'react';
import { getAIResponse } from '../services/geminiService';
import { ChatMessage, Patient } from '../types';

export const AIVirtualDoctor: React.FC<{ patient?: Patient | null }> = ({ patient }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scrolls the chat to the bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const currentInput = input.trim();

    // Create history for API
    const historyForAPI = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }));

    setInput('');
    // Add user message to UI immediately
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Pass history, new message, and patient context separately
      const response = await getAIResponse(historyForAPI, currentInput, patient ?? undefined);

      if (response && response.trim().length > 0) {
        const aiMsg: ChatMessage = { role: 'assistant', content: response };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your API key configuration or try again later."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const RobotFaceLogo = () => (
    <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg flex items-center justify-center relative overflow-hidden group border-2 border-white/20">
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
        <path strokeLinecap="round" d="M10 15h4" strokeWidth="2" />
      </svg>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(79,70,229,0.35)] w-[90vw] sm:w-85 md:w-96 flex flex-col border border-indigo-50 overflow-hidden h-[500px] md:h-[580px] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <RobotFaceLogo />
              <div>
                <h3 className="font-black text-xs md:text-sm uppercase tracking-widest leading-none text-indigo-100">Virtual DOC</h3>
                <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-tighter mt-1">Friendly • Professional • Precise</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-5">
                <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center animate-pulse shadow-inner border border-indigo-100">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="space-y-2 px-6">
                  <p className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest">Hello! I'm Virtual DOC</p>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed italic">Ask me anything about your case or medications!</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-xs md:text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white font-bold rounded-tr-none' : 'bg-white border border-gray-100 text-slate-800 font-medium leading-relaxed rounded-tl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center space-x-2 rounded-tl-none">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t bg-white">
            <div className="flex space-x-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border-0 rounded-2xl px-5 py-4 text-xs md:text-sm focus:ring-2 focus:ring-indigo-600 outline-none font-bold placeholder-slate-300"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-indigo-600 text-white rounded-2xl p-4 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xl active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white rounded-full p-1 shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:shadow-indigo-500/30 transform hover:scale-110 transition-all flex items-center pr-8 group active:scale-95 border-2 border-indigo-500/20"
        >
          <div className="bg-indigo-600 rounded-full p-3 mr-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="block font-black text-[10px] md:text-xs uppercase tracking-[0.2em] leading-none">Virtual DOC</span>
        </button>
      )}
    </div>
  );
};