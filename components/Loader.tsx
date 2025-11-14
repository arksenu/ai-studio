
import React from 'react';
import { SparklesIcon } from './icons';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="text-center my-12 p-6 bg-brand-secondary/50 rounded-lg">
      <div className="flex items-center justify-center gap-4">
        <SparklesIcon className="w-8 h-8 text-brand-accent animate-pulse" />
        <p className="text-lg font-semibold text-brand-light">{message}</p>
      </div>
    </div>
  );
};
