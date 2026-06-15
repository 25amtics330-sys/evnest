import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Sparkles, Send, X, MapPin, Zap, ChevronRight, Bot } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'Find a fast charger in Surat under ₹12',
  'CCS charger near Ahmedabad',
  'Cheap charger in Rajkot for Nexon EV',
  'Type2 charger in Vadodara',
  'Rapid charger on Bharuch highway',
];

const AIChatWidget = ({ onFocusCharger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your EVNest AI Co-Pilot ⚡\n\nI can find chargers across all of Gujarat. Try asking something like:\n• "Fast charger in Surat under ₹15"\n• "CCS charger in Ahmedabad for my Nexon"\n• "Cheap charger in Rajkot"',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/search', { message: userMessage });
      const { query, chargers, suggestion } = res.data;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: suggestion || 'Here is what I found:',
          chargers: chargers || [],
          query,
        }
      ]);
    } catch (err) {
      console.error('[AIChatWidget] Error:', err);
      const isNetwork = !err.response;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: isNetwork
            ? '⚠️ Could not reach the EVNest server. Please make sure the backend is running on port 5000.'
            : `⚠️ ${err.response?.data?.error || 'Something went wrong. Please try again.'}`,
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000]">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="ai-chat-toggle"
          onClick={() => setIsOpen(true)}
          title="Open EVNest AI Co-Pilot"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-400 text-white shadow-xl shadow-emerald-500/30 hover:scale-110 transition-all duration-200"
        >
          <Bot className="h-6 w-6" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20 pointer-events-none" />
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-[390px] h-[540px] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-700/50"
          style={{ background: 'rgba(10, 15, 30, 0.97)', backdropFilter: 'blur(16px)' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900/80 to-slate-900/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">EVNest AI Co-Pilot</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Smart Charger Finder
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-line leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Suggested quick-prompts on first assistant message */}
                {idx === 0 && msg.role === 'assistant' && (
                  <div className="mt-3 w-full space-y-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, pi) => (
                      <button
                        key={pi}
                        onClick={() => handleSuggestion(prompt)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left text-[11px] text-slate-300 hover:border-emerald-500/50 hover:text-white hover:bg-slate-800 transition-all duration-150 group"
                      >
                        <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="flex-1">{prompt}</span>
                        <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Charger Result Cards */}
                {msg.chargers && msg.chargers.length > 0 && (
                  <div className="w-full mt-3 space-y-2 pl-1">
                    {msg.chargers.map((charger) => (
                      <div
                        key={charger._id}
                        className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-3 shadow-md hover:border-emerald-500/40 transition-all group"
                      >
                        {/* Title + Price badge */}
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="text-[11px] font-bold text-slate-100 leading-tight line-clamp-2">{charger.title}</h4>
                          <span className="shrink-0 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded whitespace-nowrap">
                            ₹{charger.pricePerKwh}/kWh
                          </span>
                        </div>

                        {/* Address */}
                        <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">{charger.address}</p>

                        {/* Specs row */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-300 mb-2.5">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-amber-400 fill-current" />
                            {charger.speedKw}kW
                          </span>
                          <span className="text-slate-600">•</span>
                          <span>{charger.connectorType}</span>
                          {charger.isLive && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live
                              </span>
                            </>
                          )}
                        </div>

                        {/* Focus on Map button */}
                        <button
                          onClick={() => onFocusCharger(charger)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-[10px] font-bold text-emerald-400 hover:text-white transition-all duration-200"
                        >
                          <MapPin className="h-3 w-3" />
                          Locate on Map & Get Directions
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-1">
                <div className="flex gap-1 items-center bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-slate-500">Scanning Gujarat grid...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3 shrink-0 flex gap-2 bg-slate-950/80">
            <input
              ref={inputRef}
              type="text"
              id="ai-chat-input"
              placeholder="e.g. Surat, fast charger under ₹15..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/60 transition-colors disabled:opacity-50"
            />
            <button
              id="ai-chat-send"
              type="submit"
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white disabled:opacity-40 transition-all hover:scale-105 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
