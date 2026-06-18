/**
 * Vantage ERP – ParentNavigator (Premium Design System)
 * Bottom tab navigation for parent role with Ionicons and premium styling.
 */
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, sizing } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';

import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ParentFeesScreen from '../screens/parent/ParentFeesScreen';
import ParentNoticesScreen from '../screens/parent/ParentNoticesScreen';
import ParentAttendanceScreen from '../screens/parent/ParentAttendanceScreen';
import ParentAcademicsScreen from '../screens/parent/ParentAcademicsScreen';

const Tab = createBottomTabNavigator();

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  label: string;
  iconFocused: TabIconName;
  iconDefault: TabIconName;
}

const tabs: TabConfig[] = [
  { name: 'ParentHome',       component: ParentHomeScreen,       label: 'Home',       iconFocused: 'home',           iconDefault: 'home-outline' },
  { name: 'ParentAttendance', component: ParentAttendanceScreen, label: 'Attendance', iconFocused: 'calendar',       iconDefault: 'calendar-outline' },
  { name: 'ParentAcademics',  component: ParentAcademicsScreen,  label: 'Academics',  iconFocused: 'school',         iconDefault: 'school-outline' },
  { name: 'ParentFees',       component: ParentFeesScreen,       label: 'Fees',       iconFocused: 'wallet',         iconDefault: 'wallet-outline' },
  { name: 'ParentNotices',    component: ParentNoticesScreen,    label: 'Notices',    iconFocused: 'megaphone',      iconDefault: 'megaphone-outline' },
];

export const ParentNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopWidth: 0,
        height: sizing.tabBarHeight,
        paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
        paddingTop: spacing.sm,
        ...shadows.md,
      },
      tabBarActiveTintColor: colors.parent,
      tabBarInactiveTintColor: colors.mutedText,
      tabBarLabelStyle: {
        ...typography.tabLabel,
        marginTop: spacing.xxs,
      },
    }}
  >
    {tabs.map((tab) => (
      <Tab.Screen
        key={tab.name}
        name={tab.name}
        component={tab.component}
        options={{
          tabBarLabel: tab.label,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? tab.iconFocused : tab.iconDefault}
              size={22}
              color={color}
            />
          ),
        }}
      />
    ))}
  </Tab.Navigator>
);

export default ParentNavigator;
