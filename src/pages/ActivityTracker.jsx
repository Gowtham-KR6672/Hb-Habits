import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { useHabits } from '../context/HabitContext';
import { format } from 'date-fns';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine formula to calculate distance between coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

// Component to dynamically center the map on the latest position
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

export default function ActivityTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { habits, logHabit } = useHabits();
  
  const habit = habits.find(h => h.id === id);
  
  const [isTracking, setIsTracking] = useState(false);
  const [positions, setPositions] = useState([]);
  const [distance, setDistance] = useState(0); // in km
  const [currentPos, setCurrentPos] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const watchIdRef = useRef(null);
  
  useEffect(() => {
    // Get initial position to center the map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        (err) => setErrorMsg('Failed to get location. ' + err.message),
        { enableHighAccuracy: true }
      );
    } else {
      setErrorMsg('Geolocation is not supported by your browser.');
    }
    
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation not supported.');
      return;
    }
    
    setIsTracking(true);
    setErrorMsg('');
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(newPos);
        setPositions(prev => {
          const newPositions = [...prev, newPos];
          // Recalculate total distance
          let totalDist = 0;
          for (let i = 1; i < newPositions.length; i++) {
            totalDist += calculateDistance(
              newPositions[i-1][0], newPositions[i-1][1],
              newPositions[i][0], newPositions[i][1]
            );
          }
          setDistance(totalDist);
          return newPositions;
        });
      },
      (err) => {
        setErrorMsg('GPS Error: ' + err.message);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  const pauseTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const finishActivity = () => {
    pauseTracking();
    if (distance > 0 && habit) {
      // Log the distance achieved today
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      // Status is completed if distance >= targetValue, else partial (but our system currently uses 'completed')
      const status = distance >= habit.targetValue ? 'completed' : 'partial'; // you can adapt this
      // The current HabitContext logHabit function takes (habitId, dateStr, status). 
      // It doesn't currently store numeric values for distance, but we log it as completed if it meets the goal.
      if (distance >= habit.targetValue) {
        logHabit(habit.id, dateStr, 'completed');
      } else {
        // Optional: you could implement partial logging if your context supported it
        logHabit(habit.id, dateStr, 'completed'); // Force complete for demo purposes if they finished
      }
    }
    navigate(`/habit/${id}`);
  };

  if (!habit) return <div className="text-center mt-20">Habit not found</div>;

  return (
    <div className="flex flex-col h-screen bg-background text-on-background relative">
      {/* Header overlay */}
      <div className="fixed top-0 left-0 w-full z-[9999] p-6 pt-10 flex justify-between items-start pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 rounded-full bg-surface-container-highest/90 backdrop-blur shadow-xl flex items-center justify-center text-on-surface hover:bg-surface-container border border-white/10 transition-colors pointer-events-auto"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="glass-card px-6 py-3 rounded-2xl border border-white/10 shadow-lg text-center backdrop-blur-xl pointer-events-auto">
          <span className="block font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase mb-1">Distance</span>
          <span className="text-3xl font-extrabold text-white tracking-tighter">{distance.toFixed(2)} <span className="text-lg text-secondary">km</span></span>
          <span className="block text-xs text-on-surface-variant mt-1">Goal: {habit.targetValue} km</span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-surface-container relative z-0">
        {errorMsg ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-error bg-surface-container-high z-10">
            <div className="glass-card p-6 border-error/20 bg-error/10 rounded-xl">
              <span className="material-symbols-outlined text-4xl mb-2">location_disabled</span>
              <p>{errorMsg}</p>
            </div>
          </div>
        ) : null}
        
        {currentPos ? (
          <MapContainer 
            center={currentPos} 
            zoom={16} 
            zoomControl={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {/* Custom map style (CartoDB Voyager) for a cleaner look */}
            <Polyline positions={positions} color="#4edea3" weight={5} opacity={0.8} />
            <Marker position={currentPos} />
            {isTracking && <MapUpdater center={currentPos} />}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-highest text-on-surface-variant">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
            <p>Locating GPS...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 w-full z-[9999] p-6 pb-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <div className="flex justify-center gap-3 max-w-sm mx-auto pointer-events-auto">
          {!isTracking ? (
            <>
              {positions.length === 0 && (
                <button 
                  onClick={() => navigate(-1)}
                  className="w-16 bg-surface-container-high text-on-surface font-headline-lg py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center border border-white/10"
                  title="Cancel"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button 
                onClick={startTracking}
                disabled={!currentPos}
                className="flex-1 bg-secondary text-on-secondary-container font-headline-lg py-4 rounded-2xl shadow-[0_10px_40px_rgba(78,222,163,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                {positions.length === 0 ? 'Start' : 'Resume'}
              </button>
            </>
          ) : (
            <button 
              onClick={pauseTracking}
              className="flex-1 bg-tertiary text-on-tertiary-container font-headline-lg py-4 rounded-2xl shadow-[0_10px_40px_rgba(255,183,77,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
              Pause
            </button>
          )}
          
          {(positions.length > 0 || distance > 0) && (
            <div className="flex gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="w-16 bg-surface-container-high text-on-surface font-headline-lg py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center border border-white/10"
                title="Discard Activity"
              >
                <span className="material-symbols-outlined text-error">delete</span>
              </button>
              <button 
                onClick={finishActivity}
                className="w-20 bg-error/90 text-white font-headline-lg py-4 rounded-2xl shadow-[0_10px_40px_rgba(248,113,113,0.3)] active:scale-[0.98] transition-all flex items-center justify-center border border-white/10"
                title="Finish and Save"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
