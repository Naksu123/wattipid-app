import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/PaymentVerificationModal.styles';
import { verifyPayment } from '../../../services/paymentService';

export default function PaymentVerificationModal({ visible, payment, onClose, onRefresh }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'verify' or 'reject'
  
  if (!payment) return null;

  const handleClose = () => {
    setRejecting(false);
    setRejectionReason('');
    setLoadingAction(null);
    onClose();
  };

  const handleVerify = async () => {
    try {
      setLoadingAction('verify');
      // payment.amount or total_cost. Need to pass actualAmount if possible. Let's pass null for actual amount to use what is in DB, or payment.amount.
      const amount = parseFloat(payment.amount || payment.total_cost || 0) + parseFloat(payment.penalty_amount || 0);
      await verifyPayment(payment.id, 'approve', null, amount);
      DeviceEventEmitter.emit('showToast', { message: 'Payment successfully verified!', type: 'success' });
      onRefresh(); // Refresh the parent widget
      handleClose();
    } catch (error) {
      DeviceEventEmitter.emit('showToast', { message: error?.message || 'Failed to verify payment', type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) {
      setRejecting(true);
      return;
    }

    if (!rejectionReason.trim()) {
      DeviceEventEmitter.emit('showToast', { message: 'Please provide a reason for rejection.', type: 'error' });
      return;
    }

    try {
      setLoadingAction('reject');
      await verifyPayment(payment.id, 'reject', rejectionReason.trim());
      DeviceEventEmitter.emit('showToast', { message: 'Payment has been rejected.', type: 'success' });
      onRefresh(); // Refresh the parent widget
      handleClose();
    } catch (error) {
      DeviceEventEmitter.emit('showToast', { message: error?.message || 'Failed to reject payment', type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const amount = parseFloat(payment.amount || payment.total_cost || 0) + parseFloat(payment.penalty_amount || 0);
  const formattedDate = new Date(payment.payment_date || payment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.dragIndicator} />
          
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Payment Details</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Amount Hero */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>₱{amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tenant</Text>
                <Text style={styles.detailValue}>{payment.tenant_name || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Room</Text>
                <Text style={styles.detailValue}>Room {payment.room_name || payment.room_id || '?'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{payment.payment_method}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference No.</Text>
                <Text style={styles.detailValue}>{payment.reference_number || 'N/A'}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Date Submitted</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>
            </View>

            {/* Proof of Payment */}
            <View style={styles.proofSection}>
              <Text style={styles.sectionTitle}>Proof of Payment</Text>
              <View style={styles.proofImageContainer}>
                {payment.proof_url ? (
                  <Image 
                    source={{ uri: payment.proof_url }} 
                    style={styles.proofImage} 
                    resizeMode="contain" 
                  />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.missingProof}>No proof image uploaded</Text>
                  </>
                )}
              </View>
            </View>

            {/* Rejection Input */}
            {rejecting && (
              <View style={styles.rejectionInputContainer}>
                <Text style={styles.sectionTitle}>Rejection Reason</Text>
                <TextInput
                  style={styles.rejectionInput}
                  placeholder="E.g., Invalid reference number, blurred image..."
                  placeholderTextColor={COLORS.textMuted}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  autoFocus
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.rejectButton, rejecting && styles.rejectButtonActive, loadingAction === 'verify' && styles.disabledButton]} 
                onPress={handleReject}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'reject' ? (
                  <ActivityIndicator color={rejecting ? COLORS.white : COLORS.danger} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={20} color={rejecting ? COLORS.white : COLORS.danger} style={{ marginRight: 8 }} />
                    <Text style={[styles.buttonText, styles.rejectButtonText, rejecting && styles.rejectButtonTextActive]}>
                      {rejecting ? 'Confirm Reject' : 'Reject'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {!rejecting && (
                <TouchableOpacity 
                  style={[styles.button, styles.verifyButton, loadingAction === 'reject' && styles.disabledButton]} 
                  onPress={handleVerify}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === 'verify' ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>Verify Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
