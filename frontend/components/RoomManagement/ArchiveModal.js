import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import styles from '../../styles/components/RoomManagement/ArchiveModal.styles';
export default function ArchiveModal({ 
  visible, 
  onClose, 
  onConfirm, 
  roomName, 
  isLoading, 
  isRestore = false 
}) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <View style={[styles.iconContainer, isRestore ? styles.iconRestore : styles.iconArchive]}>
            <Ionicons 
              name={isRestore ? "refresh-outline" : "archive-outline"} 
              size={32} 
              color={isRestore ? COLORS.primary : COLORS.danger} 
            />
          </View>
          
          <Text style={styles.title}>
            {isRestore ? "Restore Room" : "Archive Room"}
          </Text>
          
          <Text style={styles.message}>
            {isRestore 
              ? `Are you sure you want to restore ${roomName || 'this room'} to the active listings?` 
              : `Archiving ${roomName || 'this room'} will remove it from active listings while preserving historical tenant, billing, and payment records.`}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                isRestore ? styles.restoreButton : styles.archiveButton
              ]} 
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {isRestore ? "Restore" : "Archive"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}


