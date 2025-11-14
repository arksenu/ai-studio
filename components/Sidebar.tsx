
import React from 'react';
import type { Feature } from '../types';
import { FilmIcon, ChatIcon, ImageIcon, VideoIcon, AudioIcon, SparklesIcon } from './icons';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const features: { name: Feature; icon: React.ReactNode }[] = [
  { name: 'Storyboard', icon: <FilmIcon /> },
  { name: 'Chat', icon: <ChatIcon /> },
  { name: 'Image', icon: <ImageIcon /> },
  { name: 'Video', icon: <VideoIcon /> },
  { name: 'Audio', icon: <AudioIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  return (
    <nav className="w-20 bg-brand-secondary flex flex-col items-center py-4 gap-4 border-r border-white/10">
      <div className="p-2 text-brand-accent mb-4">
        <SparklesIcon className="w-8 h-8"/>
      </div>
      {features.map(({ name, icon }) => (
        <button
          key={name}
          onClick={() => setActiveFeature(name)}
          className={`p-3 rounded-lg w-14 h-14 flex items-center justify-center transition-colors duration-200 ${
            activeFeature === name ? 'bg-brand-accent text-white' : 'text-gray-400 hover:bg-brand-primary hover:text-white'
          }`}
          aria-label={name}
          title={name}
        >
          <div className="w-7 h-7">{icon}</div>
        </button>
      ))}
    </nav>
  );
};
