import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Platform, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '@/styles/theme';
import { router } from 'expo-router';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MANUAL_CONTENT = [
  {
    id: '1',
    title: '1. SYSTEM OVERVIEW',
    icon: 'cloud-outline',
    content: `The Wattipid Smart Electricity Monitoring System is a highly scalable, fully Cloud-Based IoT solution. \n\nARCHITECTURE:\n• Edge Device: ESP32 Microcontroller handles sensor data acquisition.\n• Sensors: SCT-013 (Current) and ZMPT101B (Voltage).\n• Connectivity: Pure Cloud Communication via the building's 2.4GHz Wi-Fi. (NO Local Area Network / LAN restrictions).\n• Control Mechanism: System acts as a passive monitor. (NO physical Relay Module is used to cut power).\n• Access: Landlords and Tenants can access the platform globally via Mobile Data or Wi-Fi.`
  },
  {
    id: '2',
    title: '2. REQUIRED HARDWARE',
    icon: 'hardware-chip-outline',
    content: `To build one (1) Wattipid Submeter node, you need the following components:\n\n• 1x ESP32 Development Board (30-pin or 38-pin)\n• 1x SCT-013 Non-Invasive AC Current Transformer (100A/50mA)\n• 1x ZMPT101B AC Voltage Sensor Module (250V AC)\n• 1x 5V DC Power Adapter (Min. 1A) to power the ESP32\n• Terminal Blocks (For secure AC line tapping)\n• Female-to-Female & Male-to-Female Jumper Wires\n• 1x Prototype Board / Custom PCB\n• 1x Fire-Retardant Protective Enclosure (Plastic/ABS)`
  },
  {
    id: '3',
    title: '3. SAFETY PRECAUTIONS',
    icon: 'warning-outline',
    content: `⚠ DANGER: LETHAL VOLTAGE (220V AC) ⚠\n\n• MAINS ISOLATION: Absolutely ensure the main circuit breaker is TURNED OFF before installing the voltage sensor.\n• NO EXPOSED WIRES: All AC lines must be securely fastened inside terminal blocks. Do not leave exposed copper.\n• NON-INVASIVE CURRENT: The SCT-013 sensor must be clamped onto the LIVE (Line) wire ONLY. Do not clamp around both Line and Neutral, as the magnetic fields will cancel out.\n• PROPER ENCLOSURE: Ensure the ESP32 and sensors are enclosed in a non-conductive plastic case to prevent accidental shocks.\n• QUALIFIED PERSONNEL: If you are not familiar with AC wiring, hire a licensed electrician to install the terminal blocks.`
  },
  {
    id: '4',
    title: '4. HARDWARE INSTALLATION',
    icon: 'build-outline',
    content: `1. Enclosure Mounting: Mount the ABS enclosure securely near the tenant's breaker box.\n2. PCB Placement: Secure the ESP32 and ZMPT101B onto the prototype board inside the enclosure.\n3. AC Tapping (Voltage): Tap the AC Line and Neutral from the breaker output into the ZMPT101B AC input terminals.\n4. CT Clamping (Current): Clamp the SCT-013 sensor strictly around the output LIVE wire leading to the tenant's room.\n5. Power Supply: Plug the 5V DC Adapter into a nearby outlet and connect it to the ESP32 (VIN / 5V pin).`
  },
  {
    id: '5',
    title: '5. ESP32 WIRING GUIDE',
    icon: 'git-network-outline',
    content: `[ WIRING DIAGRAM PLACEHOLDER ]\n\nSCT-013 (Current Sensor):\n• Signal -> ESP32 Pin 34 (ADC1_CH6)\n• GND -> ESP32 GND\n• VCC -> ESP32 3.3V (Requires burden resistor & voltage divider circuit if using bare audio jack)\n\nZMPT101B (Voltage Sensor):\n• OUT -> ESP32 Pin 35 (ADC1_CH7)\n• GND -> ESP32 GND\n• VCC -> ESP32 5V (VIN)\n\nNote: Ensure grounds are common. Use ADC1 pins ONLY, as ADC2 conflicts with the ESP32 Wi-Fi module.`
  },
  {
    id: '6',
    title: '6. INTERNET CONFIGURATION',
    icon: 'wifi-outline',
    content: `The ESP32 requires a stable 2.4GHz Wi-Fi connection to transmit data to the cloud.\n\n1. Hardcode or use WiFiManager in the ESP32 firmware to connect to the building's router.\n2. The ESP32 does NOT need port forwarding or LAN setups.\n3. It will periodically make outbound HTTP POST requests to the Cloud Server.\n4. If Wi-Fi drops, the ESP32 will automatically attempt to reconnect every 10 seconds. (Data during offline periods cannot be retrieved).`
  },
  {
    id: '7',
    title: '7. CLOUD SYSTEM SETUP',
    icon: 'server-outline',
    content: `[ CLOUD ARCHITECTURE DIAGRAM PLACEHOLDER ]\n\n• Backend: PHP 8.x REST API\n• Database: MySQL (InnoDB)\n• Endpoints: The ESP32 sends JSON payloads containing voltage, current, and accumulated energy to \`/api.php?action=logConsumption\`.\n• Security: The ESP32 payload must include its unique \`device_secret\` header to authenticate the data.`
  },
  {
    id: '8',
    title: '8. DEVICE REGISTRATION',
    icon: 'qr-code-outline',
    content: `Before an ESP32 can sync data, it must be registered to a room.\n\n1. Log in to the Landlord Dashboard.\n2. Go to Rooms -> Add Room.\n3. Enter the Room ID.\n4. The system will automatically generate a highly secure \`device_secret\` hash.\n5. Copy this hash and hardcode it into the \`DEVICE_SECRET\` variable inside the ESP32 firmware code before flashing.`
  },
  {
    id: '9',
    title: '9. LANDLORD SETUP',
    icon: 'business-outline',
    content: `1. Assign Tenants: Go to the Rooms tab and assign a Tenant to a Room by providing their Email.\n2. Configure Rates: Go to Settings and set the global Electricity Billing Rate (₱/kWh).\n3. Notifications: Enable/Disable alerts for High Consumption or Budget limits.\n4. Billing: The system utilizes "Lazy Evaluation". Bills are automatically generated on exactly the same day every month based on the tenant's Move-In Date.`
  },
  {
    id: '10',
    title: '10. TENANT SETUP',
    icon: 'phone-portrait-outline',
    content: `1. Invitation: The tenant receives an email with an OTP to create an account.\n2. Dashboard: Tenants can view Real-time Power (W), Daily Usage (kWh), and Amount Due.\n3. Budgeting: Tenants can set a "Daily Allowance" in the Budget tab. The system will trigger warnings if they exceed 80% or 100% of this budget.\n4. Payments: Tenants can upload proof of payment directly through the Payment tab.`
  },
  {
    id: '11',
    title: '11. SYSTEM TESTING',
    icon: 'flask-outline',
    content: `To verify full system integration:\n\n1. Turn on a known load (e.g., a 100W incandescent bulb) in the room.\n2. Wait 5-10 seconds for the ESP32 to transmit.\n3. Check the Tenant App or Landlord Dashboard; the Real-Time Power gauge should reflect approximately 100W.\n4. Ensure the status indicator shows "Live" with a green dot.`
  },
  {
    id: '12',
    title: '12. TROUBLESHOOTING GUIDE',
    icon: 'help-buoy-outline',
    content: `ISSUE: Dashboard says "Offline".\nFIX: Check if the ESP32 is powered. Verify the router's 2.4GHz Wi-Fi is active. Ensure the \`DEVICE_SECRET\` matches exactly.\n\nISSUE: Power shows 0W while appliances are on.\nFIX: Ensure the SCT-013 is clamped around the LIVE wire ONLY. Clamping both Line and Neutral results in 0 readings.\n\nISSUE: Voltage shows erratic numbers (e.g. 400V).\nFIX: Adjust the tiny potentiometer on the ZMPT101B module to calibrate the wave amplitude.`
  },
  {
    id: '13',
    title: '13. MAINTENANCE PROCEDURES',
    icon: 'construct-outline',
    content: `• Quarterly Hardware Check: Visually inspect the ABS enclosure and terminal blocks for signs of heat stress or loose wires.\n• Sensor Calibration: If readings drift, use a commercial multimeter to measure actual voltage/current and adjust the \`calibration\` constants in the ESP32 code.\n• Database Archiving: The system automatically archives data, but ensure the Cloud Server has sufficient storage capacity.`
  },
  {
    id: '14',
    title: '14. SYSTEM INFORMATION',
    icon: 'information-circle-outline',
    content: `WATTIPID SMART ELECTRICITY MONITORING SYSTEM\nVersion: 2.1.0-prod\nArchitecture: Cloud-Native IoT\nFrontend: React Native (Expo)\nBackend: PHP 8, MySQL\nMicrocontroller Firmware: C++ (Arduino Core)\n\nDeveloped by the Wattipid Engineering Team.`
  }
];

export default function UserManualScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredContent = MANUAL_CONTENT.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Manual</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="download-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="print-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guides, wiring, or troubleshooting..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredContent.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
          </View>
        ) : (
          filteredContent.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.accordionContainer}>
                <TouchableOpacity 
                  style={[styles.accordionHeader, isExpanded && styles.accordionHeaderActive]} 
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.headerLeft}>
                    <View style={[styles.iconBox, isExpanded && { backgroundColor: COLORS.primary }]}>
                      <Ionicons name={item.icon} size={20} color={isExpanded ? '#fff' : COLORS.primary} />
                    </View>
                    <Text style={[styles.title, isExpanded && { color: COLORS.primary }]}>{item.title}</Text>
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.contentText}>{item.content}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  accordionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    ...SHADOWS.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionHeaderActive: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  accordionBody: {
    padding: 20,
    backgroundColor: '#0f172a',
  },
  contentText: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  footerSpacer: {
    height: 80,
  }
});
