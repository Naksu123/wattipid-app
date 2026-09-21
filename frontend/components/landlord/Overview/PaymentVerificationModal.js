import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../../../styles/components/landlord/Overview/PaymentVerificationModal.styles';
import { verifyPayment } from '../../../services/paymentService';
import { copyToClipboard } from '../../../services/clipboardService';

export default function PaymentVerificationModal({ visible, payment, onClose, onRefresh }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'verify' or 'reject'
  const [showFullsize, setShowFullsize] = useState(false);

  // Avatar initials
  const initials = useMemo(() => {
    if (!payment) return 'TE';
    const name = payment.tenant_name || payment.tenantName || 'Tenant';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [payment]);

  // Date Object memoized
  const dateObj = useMemo(() => {
    const raw = payment?.payment_date || payment?.created_at;
    return raw ? new Date(typeof raw === 'string' ? raw.replace(' ', 'T') : raw) : new Date();
  }, [payment]);

  // Cycle subtitle
  const cycleSubtitle = useMemo(() => {
    if (!payment) return '';
    const room = payment.room_name || payment.room_id || 'Room';
    const roomStr = String(room).toLowerCase().startsWith('room') ? room : `Room ${room}`;
    if (payment.cycle_start && payment.cycle_end) {
      const start = new Date(payment.cycle_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `${roomStr} • ${start} Cycle`;
    }
    if (payment.invoice_number) {
      return `${roomStr} • #${payment.invoice_number}`;
    }
    return `${roomStr} • Payment Submission`;
  }, [payment]);

  // Proof filename
  const proofFileName = useMemo(() => {
    if (payment?.payment_method) {
      const methodClean = payment.payment_method.replace(/\s+/g, '_');
      const datePart = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(/\s+/g, '');
      return `${methodClean}_Receipt_${datePart}.png`;
    }
    return 'Payment_Receipt.png';
  }, [payment?.payment_method, dateObj]);

  if (!payment) return null;

  const handleClose = () => {
    setRejecting(false);
    setRejectionReason('');
    setLoadingAction(null);
    setShowFullsize(false);
    onClose();
  };

  // Submitted amount
  const submittedAmount = parseFloat(
    payment.amount ??
      payment.outstanding_balance ??
      (payment.grand_total
        ? parseFloat(payment.grand_total) - parseFloat(payment.amount_paid || 0)
        : parseFloat(payment.total_cost || 0) + parseFloat(payment.penalty_amount || 0))
  );

  // Expected amount
  const expectedAmount = parseFloat(
    payment.expected_amount ??
      payment.grand_total ??
      payment.total_cost ??
      submittedAmount
  );

  const isAmountMatch = Math.abs(submittedAmount - expectedAmount) < 0.05;

  // Format Date
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleCopyRef = async () => {
    if (!payment.reference_number) return;
    try {
      await copyToClipboard(payment.reference_number);
      DeviceEventEmitter.emit('showToast', {
        message: 'Reference number copied to clipboard!',
        type: 'success',
      });
    } catch {
      DeviceEventEmitter.emit('showToast', {
        message: `Copied: ${payment.reference_number}`,
        type: 'info',
      });
    }
  };

  const handleVerify = async () => {
    try {
      setLoadingAction('verify');
      await verifyPayment(payment.id, 'approve', null, submittedAmount);
      DeviceEventEmitter.emit('showToast', {
        message: 'Payment successfully approved & verified!',
        type: 'success',
      });
      if (onRefresh) onRefresh();
      handleClose();
    } catch (error) {
      DeviceEventEmitter.emit('showToast', {
        message: error?.message || 'Failed to verify payment',
        type: 'error',
      });
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
      DeviceEventEmitter.emit('showToast', {
        message: 'Please provide a reason for rejection.',
        type: 'error',
      });
      return;
    }

    try {
      setLoadingAction('reject');
      await verifyPayment(payment.id, 'reject', rejectionReason.trim());
      DeviceEventEmitter.emit('showToast', {
        message: 'Payment has been rejected.',
        type: 'success',
      });
      if (onRefresh) onRefresh();
      handleClose();
    } catch (error) {
      DeviceEventEmitter.emit('showToast', {
        message: error?.message || 'Failed to reject payment',
        type: 'error',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
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

            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Payment Verification</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* 1. Tenant Info Card */}
              <View style={styles.tenantCard}>
                <View style={styles.tenantAvatar}>
                  <Text style={styles.tenantAvatarText}>{initials}</Text>
                </View>
                <View style={styles.tenantInfo}>
                  <Text style={styles.tenantName} numberOfLines={1}>
                    {payment.tenant_name || payment.tenantName || 'Tenant'}
                  </Text>
                  <Text style={styles.tenantSub} numberOfLines={1}>
                    {cycleSubtitle}
                  </Text>
                </View>
              </View>

              {/* 2. Proof of Payment Card */}
              <View style={styles.proofCard}>
                {payment.proof_url ? (
                  <>
                    <Image
                      source={{ uri: payment.proof_url }}
                      style={styles.proofThumbnail}
                      resizeMode="contain"
                    />
                    <Text style={styles.proofFileName} numberOfLines={1}>
                      {proofFileName}
                    </Text>
                    <Text style={styles.proofHint}>Click to expand receipt</Text>
                    <TouchableOpacity
                      style={styles.viewFullsizeBtn}
                      onPress={() => setShowFullsize(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="scan-outline" size={15} color="#E2E8F0" />
                      <Text style={styles.viewFullsizeText}>View Fullsize</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.proofIconBox}>
                      <Ionicons name="document-text-outline" size={28} color="#38BDF8" />
                    </View>
                    <Text style={styles.proofFileName}>{proofFileName}</Text>
                    <Text style={styles.missingProofText}>No image proof uploaded by tenant</Text>
                  </>
                )}
              </View>

              {/* 3. Transaction Audit Section */}
              <View style={styles.auditCard}>
                <Text style={styles.auditTitle}>Transaction Audit</Text>

                {/* Expected Amount */}
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Expected Amount</Text>
                  <Text style={styles.auditValue}>
                    ₱{expectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* Submitted Amount */}
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Submitted Amount</Text>
                  <Text
                    style={[
                      styles.auditValue,
                      isAmountMatch ? styles.auditValueMatch : styles.auditValueWarning,
                    ]}
                  >
                    ₱{submittedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    {isAmountMatch ? '(Match)' : '(Discrepancy)'}
                  </Text>
                </View>

                {/* Reference Number */}
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Reference Number</Text>
                  <View style={styles.auditValueWrap}>
                    <Text style={styles.auditValue}>
                      {payment.reference_number || 'None'}
                    </Text>
                    {!!payment.reference_number && (
                      <TouchableOpacity
                        onPress={handleCopyRef}
                        style={styles.copyBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="copy-outline" size={16} color="#38BDF8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Date Submitted */}
                <View style={[styles.auditRow, styles.auditRowLast]}>
                  <Text style={styles.auditLabel}>Date Submitted</Text>
                  <Text style={styles.auditValue}>
                    {formattedDate} at {formattedTime}
                  </Text>
                </View>
              </View>

              {/* Rejection Input (conditional) */}
              {rejecting && (
                <View style={styles.rejectionBox}>
                  <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                  <TextInput
                    style={styles.rejectionInput}
                    placeholder="E.g. Invalid reference number, blurry screenshot..."
                    placeholderTextColor="#64748B"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    autoFocus
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.rejectBtn,
                    rejecting && styles.rejectBtnActive,
                    loadingAction === 'verify' && styles.disabledBtn,
                  ]}
                  onPress={handleReject}
                  disabled={loadingAction !== null}
                  activeOpacity={0.8}
                >
                  {loadingAction === 'reject' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={rejecting ? '#FFFFFF' : '#EF4444'}
                      />
                      <Text
                        style={[
                          styles.rejectBtnText,
                          rejecting && styles.rejectBtnTextActive,
                        ]}
                      >
                        {rejecting ? 'Confirm Reject' : 'Reject'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {!rejecting && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.approveBtn,
                      loadingAction === 'reject' && styles.disabledBtn,
                    ]}
                    onPress={handleVerify}
                    disabled={loadingAction !== null}
                    activeOpacity={0.8}
                  >
                    {loadingAction === 'verify' ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>Approve Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {rejecting && (
                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setRejecting(false)}
                >
                  <Text style={styles.cancelRejectText}>Cancel Rejection</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullsize Image Preview Modal */}
      {showFullsize && payment.proof_url && (
        <Modal
          visible={showFullsize}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFullsize(false)}
        >
          <View style={styles.fullsizeOverlay}>
            <TouchableOpacity
              style={styles.fullsizeClose}
              onPress={() => setShowFullsize(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: payment.proof_url }}
              style={styles.fullsizeImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </>
  );
}
