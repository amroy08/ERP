/**
 * Vantage ERP – StudentNavigator (Premium Design System)
 * Bottom tab navigation for student role with Ionicons and premium styling.
 */
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, sizing } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';

import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentTimetableScreen from '../screens/student/StudentTimetableScreen';
import StudentHomeworkScreen from '../screens/student/StudentHomeworkScreen';
import StudentExamsScreen from '../screens/student/StudentExamsScreen';

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
  { name: 'StudentHome',      component: StudentHomeScreen,      label: 'Home',      iconFocused: 'home',          iconDefault: 'home-outline' },
  { name: 'StudentTimetable', component: StudentTimetableScreen, label: 'Timetable', iconFocused: 'calendar',      iconDefault: 'calendar-outline' },
  { name: 'StudentHomework',  component: StudentHomeworkScreen,  label: 'Homework',  iconFocused: 'book',          iconDefault: 'book-outline' },
  { name: 'StudentExams',     component: StudentExamsScreen,     label: 'Exams',     iconFocused: 'document-text', iconDefault: 'document-text-outline' },
];

export const StudentNavigator: React.FC = () => (
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
      tabBarActiveTintColor: colors.student,
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

export default StudentNavigator;
