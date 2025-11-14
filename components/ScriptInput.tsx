
import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface ScriptInputProps {
  onGenerate: (script: string) => void;
  disabled: boolean;
}

export const ScriptInput: React.FC<ScriptInputProps> = ({ onGenerate, disabled }) => {
  const [script, setScript] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(script);
  };

  const placeholderText = `Example:

EXT. ANCIENT RUINS - DAY

A lone EXPLORER, clad in worn leather, cautiously enters a vast, sun-drenched chamber. Hieroglyphs cover the towering stone walls.

In the center of the room, a single, glowing CRYSTAL pulses with an otherworldly light, floating just above a stone pedestal.

The Explorer reaches out a trembling hand...
`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder={placeholderText}
        disabled={disabled}
        className="w-full h-64 p-4 bg-brand-secondary border border-white/10 rounded-lg text-brand-text placeholder-gray-500 focus:ring-2 focus:ring-brand-accent focus:outline-none transition-shadow duration-200 resize-none"
      />
      <button
        type="submit"
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <SparklesIcon className="w-5 h-5" />
        {disabled ? 'Generating...' : 'Generate Storyboard'}
      </button>
    </form>
  );
};
