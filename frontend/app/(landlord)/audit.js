import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/audit.styles';
import apiClient from '../../services/apiClient';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await apiClient.post('/api.php', { action: 'getSystemAuditLogs' });
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const renderLogItem = (log) => {
    const isFinancial = log.log_type === 'financial';
    const dateStr = new Date(log.created_at).toLocaleString();

    let iconName = isFinancial ? 'cash-outline' : 'settings-outline';
    let iconColor = isFinancial ? COLORS.primary : COLORS.secondary;

    if (log.action_type.toLowerCase().includes('delete') || log.action_type.toLowerCase().includes('reject')) {
        iconName = 'trash-bin-outline';
        iconColor = COLORS.danger;
    } else if (log.action_type.toLowerCase().includes('create') || log.action_type.toLowerCase().includes('verify')) {
        iconName = 'checkmark-circle-outline';
        iconColor = COLORS.success;
    }

    return (
      <TouchableOpacity 
        key={log.id + log.log_type} 
        style={styles.logCard}
        activeOpacity={0.7}
        onPress={() => setSelectedLog(log)}
      >
        <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.details}>
          <Text style={styles.actionText}>{log.action_type.toUpperCase()}</Text>
          <Text style={styles.targetText}>
            Target: {log.table_affected} {log.description ? ` - ${log.description}` : ''}
          </Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching immutable audit trails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Audit Logs</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.disclaimer}>
          <Ionicons name="shield-checkmark" size={16} /> These records are immutable and track all critical system changes for security compliance.
        </Text>
        
        {logs.length === 0 ? (
           <View style={styles.center}>
             <Text style={styles.dateText}>No audit logs found.</Text>
           </View>
        ) : (
          logs.map(renderLogItem)
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={!!selectedLog} transparent animationType="fade" onRequestClose={() => setSelectedLog(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit Details</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLog(null)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="flash-outline" size={16} color={COLORS.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Action Type</Text>
                  <Text style={styles.detailValue}>{selectedLog?.action_type?.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="folder-open-outline" size={16} color={COLORS.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Target Table/Entity</Text>
                  <Text style={styles.detailValue}>{selectedLog?.table_affected}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="time-outline" size={16} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Timestamp</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog?.created_at ? new Date(selectedLog.created_at).toLocaleString('en-US', { 
                      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    }) : '--'}
                  </Text>
                </View>
              </View>

              {selectedLog?.description && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedLog?.description}</Text>
                  </View>
                </View>
              )}

              {selectedLog?.old_value && (
                <View style={styles.codeSection}>
                  <Text style={styles.detailLabel}>Old Value</Text>
                  <View style={styles.jsonBox}>
                    <Text style={styles.jsonText}>{selectedLog.old_value}</Text>
                  </View>
                </View>
              )}

              {selectedLog?.new_value && (
                <View style={styles.codeSection}>
                  <Text style={styles.detailLabel}>New Value / Metadata</Text>
                  <View style={styles.jsonBox}>
                    <Text style={styles.jsonText}>{selectedLog.new_value}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


