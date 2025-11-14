
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import * as geminiService from '../services/geminiService';
import type { ChatMessage, GroundingChunk } from '../types';
import { ChatIcon, SparklesIcon, ThinkingIcon, SearchIcon, MapsIcon } from '../components/icons';
import { Chat as GeminiChat } from '@google/genai';

const GroundingSources: React.FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => (
    <div className="mt-2 text-xs">
      <p className="font-bold text-gray-400">Sources:</p>
      <ul className="list-disc list-inside">
        {chunks.map((chunk, index) => {
          if (chunk.web) {
            return <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{chunk.web.title}</a></li>;
          }
          if (chunk.maps) {
            return <li key={index}><a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">{chunk.maps.title}</a></li>;
          }
          return null;
        })}
      </ul>
    </div>
);

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<GeminiChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Advanced options
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useDeepThink, setUseDeepThink] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    chatRef.current = geminiService.createChat("You are a helpful and friendly AI assistant.");
    setMessages([{ role: 'model', text: 'Hello! How can I help you today?' }]);
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (useMaps && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
          setUseMaps(false);
        }
      );
    }
  }, [useMaps, location]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      let responseText = '';
      let groundingChunks: GroundingChunk[] | undefined;

      if (useSearch || useMaps) {
        const response = await geminiService.generateGroundedContent(input, useSearch, useMaps, location);
        responseText = response.text;
        groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[];
      } else if (useDeepThink) {
        const response = await geminiService.generateComplexContent(input);
        responseText = response.text;
      } else {
        if (!chatRef.current) throw new Error("Chat not initialized.");
        const result = await chatRef.current.sendMessage({ message: input });
        responseText = result.text;
      }
      
      const modelMessage: ChatMessage = { role: 'model', text: responseText, groundingChunks };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const OptionToggle: React.FC<{ isEnabled: boolean; setEnabled: (val: boolean) => void; icon: React.ReactNode; label: string; }> = ({ isEnabled, setEnabled, icon, label }) => (
      <button onClick={() => setEnabled(!isEnabled)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${isEnabled ? 'bg-brand-accent text-white' : 'bg-brand-secondary text-gray-300 hover:bg-brand-primary'}`}>
          {icon}
          {label}
      </button>
  );

  return (
    <div className="h-full flex flex-col">
      <Header title="AI Chat" icon={<ChatIcon />} />
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-brand-accent text-white' : 'bg-brand-secondary text-brand-text'}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                {msg.groundingChunks && <GroundingSources chunks={msg.groundingChunks} />}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-brand-secondary"><Loader message="Thinking..." /></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-white/10 bg-brand-primary">
        <div className="max-w-3xl mx-auto">
          {error && <p className="text-red-400 text-center mb-2">{error}</p>}
          {locationError && <p className="text-yellow-400 text-center mb-2">Location Error: {locationError}</p>}
          <div className="flex items-center justify-center gap-2 mb-3">
              <OptionToggle isEnabled={useDeepThink} setEnabled={setUseDeepThink} icon={<ThinkingIcon className="w-4 h-4"/>} label="Deep Think" />
              <OptionToggle isEnabled={useSearch} setEnabled={setUseSearch} icon={<SearchIcon className="w-4 h-4"/>} label="Google Search" />
              <OptionToggle isEnabled={useMaps} setEnabled={setUseMaps} icon={<MapsIcon className="w-4 h-4"/>} label="Google Maps" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full p-3 bg-brand-secondary border border-white/10 rounded-lg text-brand-text placeholder-gray-500 focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
