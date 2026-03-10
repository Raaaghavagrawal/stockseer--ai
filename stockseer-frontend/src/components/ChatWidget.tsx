import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_STORAGE_KEY = 'stockseer_chat_history_v1';

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Message[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newHistory: Message[] = [...messages, { role: 'user' as const, content: text }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: newHistory.slice(-12) }),
      });
      const data = await resp.json();
      const reply = (data?.reply as string) ?? 'Sorry, no response.';
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: reply }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-gradient-to-r from-binance-yellow to-binance-yellow-dark text-black font-semibold shadow-lg hover:shadow-xl w-14 h-14 flex items-center justify-center"
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {open && (
        <div className="w-[320px] sm:w-[380px] h-[460px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark text-black">
            <div className="font-semibold">StockSeer Chat</div>
            <div className="flex items-center gap-2">
              <button onClick={clear} title="Clear" className="text-black/80 hover:text-black font-semibold">Clear</button>
              <button onClick={() => setOpen(false)} title="Close" className="text-black/80 hover:text-black font-semibold">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-black">
            {messages.length === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-8">
                Ask me anything about StockSeer or the stock market.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`${m.role === 'user' ? 'ml-12 self-end bg-yellow-100 text-black' : 'mr-12 self-start bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} px-3 py-2 rounded-lg shadow-sm animate-[fadeIn_0.2s_ease]`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-12 self-start bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg shadow-sm text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-2 flex items-center gap-2 bg-white dark:bg-gray-900">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              className="flex-1 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
              placeholder="Type a message..."
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-md bg-gradient-to-r from-binance-yellow to-binance-yellow-dark text-black font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
