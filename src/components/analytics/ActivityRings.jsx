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
        <Icon size={12} strokeWidth={2.5} className="text-white/90" />
      </g>
    </g>
  );
};

export default function ActivityRings({ data }) {
  const size = 260;
  const strokeWidth = 22;

  const categoryConfigs = {
    Health: { color: '#FF3B30', backgroundColor: '#300a0a', icon: Heart },
    Fitness: { color: '#A4FF33', backgroundColor: '#1a300a', icon: Dumbbell },
    Study: { color: '#FFB95F', backgroundColor: '#301d0a', icon: Book },
    Outdoor: { color: '#00D2FF', backgroundColor: '#0a1d30', icon: Mountain },
    Indoor: { color: '#AF52DE', backgroundColor: '#1d0a30', icon: Home },
    'Indoor Games': { color: '#FF5733', backgroundColor: '#30130a', icon: Home },
    'Outdoor Games': { color: '#33FF57', backgroundColor: '#0a3013', icon: Mountain },
    'Games': { color: '#FF33A1', backgroundColor: '#300a20', icon: Home }
  };

  const defaultValues = { color: '#999', backgroundColor: '#222', icon: Home };

  const rings = data.map(item => ({
    ...item,
    ...(categoryConfigs[item.label] || defaultValues)
  }));

  return (
    <section className="glass-card p-6 rounded-3xl overflow-hidden border border-white/5 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-surface/50 pointer-events-none"></div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-8 relative z-10">
        <div>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">Category Momentum</h3>
          <p className="text-body-sm text-on-surface-variant">Your progress across all lifestyle areas</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-16 relative z-10">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-4 flex-1 w-full">
          {rings.map((ring, i) => (
            <div key={ring.label + i} className="flex items-center gap-4 group cursor-default">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 flex-shrink-0"
                style={{ backgroundColor: ring.color, boxShadow: `0 0 15px ${ring.color}33` }}
              >
                <ring.icon size={18} className="text-black" strokeWidth={3} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-label-caps uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-0.5 truncate">{ring.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-on-surface">{Math.round(ring.progress)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
