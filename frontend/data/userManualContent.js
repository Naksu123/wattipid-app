/**
 * Wattipid User Manual Content
 * Role-based content data for the in-app User Manual.
 * Separated from UI for maintainability.
 */

// ─── TENANT MANUAL SECTIONS ───────────────────────────────────────────────────
export const TENANT_MANUAL = [
  {
    id: 't1',
    title: 'Getting Started',
    icon: 'rocket-outline',
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    steps: [
      {
        heading: 'Logging In',
        content: 'Open the Wattipid app and enter the email address and password you registered with. Tap "Sign In" to access your Dashboard.',
      },
      {
        heading: 'Registering an Account',
        content: 'To create your account, you need an Access Code provided by your Landlord. On the login screen, tap "Register" and enter your name, email, password, and the Access Code.',
      },
      {
        heading: 'Using the Access Code',
        content: 'Your Landlord will provide you with an Access Code (usually via email or SMS). This code links your account to your assigned room and its electricity submeter.',
      },
      {
        heading: 'Access Code Expired?',
        content: 'Access codes have a limited validity period. If yours has expired, contact your Landlord directly to request a new one. They can generate a fresh code from their Landlord Dashboard.',
      },
    ],
  },
  {
    id: 't2',
    title: 'Dashboard',
    icon: 'speedometer-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    steps: [
      {
        heading: 'Live Bill',
        content: 'Displays your estimated bill so far for the current billing cycle, based on your real-time electricity consumption and the configured rate per kWh.',
      },
      {
        heading: 'Energy Today',
        content: 'Shows how many kilowatt-hours (kWh) your room has consumed today. This resets at midnight each day.',
      },
      {
        heading: 'Consumption Total',
        content: 'Your total accumulated electricity consumption for the current billing cycle.',
      },
      {
        heading: 'Daily Budget',
        content: 'If you have set a budget, this shows your daily spending allowance and how much you have used today.',
      },
      {
        heading: 'Real-Time Updates',
        content: 'The dashboard refreshes automatically. A green "Live" indicator means data is flowing from your room\'s IoT submeter in real time.',
      },
    ],
  },
  {
    id: 't3',
    title: 'Analytics',
    icon: 'bar-chart-outline',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.12)',
    steps: [
      {
        heading: 'Viewing Consumption',
        content: 'The Analytics screen shows your electricity consumption history in interactive charts. Switch between Day, Week, Month, and Year views using the tabs at the top.',
      },
      {
        heading: 'Day View',
        content: 'Shows an hourly breakdown of your consumption for the selected date. Useful for spotting peak-usage hours.',
      },
      {
        heading: 'Week View',
        content: 'Displays daily consumption totals across a 7-day period. Compare your usage day by day.',
      },
      {
        heading: 'Month View',
        content: 'Shows daily consumption totals for the entire month. Helps you spot trends and unusual spikes.',
      },
      {
        heading: 'Year View',
        content: 'Aggregates your consumption by month for a full-year overview.',
      },
      {
        heading: 'Period Summary',
        content: 'Below the chart, the Period Summary shows: Total Consumption (kWh), Total Cost (₱), and Daily Average for the selected time range.',
      },
      {
        heading: 'Understanding Trends',
        content: 'Look for patterns in your usage. Consistently high bars may indicate opportunities to reduce consumption during those periods.',
      },
    ],
  },
  {
    id: 't4',
    title: 'Tips',
    icon: 'bulb-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    steps: [
      {
        heading: 'Wattipid Tips',
        content: 'The Tips section provides energy-saving suggestions curated by your Landlord and the Wattipid system.',
      },
      {
        heading: 'How Tips Are Generated',
        content: 'Tips are based on general electricity consumption best practices. They provide guidance on common habits that can help reduce electricity usage.',
      },
      {
        heading: 'Using Tips',
        content: 'Browse tips by category, like and save helpful ones, and apply the advice to your daily routine to help manage your electricity consumption.',
      },
    ],
  },
  {
    id: 't5',
    title: 'Budget Management',
    icon: 'wallet-outline',
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    steps: [
      {
        heading: 'Setting a Budget',
        content: 'Open the Budget tab and enter your desired monthly budget in pesos (₱). The system will automatically calculate your daily and weekly allowances based on the days remaining in the billing cycle.',
      },
      {
        heading: 'Updating Your Budget',
        content: 'You can update your budget at any time. Tap the edit button, enter a new amount, and confirm. Your allowances will recalculate automatically.',
      },
      {
        heading: 'Budget Rollover',
        content: 'Your budget automatically carries over to the next month. You do not need to set it again each month unless you want to change the amount.',
      },
      {
        heading: 'Budget Status Levels',
        content: '• Normal — You are within budget.\n• Approaching Limit — You have used 70–80% of your allowance.\n• Warning — You have used 80–100% of your allowance.\n• Budget Exhausted — You have reached 100% of your allowance.\n• Budget Exceeded — You have gone over your set budget.',
      },
      {
        heading: 'Budget Notifications',
        content: 'When your consumption approaches or exceeds your budget, the app sends alert notifications to help you take action before overspending.',
      },
    ],
  },
  {
    id: 't6',
    title: 'Payment',
    icon: 'card-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    steps: [
      {
        heading: 'Viewing Your Bill',
        content: 'Open the Payment screen from the Billing tab. You will see your current amount due, billing cycle dates, and payment status.',
      },
      {
        heading: 'Payment Methods',
        content: 'Your Landlord may accept one or more of the following:\n• Cash — Pay directly to your Landlord.\n• GCash — Scan the QR code or send to the displayed number.\n• Maya — Scan the QR code or send to the displayed number.',
      },
      {
        heading: 'Uploading Proof of Payment',
        content: 'After paying via GCash or Maya, take a screenshot of your transaction. Tap "Upload Proof" on the Payment screen and select the image from your gallery.',
      },
      {
        heading: 'Payment Verification',
        content: 'After uploading, your payment status changes to "Pending Verification." Your Landlord will review the proof and confirm or reject it from their dashboard.',
      },
      {
        heading: 'Payment History',
        content: 'View all your past payments and their statuses in the Billing History section.',
      },
    ],
  },
  {
    id: 't7',
    title: 'Billing',
    icon: 'receipt-outline',
    iconColor: '#EC4899',
    iconBg: 'rgba(236,72,153,0.12)',
    steps: [
      {
        heading: 'Electricity Consumption Charge',
        content: 'This is the base charge calculated from your total kWh consumption multiplied by the rate per kWh set by your Landlord.',
      },
      {
        heading: 'Additional Charges',
        content: 'Your final bill may include additional charges beyond the basic consumption charge. These may include:\n• Generation Charge\n• System Loss Charge\n• Transmission Charge\n• Distribution Charge\n• Taxes\n• Miscellaneous Fees',
      },
      {
        heading: 'Penalties',
        content: 'If your payment is overdue beyond the grace period, a penalty fee may be applied. The penalty rate and grace period are configured by your Landlord.',
      },
      {
        heading: 'Total Amount Due',
        content: 'The total on your bill is the sum of all applicable charges. Always review your bill details to understand the breakdown.',
      },
    ],
  },
  {
    id: 't8',
    title: 'Notifications',
    icon: 'notifications-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    steps: [
      {
        heading: 'Types of Notifications',
        content: '• Budget Alerts — When you approach or exceed your budget.\n• Due Date Reminders — Before your payment is due.\n• Overdue Notices — When a payment passes its due date.\n• Payment Updates — When your payment is verified or rejected.\n• Consumption Alerts — Unusual consumption patterns.',
      },
      {
        heading: 'Managing Notifications',
        content: 'Go to Settings → Notifications to enable or disable specific alert categories. You can toggle Usage Alerts and Billing Reminders independently.',
      },
    ],
  },
  {
    id: 't9',
    title: 'Settings',
    icon: 'settings-outline',
    iconColor: '#6B7280',
    iconBg: 'rgba(107,114,128,0.12)',
    steps: [
      {
        heading: 'Account Information',
        content: 'View your name, email, room assignment, and move-in date. Tap "Edit Profile" to update your name or email.',
      },
      {
        heading: 'Notification Preferences',
        content: 'Toggle push notifications, usage alerts, and billing reminders on or off.',
      },
      {
        heading: 'Support',
        content: 'Access the User Manual, Help & Support contact information, Terms and Conditions, and About Wattipid.',
      },
      {
        heading: 'Data Management',
        content: 'You can clear your local consumption history if needed. This does not affect your server-side billing data.',
      },
    ],
  },
  {
    id: 't10',
    title: 'Troubleshooting',
    icon: 'help-buoy-outline',
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.12)',
    steps: [
      {
        heading: 'App is loading slowly',
        content: 'Check your internet connection. Try switching between Wi-Fi and mobile data. Close and reopen the app.',
      },
      {
        heading: 'Data is not updating',
        content: 'Pull down on the screen to refresh. If the issue persists, check if your internet connection is stable.',
      },
      {
        heading: 'Live Bill is not updating',
        content: 'The Live Bill depends on real-time data from the IoT submeter. If the device is offline or the internet is down, the reading will pause until reconnected.',
      },
      {
        heading: 'Analytics is taking too long to load',
        content: 'Large data ranges (especially Year view) may take longer to load on slow connections. Try switching to a shorter period first, then navigate back.',
      },
      {
        heading: 'Payment screen is loading slowly',
        content: 'The Payment screen fetches your billing information and Landlord payment details. Ensure your internet connection is stable.',
      },
      {
        heading: '"Set a Budget" keeps appearing',
        content: 'If you have already set a budget but still see this message, try pulling down to refresh the Budget screen. Your budget automatically rolls over each month.',
      },
      {
        heading: 'Access code expired',
        content: 'Contact your Landlord to request a new access code. They can generate one from their dashboard at any time.',
      },
      {
        heading: 'Cannot log in',
        content: 'Double-check your email and password. If you forgot your password, use the "Forgot Password" option on the login screen.',
      },
      {
        heading: 'Cannot upload proof of payment',
        content: 'Make sure you have granted the app permission to access your photo library. Check that the image file is not corrupted. Try taking a fresh screenshot.',
      },
    ],
  },
];


// ─── LANDLORD MANUAL SECTIONS ─────────────────────────────────────────────────
export const LANDLORD_MANUAL = [
  {
    id: 'l1',
    title: 'Getting Started',
    icon: 'rocket-outline',
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    steps: [
      {
        heading: 'Logging In',
        content: 'Open the Wattipid app and sign in with your Landlord administrator credentials.',
      },
      {
        heading: 'Dashboard Navigation',
        content: 'After logging in, you will land on the Overview screen. Use the bottom tab bar to navigate between Overview, Rooms, Payments, Penalties, and Settings.',
      },
      {
        heading: 'Account Settings',
        content: 'Go to Settings → Edit Account Details to update your name, email, or password.',
      },
    ],
  },
  {
    id: 'l2',
    title: 'Overview',
    icon: 'grid-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    steps: [
      {
        heading: 'Dashboard Cards',
        content: 'The Overview shows key metrics at a glance:\n• Total Tenants — Number of active tenants.\n• Total Rooms — All registered rooms.\n• Available Rooms — Rooms not currently assigned.\n• Occupied Rooms — Rooms with active tenants.',
      },
      {
        heading: 'Revenue Summary',
        content: '• Monthly Revenue — Total confirmed payments for the current month.\n• Pending Payments — Payments awaiting verification.\n• Overdue Payments — Payments past their due date.',
      },
      {
        heading: 'Real-Time Updates',
        content: 'The Overview refreshes automatically. Pull down to manually refresh at any time.',
      },
    ],
  },
  {
    id: 'l3',
    title: 'Room Management',
    icon: 'bed-outline',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.12)',
    steps: [
      {
        heading: 'Adding a Room',
        content: 'Go to the Rooms tab and tap "Add Room." Enter the Room ID. The system will automatically generate a device secret for the IoT submeter.',
      },
      {
        heading: 'Room Availability',
        content: 'Each room shows its status as "Available" or "Occupied." Available rooms can be assigned to new tenants.',
      },
      {
        heading: 'Assigning Tenants',
        content: 'Select a room and use the invitation system to send an access code to a new tenant via email. The tenant will use this code when registering their account.',
      },
      {
        heading: 'Removing a Room',
        content: 'You can remove a room that has no active tenant. All historical data for the room is preserved in the system.',
      },
    ],
  },
  {
    id: 'l4',
    title: 'Tenant Management',
    icon: 'people-outline',
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    steps: [
      {
        heading: 'Inviting a Tenant',
        content: 'From the Rooms tab, select an available room and tap "Invite Tenant." Enter the tenant\'s email address to send them an access code.',
      },
      {
        heading: 'Access Code',
        content: 'The system generates a unique access code for each invitation. Share this code with the tenant so they can register their account.',
      },
      {
        heading: 'Access Code Expiration',
        content: 'Access codes expire after a set period for security. If a tenant\'s code expires before they register, you can generate a new one from the room details.',
      },
      {
        heading: 'Managing Tenants',
        content: 'View each tenant\'s consumption, payment status, and account details from their room profile.',
      },
    ],
  },
  {
    id: 'l5',
    title: 'Electricity Consumption',
    icon: 'flash-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    steps: [
      {
        heading: 'Viewing Tenant Consumption',
        content: 'From the Rooms tab, select any room to view its real-time and historical electricity consumption data.',
      },
      {
        heading: 'Understanding kWh',
        content: 'Kilowatt-hours (kWh) is the unit of energy consumption. 1 kWh = using a 1,000-watt appliance for 1 hour. The system tracks total room consumption.',
      },
      {
        heading: 'Consumption Monitoring',
        content: 'Wattipid monitors the overall electricity consumption of each room. The system tracks total power draw from the room\'s dedicated circuit.',
      },
      {
        heading: 'Consumption Trends',
        content: 'Use the analytics views to identify rooms with unusually high consumption. This can help with energy management and early detection of issues.',
      },
    ],
  },
  {
    id: 'l6',
    title: 'Billing',
    icon: 'receipt-outline',
    iconColor: '#EC4899',
    iconBg: 'rgba(236,72,153,0.12)',
    steps: [
      {
        heading: 'Billing Rate',
        content: 'Set the global electricity billing rate (₱/kWh) from Settings → Electricity Billing Rate. This rate is used to calculate all tenant bills.',
      },
      {
        heading: 'Billing Breakdown',
        content: 'Each tenant\'s bill includes:\n• Electricity consumption charges (kWh × rate)\n• Additional applicable charges (generation, system loss, transmission, distribution, taxes)\n• Penalties, if applicable.',
      },
      {
        heading: 'Bill Generation',
        content: 'Bills are automatically generated based on each tenant\'s billing cycle. The cycle is determined by their move-in date.',
      },
      {
        heading: 'Total Amount Due',
        content: 'The total includes all charges. Review each tenant\'s bill from their room details or the Payments tab.',
      },
    ],
  },
  {
    id: 'l7',
    title: 'Payments',
    icon: 'card-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    steps: [
      {
        heading: 'Pending Payments',
        content: 'The Payments tab shows all payments awaiting your review. Tenants upload proof of payment, which appears here for verification.',
      },
      {
        heading: 'Verifying Payments',
        content: 'Tap on a pending payment to view the submitted proof (screenshot). You can approve or reject the payment based on the evidence.',
      },
      {
        heading: 'Payment Status',
        content: '• Unpaid — No payment submitted.\n• Pending Verification — Tenant uploaded proof; awaiting your review.\n• Paid — Payment confirmed.\n• Rejected — Proof was insufficient; tenant must resubmit.\n• Overdue — Payment is past the due date.',
      },
      {
        heading: 'Payment History',
        content: 'View the complete payment history for all tenants from the Payments tab. Filter by status to quickly find what you need.',
      },
    ],
  },
  {
    id: 'l8',
    title: 'Penalties',
    icon: 'warning-outline',
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.12)',
    steps: [
      {
        heading: 'Penalty Configuration',
        content: 'Go to Settings → Penalty Configuration to set the grace period (days after the due date) and the penalty rate (percentage added to overdue bills).',
      },
      {
        heading: 'Viewing Overdue Payments',
        content: 'The Penalties tab lists all overdue payments with the calculated penalty amount for each.',
      },
      {
        heading: 'Understanding Penalties',
        content: 'Penalties are applied automatically after the grace period expires. The penalty amount = outstanding bill × penalty rate.',
      },
      {
        heading: 'Monitoring Penalty Status',
        content: 'Track which tenants have outstanding penalties and their payment progress from the Penalties tab.',
      },
    ],
  },
  {
    id: 'l9',
    title: 'Reports & Analytics',
    icon: 'bar-chart-outline',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.12)',
    steps: [
      {
        heading: 'Consumption Reports',
        content: 'View detailed electricity consumption data for each room across different time periods.',
      },
      {
        heading: 'Daily / Weekly / Monthly Analytics',
        content: 'Switch between time periods to analyze consumption patterns. Identify rooms with consistently high usage.',
      },
      {
        heading: 'Understanding Trends',
        content: 'Use the analytics to make informed decisions about energy management, billing adjustments, or tenant communications.',
      },
    ],
  },
  {
    id: 'l10',
    title: 'Notifications',
    icon: 'notifications-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    steps: [
      {
        heading: 'Types of Notifications',
        content: '• Payment Notifications — When a tenant submits proof of payment.\n• Due Date Reminders — Before bills are due.\n• Overdue Notices — When payments pass their due date.\n• Tenant Activity — New registrations and account events.',
      },
      {
        heading: 'Managing Notifications',
        content: 'Configure which types of notifications you receive from Settings → Notification Alerts.',
      },
    ],
  },
];
