import React from 'react';
import { Heart, Dumbbell, Book, Mountain, Home } from 'lucide-react';

const Ring = ({ 
  size, 
  strokeWidth, 
  progress, 
  color, 
  backgroundColor, 
  icon: Icon, 
  index 
}) => {
  const gap = 3;
  const radius = (size / 2) - (strokeWidth / 2) - (index * (strokeWidth + gap));
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(2, progress) / 100) * circumference;

  return (
    <g>
      {/* Background Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        className="opacity-30"
      />
      {/* Progress Stroke */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-[1500ms] ease-out"
        style={{
          filter: `drop-shadow(0 0 4px ${color}66)`,
        }}
      />
      {/* Icon at the top */}
      <g transform={`translate(${center - 6}, ${center - radius - 6})`}>
        <Icon size={12} strokeWidth={2.5} className="text-black/80 opacity-90" />
      </g>
    </g>
  );
};

export default function ActivityRings({ data }) {
  const size = 260;
  const strokeWidth = 22;

  const categoryConfigs = {
    Health: { color: '#FF3B30', backgroundColor: '#300a0a', icon: Heart },
    Fitness: { color: '#4EDE A3', backgroundColor: '#0a301a', icon: Dumbbell },
    Study: { color: '#FFB95F', backgroundColor: '#301d0a', icon: Book },
    Outdoor: { color: '#00D2FF', backgroundColor: '#0a1d30', icon: Mountain },
    Indoor: { color: '#AF52DE', backgroundColor: '#1d0a30', icon: Home },
  };

  const rings = data.map(item => ({
    ...item,
    ...categoryConfigs[item.label]
  }));

  return (
    <div className="glass-card p-8 md:p-12 rounded-[48px] flex flex-col lg:flex-row items-center gap-10 lg:gap-16 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative flex-shrink-0 scale-90 sm:scale-100">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
          {rings.map((ring, i) => (
            <Ring 
              key={ring.label + i}
              size={size}
              strokeWidth={strokeWidth}
              progress={ring.progress}
              color={ring.color}
              backgroundColor={ring.backgroundColor}
              icon={ring.icon}
              index={i}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-col gap-6 flex-1 w-full">
        <div className="text-center lg:text-left">
          <h3 className="font-headline-lg text-3xl text-white mb-2">Category Momentum</h3>
          <p className="text-body-sm text-on-surface-variant font-medium">Your progress across all lifestyle areas</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-4">
          {rings.map((ring, i) => (
            <div key={ring.label + i} className="flex items-center gap-4 group cursor-default">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 flex-shrink-0"
                style={{ backgroundColor: ring.color, boxShadow: `0 0 15px ${ring.color}33` }}
              >
                <ring.icon size={18} className="text-black/80" strokeWidth={3} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-label-caps uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-0.5 truncate">{ring.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white">{Math.round(ring.progress)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
