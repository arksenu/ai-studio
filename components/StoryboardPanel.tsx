
import React from 'react';
import type { StoryboardPanelData } from '../types';

interface StoryboardPanelProps {
  panel: StoryboardPanelData;
  sceneNumber: number;
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panel, sceneNumber }) => {
  return (
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
};
