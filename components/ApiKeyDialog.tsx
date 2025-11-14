
import React from 'react';

interface ApiKeyDialogProps {
  onSelectKey: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onSelectKey }) => {
  return (
    <div className="mt-6 bg-brand-secondary border border-yellow-500/50 text-yellow-300 p-4 rounded-md text-center">
      <h3 className="font-bold text-lg mb-2">API Key Required</h3>
      <p className="mb-4">
        Video generation with Veo requires you to select a project with billing enabled.
        Please select your API key to continue.
      </p>
      <p className="text-sm mb-4">
        For more information, see the{' '}
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-100">
          billing documentation
        </a>.
      </p>
      <button
        onClick={onSelectKey}
        className="px-4 py-2 bg-yellow-500 text-brand-primary font-semibold rounded-lg hover:bg-yellow-400 transition-colors duration-200"
      >
        Select API Key
      </button>
    </div>
  );
};
