
import React from 'react';

interface HeaderProps {
  title: string;
  icon: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, icon }) => {
  return (
    <header className="bg-brand-secondary/50 border-b border-white/10 p-4 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <div className="w-8 h-8 text-brand-accent">{icon}</div>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-light tracking-tight">
          {title}
        </h1>
      </div>
    </header>
  );
};
