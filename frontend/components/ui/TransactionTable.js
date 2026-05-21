import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';

export default function TransactionTable({ groupedTransactions = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'high_wattage', 'high_cost'

  // Flatten the grouped transactions from the backend into a single array (or accept flat directly)
  const flatTransactions = useMemo(() => {
    let flat = [];
    if (!groupedTransactions || !Array.isArray(groupedTransactions)) return flat;

    // If it's already a flat array of transactions (i.e. has timestamp or power directly)
    if (groupedTransactions.length > 0 && !groupedTransactions[0].data) {
      return groupedTransactions.map(tx => ({
        ...tx,
        dateTitle: tx.date_label || new Date(tx.timestamp).toLocaleDateString()
      }));
    }

    // Otherwise, it's grouped by { title, data: [] }
    groupedTransactions.forEach(group => {
      if (group.data && Array.isArray(group.data)) {
        group.data.forEach(tx => {
          flat.push({
            ...tx,
            dateTitle: group.title // Keep reference to the date
          });
        });
      }
    });
    return flat;
  }, [groupedTransactions]);

  // Apply Search & Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...flatTransactions];

    // Search filter
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(tx => 
        (tx.time_label && tx.time_label.toLowerCase().includes(lowerQ)) ||
        (tx.dateTitle && tx.dateTitle.toLowerCase().includes(lowerQ)) ||
        (tx.power && tx.power.toString().includes(lowerQ))
      );
    }

    // Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'high_wattage') {
      result.sort((a, b) => (b.power || 0) - (a.power || 0));
    } else if (sortBy === 'high_cost') {
      result.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    }

    return result;
  }, [flatTransactions, searchQuery, sortBy]);

  // Determine consumption color indicator
  const getConsumptionColor = (wattage) => {
    if (!wattage) return COLORS.textMuted;
    if (wattage < 500) return COLORS.success; // Low
    if (wattage < 1500) return COLORS.warning; // Medium
    return COLORS.danger; // High
  };

  return (
    <View style={s.container}>
      {/* Toolbar: Search and Sort */}
      <View style={s.toolbar}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput 
            style={s.searchInput}
            placeholder="Search time or wattage..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={s.sortWrap}>
          <TouchableOpacity 
            style={[s.sortBtn, sortBy === 'latest' && s.sortBtnActive]} 
            onPress={() => setSortBy('latest')}
          >
            <Text style={[s.sortBtnText, sortBy === 'latest' && s.sortBtnTextActive]}>Latest</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.sortBtn, sortBy === 'high_wattage' && s.sortBtnActive]} 
            onPress={() => setSortBy('high_wattage')}
          >
            <Text style={[s.sortBtnText, sortBy === 'high_wattage' && s.sortBtnTextActive]}>Peak W</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Responsive Table Container */}
      <View style={s.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Table Header */}
            <View style={s.tableHeader}>
              <Text style={[s.headerCell, { width: 130 }]}>Date & Time</Text>
              <Text style={[s.headerCell, { width: 140 }]}>Transaction Type</Text>
              <Text style={[s.headerCell, { width: 90, textAlign: 'right' }]}>Wattage</Text>
              <Text style={[s.headerCell, { width: 80, textAlign: 'right' }]}>kWh</Text>
              <Text style={[s.headerCell, { width: 80, textAlign: 'right' }]}>Cost</Text>
            </View>

            {/* Table Body */}
            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((tx, index) => {
                const wColor = getConsumptionColor(tx.power);
                return (
                  <View key={tx.id || index} style={[s.tableRow, index % 2 === 0 && s.tableRowAlt]}>
                    <View style={[s.cell, { width: 130 }]}>
                      <Text style={s.cellTitle}>{tx.time_label || '00:00'}</Text>
                      <Text style={s.cellSub}>{tx.dateTitle}</Text>
                    </View>
                    <View style={[s.cell, { width: 140, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <View style={[s.indicatorDot, { backgroundColor: wColor }]} />
                      <Text style={s.cellText} numberOfLines={1}>Energy Reading</Text>
                    </View>
                    <Text style={[s.cell, s.cellNumber, { width: 90, color: wColor }]}>
                      {Number(tx.power || 0).toFixed(0)}W
                    </Text>
                    <Text style={[s.cell, s.cellNumber, { width: 80 }]}>
                      {Number(tx.energy || 0).toFixed(4)}
                    </Text>
                    <Text style={[s.cell, s.cellNumber, s.cellCost, { width: 80 }]}>
                      ₱{Number(tx.cost || 0).toFixed(2)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={32} color={COLORS.textMuted} />
                <Text style={s.emptyText}>No transactions found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 30,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    marginLeft: 6,
  },
  sortWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 2,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary,
  },
  sortBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#fff',
  },
  tableCard: {
    backgroundColor: 'rgba(25, 25, 35, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  cellTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  cellSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cellText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  cellNumber: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
  cellCost: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 14,
  }
});
