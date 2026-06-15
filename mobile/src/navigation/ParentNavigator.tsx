import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../constants/colors';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ParentFeesScreen from '../screens/parent/ParentFeesScreen';
import ParentNoticesScreen from '../screens/parent/ParentNoticesScreen';
import ParentAttendanceScreen from '../screens/parent/ParentAttendanceScreen';

const Tab = createBottomTabNavigator();

const tabBarIcon = (emoji: string, focused: boolean) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export const ParentNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 6,
        height: 64,
      },
      tabBarActiveTintColor: colors.parent,
      tabBarInactiveTintColor: colors.mutedText,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    }}
  >
    <Tab.Screen
      name="ParentHome"
      component={ParentHomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused }) => tabBarIcon('🏠', focused),
      }}
    />
    <Tab.Screen
      name="ParentAttendance"
      component={ParentAttendanceScreen}
      options={{
        tabBarLabel: 'Attendance',
        tabBarIcon: ({ focused }) => tabBarIcon('📅', focused),
      }}
    />
    <Tab.Screen
      name="ParentFees"
      component={ParentFeesScreen}
      options={{
        tabBarLabel: 'Fees',
        tabBarIcon: ({ focused }) => tabBarIcon('₹', focused),
      }}
    />
    <Tab.Screen
      name="ParentNotices"
      component={ParentNoticesScreen}
      options={{
        tabBarLabel: 'Notices',
        tabBarIcon: ({ focused }) => tabBarIcon('📢', focused),
      }}
    />
  </Tab.Navigator>
);

export default ParentNavigator;
