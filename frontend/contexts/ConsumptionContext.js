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
  const [monthUsage, setMonthUsage] = useState({ 
    totalEnergy: 0, 
    totalCost: 0, 
    electricityCharge: 0, 
    previousBalance: 0, 
    monthlyRent: 0, 
    additionalCharges: 0, 
    penalty: 0, 
    discounts: 0, 
    liveBillTotal: 0 
  });
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
          const m = result.data.month;
          setMonthUsage({
            ...m,
            totalEnergy: parseFloat(m.totalEnergy || 0),
            totalCost: parseFloat(m.totalCost || 0),
            electricityCharge: parseFloat(m.electricityCharge !== undefined ? m.electricityCharge : (m.totalCost || 0)),
            previousBalance: parseFloat(m.previousBalance || 0),
            monthlyRent: parseFloat(m.monthlyRent || 0),
            additionalCharges: parseFloat(m.additionalCharges || 0),
            penalty: parseFloat(m.penalty || 0),
            discounts: parseFloat(m.discounts || 0),
            liveBillTotal: parseFloat(m.liveBillTotal !== undefined ? m.liveBillTotal : (m.totalCost || 0)),
            cycle_start: m.cycle_start || null,
            cycle_end: m.cycle_end || null,
            next_reset: m.next_reset || null,
            tenant_start_date: m.tenant_start_date || null
          });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch static consumption:", e);
    }
  }, [roomId, user?.utility_rate]);

  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const [reconnecting, setReconnecting] = useState(false);
  const reconnectingRef = useRef(reconnecting);
  useEffect(() => {
    reconnectingRef.current = reconnecting;
  }, [reconnecting]);

  const pollingTimerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !roomId) return;
    let isCancelled = false;

    const runPollingLoop = async () => {
      if (isCancelled) return;
      try {
        const sensorData = await fetchRealtimeData(roomId);
        if (isCancelled) return;

        if (sensorData && sensorData.networkError) {
          // Network dropped. Preserve last known data and show reconnecting.
          setReconnecting(true);
        } else {
          if (reconnectingRef.current) {
            // Connection restored!
            setReconnecting(false);
            fetchStaticConsumption();
          }

          if (!sensorData) {
            setDeviceOnline(false);
            setData({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
          } else {
            setDeviceOnline(sensorData.online === true);
            setLastSeen(sensorData.lastSeen || new Date().toISOString());

            // TRUE REAL-TIME DELTA CALCULATION
            if (sensorData.online && typeof sensorData.energy === 'number') {
              const currentEnergy = sensorData.energy;
              const previousEnergy = lastCumulativeEnergyRef.current;
              const currentRate = rateRef.current;

              if (previousEnergy !== null && currentEnergy > previousEnergy) {
                const delta = currentEnergy - previousEnergy;

                setTodayUsage(prev => {
                  const newEnergy = parseFloat(prev.totalEnergy || 0) + delta;
                  const newCost = parseFloat(prev.totalCost || 0) + (delta * currentRate);
                  todayUsageRef.current = { ...prev, totalEnergy: newEnergy, totalCost: newCost };
                  return { ...prev, totalEnergy: newEnergy, totalCost: newCost };
                });

                setWeekUsage(prev => {
                  const newEnergy = parseFloat(prev.totalEnergy || 0) + delta;
                  const newCost = parseFloat(prev.totalCost || 0) + (delta * currentRate);
                  return { ...prev, totalEnergy: newEnergy, totalCost: newCost };
                });

                setMonthUsage(prev => {
                  const newEnergy = parseFloat(prev.totalEnergy || 0) + delta;
                  const newCost = parseFloat(prev.totalCost || 0) + (delta * currentRate);

                  // Keep electricityCharge perfectly in sync with real-time delta
                  const newElectricityCharge = prev.electricityCharge !== undefined 
                     ? parseFloat(prev.electricityCharge || 0) + (delta * currentRate) 
                     : newCost;

                  monthUsageRef.current = { ...prev, totalEnergy: newEnergy, totalCost: newCost, electricityCharge: newElectricityCharge };
                  return { ...prev, totalEnergy: newEnergy, totalCost: newCost, electricityCharge: newElectricityCharge };
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
          }
        }
      } catch (err) {
        console.warn('Real-time fetch error:', err);
      } finally {
        if (!isCancelled) {
          pollingTimerRef.current = setTimeout(runPollingLoop, 2000);
        }
      }
    };

    fetchStaticConsumption().then(() => {
      if (!isCancelled) {
        runPollingLoop();
      }
    });

    return () => {
      isCancelled = true;
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isAuthenticated, roomId, fetchStaticConsumption]);

  return (
    <ConsumptionContext.Provider value={{
      data,
      deviceOnline,
      reconnecting,
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
