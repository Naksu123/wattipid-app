import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  StatusBar,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useModal } from '../../contexts/ModalContext';
import { tipsService } from '../../services/tipsService';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import styles from '../../styles/landlord/manage-tips.styles';

const CATEGORIES = [
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
  'Daily Habits',
];

const PRESET_ICONS = [
  'snow-outline',
  'aperture-outline',
  'bulb-outline',
  'flash-outline',
  'cube-outline',
  'water-outline',
  'battery-charging-outline',
  'leaf-outline',
  'restaurant-outline',
  'book-outline',
  'game-controller-outline',
  'construct-outline',
];

const CATEGORY_MAP = {
  'Air Conditioning': { label: 'Air Conditioner', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'snow-outline', savings: '~₱250/mo' },
  'Air Conditioner': { label: 'Air Conditioner', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'snow-outline', savings: '~₱250/mo' },
  'Rooms': { label: 'Rooms', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)', icon: 'home-outline', savings: '~₱120/mo' },
  'Shared Room Efficiency': { label: 'Rooms', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)', icon: 'people-outline', savings: '~₱120/mo' },
  'Lighting': { label: 'Lighting', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'bulb-outline', savings: '~₱80/mo' },
  'Appliance': { label: 'Appliance', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'hardware-chip-outline', savings: '~₱150/mo' },
  'Refrigerator Usage': { label: 'Appliance', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'cube-outline', savings: '~₱150/mo' },
  'Fan Usage': { label: 'Fan Usage', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', icon: 'aperture-outline', savings: '~₱50/mo' },
  'Charging Devices': { label: 'Charging', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)', icon: 'battery-charging-outline', savings: '~₱40/mo' },
  'Kitchen Appliances': { label: 'Kitchen', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)', icon: 'restaurant-outline', savings: '~₱100/mo' },
  'Laundry': { label: 'Laundry', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)', icon: 'water-outline', savings: '~₱90/mo' },
  'Study Setup': { label: 'Study', color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)', icon: 'book-outline', savings: '~₱65/mo' },
  'Gaming & Entertainment': { label: 'Gaming', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)', icon: 'game-controller-outline', savings: '~₱75/mo' },
  'Appliance Maintenance': { label: 'Maintenance', color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.15)', icon: 'construct-outline', savings: '~₱110/mo' },
  'Daily Habits': { label: 'Habits', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', icon: 'leaf-outline', savings: '~₱60/mo' },
};

const getCategoryMeta = (category) => {
  if (!category) {
    return { label: 'General', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'bulb-outline', savings: '~₱75/mo' };
  }
  return CATEGORY_MAP[category] || {
    label: category,
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    icon: 'bulb-outline',
    savings: '~₱75/mo',
  };
};

export default function ManageTipsScreen() {
  const router = useRouter();
  const { showModal } = useModal();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, 
    title: '', 
    message: '', 
    category: 'Air Conditioning', 
    icon: 'snow-outline',
    isActive: 1,
  });

  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCached = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cached_landlord_manage_tips');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTips(parsed);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('[ManageTipsScreen] Cache restore error:', err);
      }
    };
    restoreCached();
    return () => { isMounted = false; };
  }, []);

  // Fetch Tips & Background Polling
  useEffect(() => { 
    loadTips(); 
    
    // Background polling for live engagement stats (relaxed to 30 seconds)
    const interval = setInterval(async () => {
      try {
        const res = await tipsService.getAllTips();
        if (res && res.success && Array.isArray(res.data)) {
          setTips(currentTips => currentTips.map(t => {
            const updatedTip = res.data.find(ut => ut.id === t.id);
            return updatedTip 
              ? { 
                  ...t, 
                  likesCount: updatedTip.likesCount, 
                  viewsCount: updatedTip.viewsCount, 
                  isActive: updatedTip.isActive 
                } 
              : t;
          }));
        }
      } catch (err) {}
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTips = async () => {
    try {
      const res = await tipsService.getAllTips();
      if (res && res.success && Array.isArray(res.data)) {
        setTips(res.data);
        AsyncStorage.setItem('@cached_landlord_manage_tips', JSON.stringify(res.data)).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ 
      id: null, 
      title: '', 
      message: '', 
      category: 'Air Conditioning', 
      icon: 'snow-outline',
      isActive: 1,
    });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleOpenEdit = (tip) => {
    setFormData({ 
      ...tip,
      isActive: tip.isActive !== undefined ? tip.isActive : 1,
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.message?.trim()) {
      showModal({ 
        type: 'warning', 
        title: 'Missing Required Fields', 
        message: 'Please provide both a title and actionable advice message for the tip.' 
      });
      return;
    }

    try {
      setIsSubmitting(true);
      let res;
      if (isEditing) {
        res = await tipsService.updateTip(formData);
      } else {
        res = await tipsService.addTip(formData);
      }

      if (res && res.success) {
        setModalVisible(false);
        loadTips();
      } else {
        showModal({ 
          type: 'error', 
          title: 'Operation Failed', 
          message: res?.message || 'Unable to save tip. Please try again.' 
        });
      }
    } catch (err) {
      showModal({ type: 'error', title: 'Error', message: 'Failed to save tip' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    showModal({
      type: 'confirm',
      title: 'Delete Tip',
      message: 'Are you sure you want to permanently delete this tip from the tenant CMS?',
      secondaryButtonText: 'Cancel',
      primaryButtonText: 'Delete',
      onPrimaryPress: async () => {
        try {
          const res = await tipsService.deleteTip(id);
          if (res && res.success) {
            setTips(prev => prev.filter(t => t.id !== id));
            loadTips();
          }
        } catch (err) {
          showModal({ type: 'error', title: 'Error', message: 'Failed to delete tip' });
        }
      }
    });
  };

  const toggleStatus = async (tip) => {
    const newStatus = tip.isActive == 1 ? 0 : 1;
    // Optimistic local update
    setTips(prev => prev.map(t => t.id === tip.id ? { ...t, isActive: newStatus } : t));

    try {
      const res = await tipsService.updateTip({ ...tip, isActive: newStatus });
      if (!res || !res.success) {
        // Revert on failure
        loadTips();
      }
    } catch (err) {
      console.error(err);
      loadTips();
    }
  };

  const filteredTips = useMemo(() => {
    return tips.filter(t => {
      const matchesSearch = !search || 
        (t.title && t.title.toLowerCase().includes(search.toLowerCase())) || 
        (t.message && t.message.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [tips, search, selectedCategory]);

  const stats = useMemo(() => {
    const total = tips.length;
    const published = tips.filter(t => t.isActive == 1).length;
    const drafts = tips.filter(t => t.isActive == 0).length;
    const reads = tips.reduce((acc, t) => acc + (parseInt(t.viewsCount, 10) || 0), 0);
    return { total, published, drafts, reads };
  }, [tips]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />

      {/* Fixed SaaS Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Manage Tips</Text>
            <Text style={styles.screenSubtitle}>Energy CMS for Tenants</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleOpenAdd} 
          style={styles.createBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create tip"
        >
          <Ionicons name="add" size={17} color="#042F2E" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* KPI Summary Overview Strip */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statLabel}>PUBLISHED</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.published}</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statLabel}>DRAFTS</Text>
            <Text style={[styles.statValue, { color: '#94A3B8' }]}>{stats.drafts}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>READS</Text>
            <Text style={[styles.statValue, { color: '#38BDF8' }]}>{stats.reads}</Text>
          </View>
        </View>

        {/* Search & Category Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search tips, appliances, or advice..." 
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.catScroll}
          >
            <TouchableOpacity 
              onPress={() => setSelectedCategory('All')}
              style={[styles.catBtn, selectedCategory === 'All' && styles.catBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.catText, selectedCategory === 'All' && styles.catTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.catBtn, isActive && styles.catBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catText, isActive && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tips List */}
        {loading && (!tips || tips.length === 0) ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#10B981" size="small" />
            <Text style={styles.loaderText}>Syncing energy CMS tips...</Text>
          </View>
        ) : filteredTips.length > 0 ? (
          filteredTips.map((tip, idx) => {
            const meta = getCategoryMeta(tip.category);
            const tipNum = tip.id ? String(tip.id).padStart(2, '0') : String(idx + 1).padStart(2, '0');
            const isPublished = tip.isActive == 1;

            return (
              <View 
                key={tip.id || idx} 
                style={[styles.tipCard, !isPublished && styles.inactiveCard]}
              >
                {/* Top Row: Category Badge + Savings & Status Toggle */}
                <View style={styles.cardTopRow}>
                  <View style={styles.categoryAndSavings}>
                    <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={styles.savingsText}>
                      {tip.savings || meta.savings}
                    </Text>
                  </View>

                  <View style={styles.statusWrap}>
                    <Text style={[styles.statusText, isPublished ? styles.statusPublished : styles.statusDraft]}>
                      {isPublished ? 'Published' : 'Draft'}
                    </Text>
                    <Switch
                      value={isPublished}
                      onValueChange={() => toggleStatus(tip)}
                      trackColor={{ false: '#1E293B', true: '#10B981' }}
                      thumbColor={isPublished ? '#FFFFFF' : '#94A3B8'}
                      style={{ 
                        transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }],
                        marginVertical: -6,
                        marginRight: -4,
                      }}
                    />
                  </View>
                </View>

                {/* Middle: Tip Title & Message */}
                <Text style={styles.tipTitle} numberOfLines={2}>
                  {tip.title}
                </Text>
                <Text style={styles.tipMessage} numberOfLines={3}>
                  {tip.message}
                </Text>

                {/* Bottom Row: Tip ID, Engagements, Edit/Delete Action Icons */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.metaLeft}>
                    <Text style={styles.tipIdText}>
                      ID: TIP-{tipNum}
                    </Text>
                    <View style={styles.engagementWrap}>
                      <View style={styles.engItem}>
                        <Ionicons name="heart" size={12} color="#EF4444" />
                        <Text style={styles.engText}>{tip.likesCount || 0}</Text>
                      </View>
                      <View style={styles.engItem}>
                        <Ionicons name="eye" size={13} color="#38BDF8" />
                        <Text style={styles.engText}>{tip.viewsCount || 0}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionsWrap}>
                    <TouchableOpacity 
                      onPress={() => handleOpenEdit(tip)} 
                      style={styles.iconActionBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Edit tip"
                    >
                      <Ionicons name="create-outline" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDelete(tip.id)} 
                      style={[styles.iconActionBtn, styles.deleteActionBtn]}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Delete tip"
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bulb-outline" size={28} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>
              {search || selectedCategory !== 'All' ? 'No matching tips' : 'No tips published yet'}
            </Text>
            <Text style={styles.emptyDesc}>
              {search || selectedCategory !== 'All' 
                ? 'Try refining your search keyword or clearing the category filter.' 
                : 'Create energy conservation tips to guide your tenants on reducing monthly bills.'}
            </Text>
            {(search || selectedCategory !== 'All') ? (
              <TouchableOpacity 
                style={styles.emptyActionBtn}
                onPress={() => { setSearch(''); setSelectedCategory('All'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={15} color="#042F2E" />
                <Text style={styles.emptyActionBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.emptyActionBtn}
                onPress={handleOpenAdd}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#042F2E" />
                <Text style={styles.emptyActionBtnText}>Create First Tip</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Centered Modal */}
      <BaseModal visible={modalVisible} onClose={() => setModalVisible(false)} centered={true}>
        <ModalHeader 
          title={isEditing ? "Edit Electricity Tip" : "Create Electricity Tip"} 
          icon={isEditing ? "create-outline" : "sparkles-outline"} 
          onClose={() => setModalVisible(false)} 
        />
        <ModalBody scrollable={true}>
          <View style={styles.modalForm}>
            {/* Title */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>TIP TITLE</Text>
              <TextInput 
                style={styles.modalInput} 
                value={formData.title} 
                onChangeText={t => setFormData(prev => ({ ...prev, title: t }))}
                placeholder="e.g. Optimize AC Temperature"
                placeholderTextColor="#64748B"
              />
            </View>
            
            {/* Category Selection */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>CATEGORY</Text>
              <View style={styles.modalCategoryWrap}>
                {CATEGORIES.map(cat => {
                  const isSelected = formData.category === cat;
                  return (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.modalCategoryChip, isSelected && styles.modalCategoryChipActive]}
                      onPress={() => {
                        const meta = getCategoryMeta(cat);
                        setFormData(prev => ({ 
                          ...prev, 
                          category: cat,
                          icon: prev.icon || meta.icon,
                        }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalCategoryChipText, isSelected && styles.modalCategoryChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Icon Preview & Selection */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>ICON PREVIEW & SELECTION</Text>
              <View style={styles.iconPreviewRow}>
                <View style={styles.iconPreviewBox}>
                  <Ionicons name={formData.icon || 'bulb-outline'} size={20} color="#10B981" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetIconsScroll}>
                  {PRESET_ICONS.map(ico => (
                    <TouchableOpacity
                      key={ico}
                      style={[styles.presetIconBtn, formData.icon === ico && styles.presetIconBtnActive]}
                      onPress={() => setFormData(prev => ({ ...prev, icon: ico }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={ico} 
                        size={17} 
                        color={formData.icon === ico ? '#10B981' : '#64748B'} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Publish Immediately Switch */}
            <View style={styles.statusSettingRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.statusSettingTitle}>Publish Immediately</Text>
                <Text style={styles.statusSettingDesc}>Active tips appear in tenant recommendations</Text>
              </View>
              <Switch
                value={formData.isActive == 1}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isActive: val ? 1 : 0 }))}
                trackColor={{ false: '#1E293B', true: '#10B981' }}
                thumbColor={formData.isActive == 1 ? '#FFFFFF' : '#94A3B8'}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>

            {/* Tip Message / Advice */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>TIP MESSAGE / ADVICE</Text>
              <TextInput 
                style={[styles.modalInput, styles.modalTextArea]} 
                value={formData.message} 
                onChangeText={t => setFormData(prev => ({ ...prev, message: t }))}
                placeholder="Write actionable advice for tenants on saving electricity..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ModalBody>

        <ModalFooter 
          primaryLabel={isSubmitting ? "Saving..." : (isEditing ? "Update Tip" : "Publish Tip")}
          onPrimaryPress={handleSave}
          primaryLoading={isSubmitting}
          secondaryLabel="Discard"
          onSecondaryPress={() => setModalVisible(false)}
        />
      </BaseModal>
    </SafeAreaView>
  );
}



