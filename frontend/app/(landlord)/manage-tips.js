import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { tipsService } from '../../services/tipsService';
import GlassCard from '../../components/ui/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/manage-tips.styles';

export default function ManageTipsScreen() {
  const router = useRouter();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: '', message: '', category: 'Energy Saving', icon: 'bulb-outline' });

  const categories = [
    'Air Conditioning',
    'Fan Usage',
    'Charging Devices',
    'Kitchen Appliances',
    'Refrigerator Usage',
    'Laundry',
    'Study Setup',
    'Shared Room Efficiency',
    'Gaming & Entertainment',
    'Appliance Maintenance',
    'Daily Habits'
  ];

  useEffect(() => { 
    loadTips(); 
    
    // Background polling for live engagement stats
    const interval = setInterval(async () => {
      try {
        const res = await tipsService.getAllTips();
        if (res && res.success) {
          setTips(currentTips => currentTips.map(t => {
            const updatedTip = (res.data || []).find(ut => ut.id === t.id);
            return updatedTip ? { ...t, likesCount: updatedTip.likesCount, viewsCount: updatedTip.viewsCount, isActive: updatedTip.isActive } : t;
          }));
        }
      } catch (err) {}
    }, 5000); // 5-second polling

    return () => clearInterval(interval);
  }, []);

  const loadTips = async () => {
    try {
      setLoading(true);
      const res = await tipsService.getAllTips();
      if (res && res.success) setTips(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ id: null, title: '', message: '', category: 'Energy Saving', icon: 'bulb-outline' });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (tip) => {
    setFormData({ ...tip });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.message) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    try {
      let res;
      if (isEditing) {
        res = await tipsService.updateTip(formData);
      } else {
        res = await tipsService.addTip(formData);
      }

      if (res.success) {
        setModalVisible(false);
        loadTips();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save tip');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Tip', 'Are you sure you want to permanently delete this tip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await tipsService.deleteTip(id);
          if (res.success) loadTips();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

  const toggleStatus = async (tip) => {
    try {
      const res = await tipsService.updateTip({ ...tip, isActive: tip.isActive == 1 ? 0 : 1 });
      if (res.success) loadTips();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTips = tips.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.message.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Tips</Text>
        <TouchableOpacity onPress={handleOpenAdd} style={styles.headerIconBtn}>
          <Ionicons name="add" size={30} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search and Filters Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search electricity tips..." 
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            <TouchableOpacity 
              onPress={() => setSelectedCategory('All')}
              style={[styles.catBtn, selectedCategory === 'All' && styles.catActive]}
            >
              <Text style={[styles.catText, selectedCategory === 'All' && styles.catTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setSelectedCategory(cat)}
                style={[styles.catBtn, selectedCategory === cat && styles.catActive]}
              >
                <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={styles.statValue}>{tips.length}</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statLabel}>ACTIVE</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{tips.filter(t => t.isActive == 1).length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ENGAGED</Text>
            <Text style={[styles.statValue, { color: COLORS.info }]}>{tips.reduce((acc, t) => acc + parseInt(t.viewsCount), 0)}</Text>
          </View>
        </View>

        {/* Tips List */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loaderText}>Fetching tips...</Text>
          </View>
        ) : (
          filteredTips.length > 0 ? (
            filteredTips.map(tip => (
              <GlassCard key={tip.id} style={[styles.tipCard, tip.isActive == 0 && styles.inactiveCard]}>
                <View style={styles.tipRow}>
                  {/* Left Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: tip.isActive == 1 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)' }]}>
                    <Ionicons name={tip.icon || 'bulb'} size={24} color={tip.isActive == 1 ? COLORS.primary : COLORS.textMuted} />
                  </View>

                  {/* Middle Content */}
                  <View style={styles.tipContent}>
                    <View style={styles.tipHeader}>
                      <Text style={styles.tipTitle} numberOfLines={1}>{tip.title}</Text>
                      <TouchableOpacity onPress={() => toggleStatus(tip)} style={styles.statusToggle}>
                        <Ionicons 
                          name={tip.isActive == 1 ? "checkmark-circle" : "close-circle"} 
                          size={22} 
                          color={tip.isActive == 1 ? COLORS.success : COLORS.textMuted} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.tipCategory}>{tip.category}</Text>
                    <Text style={styles.tipMessage} numberOfLines={2}>{tip.message}</Text>
                    
                    <View style={styles.tipFooter}>
                      <View style={styles.engagement}>
                        <View style={styles.engItem}>
                          <Ionicons name="heart" size={14} color={COLORS.danger} />
                          <Text style={styles.engText}>{tip.likesCount}</Text>
                        </View>
                        <View style={styles.engItem}>
                          <Ionicons name="eye" size={14} color={COLORS.info} />
                          <Text style={styles.engText}>{tip.viewsCount}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.actions}>
                        <TouchableOpacity onPress={() => handleOpenEdit(tip)} style={styles.actionBtn}>
                          <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(tip.id)} style={[styles.actionBtn, { marginLeft: 12 }]}>
                          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </GlassCard>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No tips found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or category filter.</Text>
            </View>
          )
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <BaseModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ModalHeader 
          title={isEditing ? "Edit Electricity Tip" : "Add New Electricity Tip"} 
          icon={isEditing ? "create" : "add-circle"} 
          onClose={() => setModalVisible(false)} 
        />
        <ModalBody>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TIP TITLE</Text>
              <TextInput 
                style={styles.input} 
                value={formData.title} 
                onChangeText={t => setFormData({...formData, title: t})}
                placeholder="e.g. Unplug Idle Chargers"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CATEGORY</Text>
              <View style={styles.picker}>
                {categories.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.pickerBtn, formData.category === cat && styles.pickerBtnActive]}
                    onPress={() => setFormData({...formData, category: cat})}
                  >
                    <Text style={[styles.pickerText, formData.category === cat && styles.pickerTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IONICON NAME</Text>
              <View style={styles.iconInputRow}>
                <Ionicons name={formData.icon || 'help-circle'} size={24} color={COLORS.primary} style={{ marginRight: 12 }} />
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  value={formData.icon} 
                  onChangeText={t => setFormData({...formData, icon: t})}
                  placeholder="e.g. bulb-outline"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TIP MESSAGE</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={formData.message} 
                onChangeText={t => setFormData({...formData, message: t})}
                placeholder="Provide clear, actionable energy-saving advice..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ModalBody>
        <ModalFooter 
          primaryLabel={isEditing ? "Update Tip" : "Publish Tip"}
          onPrimaryPress={handleSave}
          secondaryLabel="Discard"
          onSecondaryPress={() => setModalVisible(false)}
        />
      </BaseModal>
    </SafeAreaView>
  );
}


