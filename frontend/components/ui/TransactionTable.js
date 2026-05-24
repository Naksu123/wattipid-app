import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactionHistory } from '@/services/database';
import { COLORS } from '@/styles/theme';

/**
 * Custom Hook to handle API logic, polling, and data formatting.
 * This separates the data fetching logic from the UI component.
 */
function useTransactions(roomId, tenantName, selectedDate) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20);

  const fetchTransactions = useCallback(async (isSilent = false) => {
    if (!roomId) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const data = await getTransactionHistory(roomId, limit, 'minute', tenantName, 0, dateString);
      
      let flat = [];
      if (Array.isArray(data)) {
        if (data.length > 0 && data[0].data) {
          data.forEach(group => {
            if (Array.isArray(group.data)) flat = flat.concat(group.data);
          });
        } else {
          flat = data;
        }
      }

      const mapped = flat.map((tx, index) => ({
        id: tx.id || index.toString(),
        timestamp: tx.timestamp,
        wattage: Number(tx.power || tx.wattage || 0),
        kwh: Number(tx.energy || tx.kwh || 0),
        cost: Number(tx.cost || 0)
      }));

      // Sort newest first
      mapped.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setTransactions(mapped);
    } catch (err) {
      console.error('[TransactionTable] Fetch error:', err);
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [roomId, tenantName, selectedDate, limit]);

  // Reset limit when date changes
  useEffect(() => {
    setLimit(20);
  }, [selectedDate]);

  // Initial fetch and auto-refresh polling (every 10 seconds)
  useEffect(() => {
    fetchTransactions();
    const intervalId = setInterval(() => fetchTransactions(true), 10000);
    return () => clearInterval(intervalId);
  }, [fetchTransactions]);

  const loadMore = () => setLimit(prev => prev + 20);

  return { 
    transactions, 
    loading, 
    error, 
    loadMore, 
    hasMore: transactions.length >= limit 
  };
}

/**
 * Utility to perfectly format the Date & Time
 * e.g., "May 24, 2026 2:00 PM"
 */
const formatDateTime = (ts) => {
  if (!ts) return "No date available";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "No date available";
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return "No date available";
  }
};

export default function TransactionTable({ 
  customRoomId, 
  customTenantName 
}) {
  const { user } = useAuth();
  const roomId = customRoomId || user?.room_id;
  const tenantName = customTenantName || user?.name;

  const [selectedDate, setSelectedDate] = useState(new Date());

  const { transactions, loading, error, loadMore, hasMore } = useTransactions(roomId, tenantName, selectedDate);

  // Determine row colors for visual hierarchy
  const getWattageColor = (wattage) => {
    if (wattage < 500) return COLORS.success; // Low
    if (wattage < 1500) return COLORS.warning; // Medium
    return COLORS.danger; // High
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={[s.container, s.centerBox]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <View style={[s.container, s.centerBox]}>
        <Ionicons name="alert-circle-outline" size={32} color={COLORS.danger} />
        <Text style={s.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Date Selector Header */}
      <View style={s.tableToolbar}>
        <TouchableOpacity 
          style={s.dateArrowBtn} 
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate);
          }}
        >
          <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={s.dateCenter}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={s.dateBtnText}>
            {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity 
          style={s.dateArrowBtn} 
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            if (newDate <= new Date()) setSelectedDate(newDate);
          }}
          disabled={selectedDate.toDateString() === new Date().toDateString()}
        >
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={selectedDate.toDateString() === new Date().toDateString() ? COLORS.textMuted : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      <View style={s.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Table Header exactly matching requirements */}
            <View style={s.tableHeader}>
              <Text style={[s.headerCell, { width: 140 }]}>Date & Time</Text>
              <Text style={[s.headerCell, { width: 70, textAlign: 'right' }]}>Wattage</Text>
              <Text style={[s.headerCell, { width: 80, textAlign: 'right' }]}>kWh</Text>
              <Text style={[s.headerCell, { width: 80, textAlign: 'right' }]}>Cost</Text>
            </View>

            {/* Table Body */}
            {transactions.length > 0 ? (
              transactions.map((tx, index) => {
                const wColor = getWattageColor(tx.wattage);
                return (
                  <View key={tx.id || index} style={[s.tableRow, index % 2 === 0 && s.tableRowAlt]}>
                    <View style={[s.cell, { width: 140 }]}>
                      <Text style={s.cellDate}>{formatDateTime(tx.timestamp)}</Text>
                    </View>
                    
                    <Text style={[s.cell, s.cellNumber, { width: 70, color: wColor }]}>
                      {tx.wattage.toFixed(0)}W
                    </Text>
                    
                    <Text style={[s.cell, s.cellNumber, { width: 80 }]}>
                      {tx.kwh.toFixed(4)} kWh
                    </Text>
                    
                    <Text style={[s.cell, s.cellNumber, s.cellCost, { width: 80 }]}>
                      ₱{tx.cost.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            ) : (
              // Empty State matching requirements perfectly
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
                <Text style={s.emptyTitle}>No recent transactions found</Text>
                <Text style={s.emptySubtitle}>Energy usage transactions will appear here.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      
      {/* Load More Button */}
      {transactions.length > 0 && hasMore && (
        <TouchableOpacity 
          style={s.loadMoreBtn} 
          onPress={loadMore}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={s.loadMoreText}>Load 20 More</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 30,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 25, 35, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    marginTop: 12,
    fontSize: 14,
  },
  tableToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  dateArrowBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: 'rgba(25, 25, 35, 0.6)', // Premium dark glass feel
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerCell: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  cell: {
    justifyContent: 'center',
  },
  cellDate: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  cellText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  cellNumber: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  cellCost: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 600, // Ensure empty state takes up horizontal width to prevent squishing
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  }
});
