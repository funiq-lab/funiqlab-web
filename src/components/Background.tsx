import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Background Color handled by body, this layer adds the gradients */}
      
      {/* Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.1]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          color: 'rgba(148, 163, 184, 0.4)'
        }} 
      />
      
      {/* Noise Texture for Texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
};

export default Background;