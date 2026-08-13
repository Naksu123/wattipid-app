import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getDashboardSummary } from '../services/consumptionService';
import { fetchRealtimeData } from '../services/esp32Api';

const ConsumptionContext = createContext({});

export const useConsumption = () => useContext(ConsumptionContext);

export const ConsumptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const roomId = user?.room_id;

  const [data, setData] = useState({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [rate, setRate] = useState(12.5); // Will be updated by fetchStaticConsumption

  const [todayUsage, setTodayUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [weekUsage, setWeekUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [monthUsage, setMonthUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [comparison, setComparison] = useState(null);

  const lastCumulativeEnergyRef = useRef(null);
  
  // Expose refs for downstream alerting logic if needed
  const todayUsageRef = useRef(todayUsage);
  const monthUsageRef = useRef(monthUsage);

  useEffect(() => {
    todayUsageRef.current = todayUsage;
    monthUsageRef.current = monthUsage;
  }, [todayUsage, monthUsage]);

  const fetchStaticConsumption = useCallback(async () => {
    if (!roomId) return;
    try {
      const result = await getDashboardSummary(roomId);
      if (result.success) {
        setTodayUsage(result.data.today);
        setWeekUsage(result.data.week);
        setComparison(result.data.week.comparison);

        // Try to get the actual rate from backend or user data (room's specific utility_rate)
        if (result.data.roomRate) {
           setRate(parseFloat(result.data.roomRate));
        } else if (user?.utility_rate && parseFloat(user.utility_rate) > 0) {
           setRate(parseFloat(user.utility_rate));
        } else if (result.data.globalRate) {
           setRate(parseFloat(result.data.globalRate));
        }

        // TRUE REAL-TIME: Reset baseline on fresh static load to prevent race conditions
        lastCumulativeEnergyRef.current = null;

        if (result.data.month) {
          setMonthUsage({
            totalEnergy: result.data.month.totalEnergy || 0,
            totalCost: result.data.month.totalCost || 0,
            cycle_start: result.data.month.cycle_start || null,
            cycle_end: result.data.month.cycle_end || null,
            next_reset: result.data.month.next_reset || null,
            tenant_start_date: result.data.month.tenant_start_date || null
          });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch static consumption:", e);
    }
  }, [roomId]);

  const fetchRealtimeDataLoop = useCallback(async () => {
    if (!roomId) return;
    try {
      const sensorData = await fetchRealtimeData(roomId);

      if (!sensorData) {
        setDeviceOnline(false);
        setData({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
        return;
      }

      setDeviceOnline(sensorData.online === true);
      setLastSeen(sensorData.lastSeen || new Date().toISOString());

      // ==========================================
      // TRUE REAL-TIME DELTA CALCULATION
      // ==========================================
      if (sensorData.online && typeof sensorData.energy === 'number') {
        const currentEnergy = sensorData.energy;
        const previousEnergy = lastCumulativeEnergyRef.current;
        
        if (previousEnergy !== null && currentEnergy > previousEnergy) {
           const delta = currentEnergy - previousEnergy;
           
           setTodayUsage(prev => {
             const newEnergy = parseFloat(prev.totalEnergy || 0) + delta;
             const newCost = parseFloat(prev.totalCost || 0) + (delta * rate);
             todayUsageRef.current = { ...prev, totalEnergy: newEnergy, totalCost: newCost };
             return { ...prev, totalEnergy: newEnergy, totalCost: newCost };
           });
           
           setWeekUsage(prev => {
             const newEnergy = parseFloat(prev.totalEnergy || 0) + delta;
             const newCost = parseFloat(prev.totalCost || 0) + (delta * rate);
             return { ...prev, totalEnergy: newEnergy, totalCost: newCost };
           });

           setMonthUsage(prev => {
             const newEnergy = parseFloat(prev.totalEnergy || 0) + delta;
             const newCost = parseFloat(prev.totalCost || 0) + (delta * rate);
             monthUsageRef.current = { ...prev, totalEnergy: newEnergy, totalCost: newCost };
             return { ...prev, totalEnergy: newEnergy, totalCost: newCost };
           });
        }
        lastCumulativeEnergyRef.current = currentEnergy;
      }

      if (!sensorData.online) {
        setData({
          voltage: 0,
          current: 0,
          power: 0,
          energy: sensorData.energy || 0,
          powerFactor: 0
        });
      } else {
        setData(sensorData);
      }
    } catch (err) {
      console.warn('Real-time fetch error:', err);
    }
  }, [roomId, rate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchStaticConsumption().then(() => fetchRealtimeDataLoop());
    const realtimeInterval = setInterval(fetchRealtimeDataLoop, 1000);

    return () => {
      clearInterval(realtimeInterval);
    };
  }, [isAuthenticated, fetchStaticConsumption, fetchRealtimeDataLoop]);

  return (
    <ConsumptionContext.Provider value={{
      data,
      deviceOnline,
      lastSeen,
      rate,
      todayUsage,
      weekUsage,
      monthUsage,
      comparison,
      todayUsageRef,
      monthUsageRef,
      fetchStaticConsumption
    }}>
      {children}
    </ConsumptionContext.Provider>
  );
};
