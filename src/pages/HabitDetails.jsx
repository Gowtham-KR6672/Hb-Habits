import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { useHabits } from '../context/HabitContext';
import { format, subDays, startOfWeek, addDays, parseISO } from 'date-fns';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getGoalUnit = (type) => {
  if (type === 'Timer') return 'Mins';
  if (type === 'Distance') return 'Km';
  return 'Times';
};

const getHabitIcon = (type) => {
  if (type === 'Distance') return 'directions_run';
  if (type === 'Timer') return 'timer';
  if (type === 'Quantity') return 'tag';
  return 'check_circle';
};

const getLogValue = (log, habit) => {
  if (!log) return 0;
  if (log.value !== null && log.value !== undefined) return Number(log.value) || 0;
  if (log.status === 'completed') return Number(habit.targetValue) || 0;
  return 0;
};

function TargetVsAchieved3DChart({ data, targetValue, goalUnit }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let isMounted = true;

    import('three').then((THREE) => {
      if (!isMounted || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(4.8, 4.2, 7.2);

      const chartGroup = new THREE.Group();
      scene.add(chartGroup);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0x4edea3, 2);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);

      const maxValue = Math.max(targetValue, ...data.map(item => item.value), 1);
      const xStep = data.length > 1 ? 5.8 / (data.length - 1) : 0;
      const toPoint = (item, index, zOffset = 0) => {
        const x = -2.9 + (xStep * index);
        const y = (item.value / maxValue) * 2.8;
        return new THREE.Vector3(x, y, zOffset);
      };

      const achievedBasePoints = data.map((item, index) => toPoint(item, index, 0.35));
      const targetBasePoints = data.map((_, index) => toPoint({ value: targetValue }, index, -0.35));
      const achievedCurve = new THREE.CatmullRomCurve3(achievedBasePoints);
      const targetCurve = new THREE.CatmullRomCurve3(targetBasePoints);
      const achievedPoints = achievedCurve.getPoints(96);
      const targetPoints = targetCurve.getPoints(96);

      const achievedGeometry = new THREE.BufferGeometry().setFromPoints(achievedPoints);
      const targetGeometry = new THREE.BufferGeometry().setFromPoints(targetPoints);
      achievedGeometry.setDrawRange(0, 0);
      targetGeometry.setDrawRange(0, 0);

      const achievedMaterial = new THREE.LineBasicMaterial({
        color: 0x4edea3,
        linewidth: 3,
        transparent: true,
        opacity: 0.96
      });
      const targetMaterial = new THREE.LineDashedMaterial({
        color: 0xffb95f,
        dashSize: 0.18,
        gapSize: 0.11,
        transparent: true,
        opacity: 0.9
      });

      const achievedLine = new THREE.Line(achievedGeometry, achievedMaterial);
      const targetLine = new THREE.Line(targetGeometry, targetMaterial);
      targetLine.computeLineDistances();
      chartGroup.add(targetLine, achievedLine);

      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x8fa0b4, transparent: true, opacity: 0.22 });
      for (let i = 0; i <= 4; i += 1) {
        const y = (i / 4) * 2.8;
        const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-3.2, y, -0.9),
          new THREE.Vector3(3.2, y, -0.9)
        ]);
        chartGroup.add(new THREE.Line(horizontalGeometry, gridMaterial));
      }

      for (let i = 0; i < data.length; i += 1) {
        const x = -2.9 + (xStep * i);
        const depthGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0, -0.9),
          new THREE.Vector3(x, 0, 0.8)
        ]);
        chartGroup.add(new THREE.Line(depthGeometry, gridMaterial));
      }

      const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x122131, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
      const baseGeometry = new THREE.PlaneGeometry(6.7, 2.1);
      const basePlane = new THREE.Mesh(baseGeometry, baseMaterial);
      basePlane.rotation.x = -Math.PI / 2;
      basePlane.position.set(0, -0.02, -0.05);
      chartGroup.add(basePlane);

      const achievedDotMaterial = new THREE.MeshStandardMaterial({
        color: 0x4edea3,
        emissive: 0x1a8f68,
        emissiveIntensity: 0.35,
        roughness: 0.32,
        metalness: 0.12
      });
      const targetDotMaterial = new THREE.MeshStandardMaterial({
        color: 0xffb95f,
        emissive: 0x7a4415,
        emissiveIntensity: 0.2,
        roughness: 0.38,
        metalness: 0.08
      });
      const dotGeometry = new THREE.SphereGeometry(0.07, 20, 20);
      const dots = [];

      achievedBasePoints.forEach((point) => {
        const dot = new THREE.Mesh(dotGeometry, achievedDotMaterial);
        dot.position.copy(point);
        dot.scale.setScalar(0.01);
        dots.push(dot);
        chartGroup.add(dot);
      });

      targetBasePoints.forEach((point) => {
        const dot = new THREE.Mesh(dotGeometry, targetDotMaterial);
        dot.position.copy(point);
        dot.scale.setScalar(0.01);
        dots.push(dot);
        chartGroup.add(dot);
      });

      chartGroup.rotation.x = -0.35;
      chartGroup.rotation.y = -0.45;
      camera.lookAt(0, 1.1, 0);

      const resize = () => {
        const width = canvas.clientWidth || 640;
        const height = canvas.clientHeight || 260;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let frameId;
      const start = performance.now();

      const render = (now) => {
        resize();
        const elapsed = now - start;
        const progress = prefersReducedMotion ? 1 : Math.min(elapsed / 1500, 1);
        const drawCount = Math.max(2, Math.floor(progress * achievedPoints.length));
        achievedGeometry.setDrawRange(0, drawCount);
        targetGeometry.setDrawRange(0, drawCount);

        dots.forEach((dot, index) => {
          const dotProgress = Math.max(0, Math.min(1, (progress * 1.35) - (index * 0.035)));
          dot.scale.setScalar(0.2 + (dotProgress * 0.8));
        });

        chartGroup.rotation.y = -0.45 + Math.sin(elapsed / 2400) * 0.04;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(render);
      };

      frameId = requestAnimationFrame(render);
      window.addEventListener('resize', resize);

      cleanup = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resize);
        achievedGeometry.dispose();
        targetGeometry.dispose();
        dotGeometry.dispose();
        baseGeometry.dispose();
        achievedMaterial.dispose();
        targetMaterial.dispose();
        gridMaterial.dispose();
        baseMaterial.dispose();
        achievedDotMaterial.dispose();
        targetDotMaterial.dispose();
        renderer.dispose();
      };
    });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [data, targetValue]);

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-white/5 bg-surface/40">
      <canvas ref={canvasRef} className="h-full w-full" aria-label={`3D target vs achieved chart in ${goalUnit}`} />
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/5 bg-surface/80 px-3 py-2 backdrop-blur">
        <p className="text-[10px] font-label-caps uppercase tracking-widest text-on-primary-container">3D Weekly Chart</p>
        <p className="text-sm font-bold text-on-surface">Target vs Achieved</p>
      </div>
    </div>
  );
}

export default function HabitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { habits, habitLogs, logHabit } = useHabits();
  const [selectedRoute, setSelectedRoute] = useState(null);

  const habit = habits.find(h => h.id === id);

  const logsForHabit = useMemo(() => {
    return habitLogs.filter(l => l.habitId === id);
  }, [habitLogs, id]);

  const logsWithRoutes = useMemo(() => {
    return logsForHabit.filter(l => l.route && l.route.length > 0).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logsForHabit]);

  const { currentStreak, bestStreak } = useMemo(() => {
    const sortedLogs = [...logsForHabit].filter(l => l.status === 'completed').sort((a,b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let maxStreak = 0;
    // Simplistic streak calc
    if (sortedLogs.length > 0) {
      let checkDate = new Date();
      for (let i = 0; i < 365; i++) {
        let dStr = format(checkDate, 'yyyy-MM-dd');
        let isLogged = sortedLogs.find(l => l.date === dStr);
        if (isLogged) streak++;
        else if (i > 0) break;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Calculate best streak (naive)
      let tempStreak = 0;
      for (let i = 0; i < 365; i++) {
        let checkDate2 = subDays(new Date(), i);
        let dStr = format(checkDate2, 'yyyy-MM-dd');
        let isLogged = sortedLogs.find(l => l.date === dStr);
        if (isLogged) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
    }
    return { currentStreak: streak, bestStreak: maxStreak };
  }, [logsForHabit]);

  if (!habit) return <div className="text-center mt-20">Habit not found</div>;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const todayLog = logsForHabit.find(l => l.date === todayStr);
  const currentValue = todayLog?.status === 'completed'
    ? habit.targetValue
    : Number(todayLog?.value || 0);
  const progressPercent = habit.targetValue > 0
    ? Math.min(100, Math.round((currentValue / habit.targetValue) * 100))
    : 0;
  const goalUnit = getGoalUnit(habit.type);
  const timelineData = weekDays.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = logsForHabit.find(l => l.date === dateStr);
    return {
      dateStr,
      day: format(date, 'EEE'),
      date: format(date, 'dd'),
      value: getLogValue(log, habit),
      isCompleted: log?.status === 'completed'
    };
  });
  const targetValue = Number(habit.targetValue) || 1;
  const latestActivePoint = [...timelineData].reverse().find(point => point.value > 0) || timelineData[timelineData.length - 1];
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-secondary/30 pb-32">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-50 font-manrope antialiased tracking-tight">{habit.name}</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
        <section className="relative flex flex-col items-center">
          <div className="relative w-72 h-72 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 288 288">
              <circle className="text-surface-container-high" cx="144" cy="144" fill="transparent" r={radius} stroke="currentColor" strokeWidth="8"></circle>
              <circle
                className="text-secondary transition-all duration-1000"
                cx="144"
                cy="144"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              ></circle>
            </svg>
            <div className="flex flex-col items-center text-center px-8 pt-5">
              <span className="material-symbols-outlined text-4xl text-secondary mb-1">{getHabitIcon(habit.type)}</span>
              <span className="font-headline-xl text-headline-xl text-on-surface">{progressPercent}%</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Today</span>
              <div className="mt-2 rounded-2xl border border-white/5 bg-surface-container/40 px-4 py-2">
                <span className="block text-body-sm text-on-surface-variant">Target</span>
                <span className="block text-lg font-bold text-on-surface">{habit.targetValue} {goalUnit}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 w-full">
            <div className="flex gap-4">
              <div className="flex-1 glass-card p-4 rounded-xl border border-white/5 text-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Current Streak</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <span className="font-headline-lg text-headline-lg text-tertiary">{currentStreak}</span>
                </div>
              </div>
              <div className="flex-1 glass-card p-4 rounded-xl border border-white/5 text-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Best Streak</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary">stars</span>
                  <span className="font-headline-lg text-headline-lg text-primary">{bestStreak}</span>
                </div>
              </div>
            </div>

            {habit.type === 'Distance' && (
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => navigate(`/track/${habit.id}`)}
                  className="flex-1 bg-secondary text-on-secondary-container font-headline-lg py-4 rounded-2xl shadow-[0_10px_25px_rgba(78,222,163,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-sm"
                >
                  <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">explore</span>
                  Start Tracking
                </button>
                
                <button 
                  onClick={() => {
                    if (progressPercent >= 100) {
                      logHabit(habit.id, todayStr, 'incomplete', 0);
                    } else {
                      logHabit(habit.id, todayStr, 'completed', habit.targetValue);
                    }
                  }}
                  className={`flex-1 py-4 rounded-2xl font-headline-lg flex items-center justify-center gap-2 transition-all text-sm ${
                    progressPercent >= 100 
                      ? 'bg-secondary/10 border border-secondary/20 text-secondary' 
                      : 'bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 active:scale-[0.98]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {progressPercent >= 100 ? 'undo' : 'check_circle'}
                  </span>
                  <span className="truncate">
                    {progressPercent >= 100 ? 'Unmark Complete' : 'Mark Complete'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Timeline</h3>
            <div className="flex items-center gap-3 text-[10px] font-label-caps uppercase tracking-wider text-on-primary-container">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary"></span>Achieved</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary"></span>Target</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl border border-white/5 p-4 sm:p-5">
            <TargetVsAchieved3DChart data={timelineData} targetValue={targetValue} goalUnit={goalUnit} />
            <div className="mt-4 grid grid-cols-7 gap-1">
              {timelineData.map(point => (
                <div key={point.dateStr} className="group relative text-center leading-tight">
                  <div className="pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2 rounded bg-surface-variant px-2 py-1 text-[10px] font-bold text-on-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                    {point.value} {goalUnit} / {targetValue} {goalUnit}
                  </div>
                  <span className={`block font-label-caps text-[10px] uppercase tracking-wider ${point.isCompleted ? 'text-secondary' : 'text-on-surface-variant'}`}>{point.day}</span>
                  <span className="block text-xs text-on-surface-variant">{point.date}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs font-label-caps uppercase tracking-widest text-on-primary-container">Target vs Achieved</span>
              <span className="text-sm font-bold text-on-surface">{latestActivePoint?.value || 0} {goalUnit} / {targetValue} {goalUnit}</span>
            </div>
          </div>
        </section>

        {habit.type === 'Distance' && habit.category === 'Outdoor' && (
          <section className="space-y-4">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Map History</h3>
            {logsWithRoutes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {logsWithRoutes.map((log) => (
                  <div 
                    key={log.id} 
                    className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-secondary/5 hover:border-secondary/20 transition-all cursor-pointer group"
                    onClick={() => setSelectedRoute(log)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">map</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface group-hover:text-secondary transition-colors">{format(parseISO(log.date), 'MMMM d, yyyy')}</p>
                        <p className="text-sm text-on-surface-variant">{log.value?.toFixed(2)} km Activity</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">chevron_right</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 rounded-2xl border border-white/5 border-dashed flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-on-surface/5 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">route</span>
                </div>
                <p className="text-on-surface font-bold">No GPS activities yet</p>
                <p className="text-sm text-on-surface-variant mt-1">Start a GPS session to see your route history here.</p>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h3 className="font-headline-lg text-headline-lg text-on-surface">Insight</h3>
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex gap-4 bg-gradient-to-br from-surface-container-high/40 to-transparent">
            <div className="p-3 rounded-xl bg-tertiary/10 h-fit">
              <span className="material-symbols-outlined text-tertiary">lightbulb</span>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-body-md text-on-surface leading-relaxed">
                {habit.type === 'Distance' 
                  ? "Track your outdoor sessions using GPS to see your routes and improve your pace."
                  : "You're building great momentum! Keep hitting your targets to improve your weekly completion rate."
                }
              </p>
              
              {habit.type === 'Distance' && (
                <button 
                  onClick={() => navigate(`/track/${habit.id}`)}
                  className="mt-4 w-full bg-secondary text-on-secondary-container font-headline-lg py-4 rounded-xl shadow-[0_5px_20px_rgba(78,222,163,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">explore</span>
                  Start GPS Tracking
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Map Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10" onClick={() => setSelectedRoute(null)}>
          <div className="w-full max-w-4xl bg-surface rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{format(parseISO(selectedRoute.date), 'MMMM d, yyyy')}</h2>
                <p className="text-sm text-on-surface-variant">{selectedRoute.value?.toFixed(2)} km Activity</p>
              </div>
              <button 
                onClick={() => setSelectedRoute(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 relative bg-surface-container">
              <MapContainer 
                center={selectedRoute.route[0]} 
                zoom={15} 
                className="w-full h-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <Polyline positions={selectedRoute.route} color="#4edea3" weight={5} opacity={0.8} />
                <Marker position={selectedRoute.route[0]} />
                <Marker position={selectedRoute.route[selectedRoute.route.length - 1]} />
              </MapContainer>
            </div>
            
            <div className="p-6 bg-surface-variant/20 flex justify-center">
              <button 
                onClick={() => setSelectedRoute(null)}
                className="px-8 py-3 rounded-xl bg-secondary text-on-secondary-container font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
