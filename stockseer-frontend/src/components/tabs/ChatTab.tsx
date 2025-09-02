import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Download, Trash2, Copy, Check } from 'lucide-react';

interface ChatTabProps {
  selectedStock: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatTab({ selectedStock }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: `Hello! I'm your AI stock analysis assistant. I can help you analyze ${selectedStock || 'stocks'}, explain financial concepts, and provide investment insights. What would you like to know?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [selectedStock, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I understand you're asking about "${inputMessage}". This is a simulated response. In a real implementation, this would connect to an AI service to provide detailed analysis about ${selectedStock || 'the stock'} and answer your question.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: `Hello! I'm your AI stock analysis assistant. I can help you analyze ${selectedStock || 'stocks'}, explain financial concepts, and provide investment insights. What would you like to know?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const downloadChat = () => {
    const chatContent = messages.map(msg => 
      `[${msg.timestamp}] ${msg.type === 'user' ? 'You' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${selectedStock || 'general'}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const suggestedQuestions = [
    `What are the key financial metrics for ${selectedStock || 'this stock'}?`,
    'How do I calculate the P/E ratio?',
    'What is the difference between technical and fundamental analysis?',
    'How do I assess investment risk?',
    'What are the best practices for portfolio diversification?'
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🤖 AI Stock Assistant</h2>
            <p className="text-slate-400">Get AI-powered insights and analysis</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearChat}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </button>
            <button
              onClick={downloadChat}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Suggested Questions:</h3>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(question)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-600 text-slate-300'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className={`p-1 rounded hover:bg-slate-600 ${
                      message.type === 'user' ? 'text-blue-300' : 'text-slate-400'
                    }`}
                  >
                    {copiedId === message.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about stocks, analysis, or investment strategies..."
            className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 resize-none"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
