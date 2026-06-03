import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS, FONT_WEIGHT, SPACING } from '@/styles/theme';
import { verifyPayment } from '../../../services/paymentService';

export default function PendingPaymentsWidget({ payments = [], onRefresh }) {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  if (!payments || payments.length === 0) return null;

  const handleAction = (action) => {
    setConfirmAction(action);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      await verifyPayment(selectedPayment.id, confirmAction);
      setSelectedPayment(null);
      setConfirmAction(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      const errorMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Action Required</Text>
      {payments.map(payment => (
        <TouchableOpacity key={payment.id} onPress={() => setSelectedPayment(payment)}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.roomBadge}>
                <Ionicons name="home" size={14} color={COLORS.primary} />
                <Text style={styles.roomText}>Room {payment.room_id}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(payment.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.cardBody}>
              <View>
                <Text style={styles.tenantName}>{payment.tenant_name || 'Unknown Tenant'}</Text>
                <Text style={styles.referenceText}>Ref: {payment.reference_number}</Text>
              </View>
              <Text style={styles.amount}>₱{parseFloat(payment.amount).toFixed(2)}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.reviewText}>Tap to review proof of payment &rarr;</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}

      {/* Verification Modal */}
      <Modal visible={!!selectedPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Payment</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)} disabled={loading}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            
            {selectedPayment && (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tenant:</Text>
                  <Text style={styles.infoValue}>{selectedPayment.tenant_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount Paid:</Text>
                  <Text style={styles.infoValueBold}>₱{parseFloat(selectedPayment.amount).toFixed(2)}</Text>
                </View>

                <Text style={styles.proofLabel}>Proof of Payment:</Text>
                {selectedPayment.proof_url ? (
                  <Image source={{ uri: selectedPayment.proof_url }} style={styles.proofImage} resizeMode="contain" />
                ) : (
                  <View style={styles.noProofBox}><Text style={styles.noProofText}>No image provided</Text></View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction('reject')} disabled={loading}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction('approve')} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Approve</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Sleek Custom Confirmation Modal */}
      <Modal visible={!!confirmAction} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmHeader}>
              <Ionicons 
                name={confirmAction === 'approve' ? 'checkmark-circle' : 'warning'} 
                size={40} 
                color={confirmAction === 'approve' ? '#10b981' : '#f59e0b'} 
              />
              <Text style={styles.confirmTitle}>
                Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
              </Text>
            </View>
            <Text style={styles.confirmMessage}>
              Are you sure you want to {confirmAction} this payment of ₱{selectedPayment ? parseFloat(selectedPayment.amount).toFixed(2) : '0.00'}?
              {confirmAction === 'approve' ? ' This will update the billing cycle to paid.' : ' The tenant will be notified.'}
            </Text>
            
            <View style={styles.confirmActionRow}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmAction(null)} disabled={loading}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmExecuteBtn, confirmAction === 'approve' ? styles.approveBtn : styles.rejectSolidBtn]} 
                onPress={executeAction} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Yes, {confirmAction}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: FONT_WEIGHT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, marginTop: 16 },
  card: { padding: 16, marginBottom: 12, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roomBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  roomText: { fontSize: 12, fontWeight: FONT_WEIGHT.bold, color: '#34d399' },
  dateText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  tenantName: { fontSize: 16, fontWeight: FONT_WEIGHT.bold, color: '#f8fafc', marginBottom: 4 },
  referenceText: { fontSize: 13, color: '#94a3b8' },
  amount: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: '#f59e0b' },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, alignItems: 'center' },
  reviewText: { fontSize: 13, color: '#fbbf24', fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContainer: { width: '100%', backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden', maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  modalBody: { padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#f8fafc', fontWeight: '500' },
  infoValueBold: { fontSize: 18, color: '#10b981', fontWeight: '800' },
  proofLabel: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginTop: 16, marginBottom: 8 },
  proofImage: { width: '100%', height: 300, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  noProofBox: { width: '100%', height: 100, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },
  noProofText: { color: '#64748b' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  rejectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  rejectBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  approveBtn: { backgroundColor: '#10b981' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  confirmModalContainer: { width: '85%', backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden', padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  confirmHeader: { alignItems: 'center', marginBottom: 16 },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginTop: 12, textAlign: 'center' },
  confirmMessage: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 30, paddingHorizontal: 10 },
  confirmActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  confirmCancelText: { color: '#cbd5e1', fontWeight: '600', fontSize: 16 },
  confirmExecuteBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  rejectSolidBtn: { backgroundColor: '#ef4444' }
});
