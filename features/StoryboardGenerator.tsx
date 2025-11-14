
import React, { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { generatePromptsFromScript, generateImage } from '../services/geminiService';
import type { StoryboardPanelData } from '../types';
import { FilmIcon, SparklesIcon } from '../components/icons';

const StoryboardPanel: React.FC<{ panel: StoryboardPanelData; sceneNumber: number; }> = ({ panel, sceneNumber }) => (
  <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-lg border border-white/10">
    <div className="aspect-video bg-black flex items-center justify-center">
      {panel.imageUrl ? (
        <img src={panel.imageUrl} alt={panel.prompt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-brand-primary animate-pulse-fast flex items-center justify-center">
          <span className="text-gray-500">Generating...</span>
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-bold text-lg text-brand-light mb-2">Scene {sceneNumber}</h3>
      <p className="text-sm text-brand-text leading-relaxed">{panel.prompt}</p>
    </div>
  </div>
);

const StoryboardGenerator: React.FC = () => {
  const [storyboardPanels, setStoryboardPanels] = useState<StoryboardPanelData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState('');

  const handleGenerateStoryboard = useCallback(async () => {
    if (!script.trim()) {
      setError('Script cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStoryboardPanels([]);

    try {
      setLoadingMessage('Analyzing script and creating scene descriptions...');
      const prompts = await generatePromptsFromScript(script);

      if (!prompts || prompts.length === 0) {
        throw new Error("Could not generate any scene descriptions from the script.");
      }
      
      const initialPanels: StoryboardPanelData[] = prompts.map((prompt, index) => ({
        id: index,
        prompt: prompt,
        imageUrl: null,
      }));
      setStoryboardPanels(initialPanels);

      for (let i = 0; i < prompts.length; i++) {
        setLoadingMessage(`Generating image ${i + 1} of ${prompts.length}...`);
        const base64Image = await generateImage(prompts[i], '16:9');
        setStoryboardPanels(prevPanels =>
          prevPanels.map(panel =>
            panel.id === i ? { ...panel, imageUrl: `data:image/jpeg;base64,${base64Image}` } : panel
          )
        );
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate storyboard. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [script]);

  const placeholderText = `Example:\n\nEXT. ANCIENT RUINS - DAY\n\nA lone EXPLORER...`;

  return (
    <>
      <Header title="AI Storyboard Generator" icon={<FilmIcon />} />
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-brand-text mb-8">
            Paste your script below. The AI will break it down into key scenes and generate a visual storyboard.
          </p>
          
          <div className="space-y-4">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={placeholderText}
              disabled={isLoading}
              className="w-full h-64 p-4 bg-brand-secondary border border-white/10 rounded-lg text-brand-text placeholder-gray-500 focus:ring-2 focus:ring-brand-accent focus:outline-none transition-shadow duration-200 resize-none"
            />
            <button
              onClick={handleGenerateStoryboard}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <SparklesIcon className="w-5 h-5" />
              {isLoading ? 'Generating...' : 'Generate Storyboard'}
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/20 text-red-300 p-4 rounded-md text-center">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {isLoading && <Loader message={loadingMessage} />}

          {!isLoading && storyboardPanels.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-6 text-brand-light">Your Storyboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {storyboardPanels.map((panel, index) => (
                  <StoryboardPanel key={panel.id} panel={panel} sceneNumber={index + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StoryboardGenerator;
