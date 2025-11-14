
import React from 'react';
import { StoryboardPanel } from './StoryboardPanel';
import type { StoryboardPanelData } from '../types';

interface StoryboardGridProps {
  panels: StoryboardPanelData[];
}

export const StoryboardGrid: React.FC<StoryboardGridProps> = ({ panels }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {panels.map((panel, index) => (
        <StoryboardPanel key={panel.id} panel={panel} sceneNumber={index + 1} />
      ))}
    </div>
  );
};
