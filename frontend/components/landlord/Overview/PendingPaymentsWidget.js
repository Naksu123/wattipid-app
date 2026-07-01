import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { verifyPayment } from '../../../services/paymentService';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/PendingPaymentsWidget.styles';

export default function PendingPaymentsWidget({ payments = [], onRefresh }) {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [partialEnabled, setPartialEnabled] = useState(false);
  const [actualAmount, setActualAmount] = useState('');

  useEffect(() => {
    import('../../../services/database').then(({ getSetting }) => {
      getSetting('partial_payments_enabled').then(res => setPartialEnabled(res === 'true'));
    });
  }, []);

  if (!payments || payments.length === 0) return null;

  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setActualAmount(payment.amount.toString());
  };

  const handleAction = (action) => {
    setConfirmAction(action);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      const parsedAmount = parseFloat(actualAmount);
      if (confirmAction === 'approve' && (isNaN(parsedAmount) || parsedAmount <= 0)) {
         throw new Error('Please enter a valid actual amount received.');
      }
      
      await verifyPayment(selectedPayment.id, confirmAction, null, parsedAmount);
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
        <TouchableOpacity key={payment.id} onPress={() => handleSelectPayment(payment)}>
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
                <Text style={styles.referenceText}>Method: {payment.payment_method?.toUpperCase() || 'ONLINE'}</Text>
                {payment.reference_number && <Text style={styles.referenceText}>Ref: {payment.reference_number}</Text>}
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
      <Modal visible={!!selectedPayment} transparent animationType="slide" onRequestClose={() => setSelectedPayment(null)}>
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
                  <Text style={styles.infoLabel}>Method:</Text>
                  <Text style={styles.infoValue}>{selectedPayment.payment_method?.toUpperCase() || 'ONLINE'}</Text>
                </View>
                {selectedPayment.payment_date && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Paid On:</Text>
                  <Text style={styles.infoValue}>{new Date(selectedPayment.payment_date).toLocaleDateString()}</Text>
                </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Declared Amount:</Text>
                  <Text style={styles.infoValueBold}>₱{parseFloat(selectedPayment.amount).toFixed(2)}</Text>
                </View>
                
                {partialEnabled && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.infoLabel}>Actual Amount Received:</Text>
                    <TextInput 
                      style={styles.actualInput}
                      value={actualAmount}
                      onChangeText={setActualAmount}
                      keyboardType="numeric"
                    />
                  </View>
                )}

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
      <Modal visible={!!confirmAction} transparent animationType="fade" onRequestClose={() => setConfirmAction(null)}>
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


