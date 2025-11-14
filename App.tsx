
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import StoryboardGenerator from './features/StoryboardGenerator';
import Chat from './features/Chat';
import ImageStudio from './features/ImageStudio';
import VideoStudio from './features/VideoStudio';
import AudioStudio from './features/AudioStudio';
import type { Feature } from './types';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('Storyboard');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'Storyboard':
        return <StoryboardGenerator />;
      case 'Chat':
        return <Chat />;
      case 'Image':
        return <ImageStudio />;
      case 'Video':
        return <VideoStudio />;
      case 'Audio':
        return <AudioStudio />;
      default:
        return <StoryboardGenerator />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-primary font-sans">
      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <main className="flex-1 overflow-y-auto">
        {renderFeature()}
      </main>
    </div>
  );
};

export default App;
