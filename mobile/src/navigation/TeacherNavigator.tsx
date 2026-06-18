/**
 * Vantage ERP – TeacherNavigator (Premium Design System)
 * Bottom tab navigation for teacher role with Ionicons and premium styling.
 */
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, sizing, radii } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';

import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import TeacherTimetableScreen from '../screens/teacher/TeacherTimetableScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';
import TeacherHomeworkScreen from '../screens/teacher/TeacherHomeworkScreen';
import TeacherMarksScreen from '../screens/teacher/TeacherMarksScreen';
import TeacherNoticesScreen from '../screens/teacher/TeacherNoticesScreen';

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
  { name: 'TeacherHome',       component: TeacherHomeScreen,       label: 'Home',       iconFocused: 'home',           iconDefault: 'home-outline' },
  { name: 'TeacherTimetable',  component: TeacherTimetableScreen,  label: 'Timetable',  iconFocused: 'calendar',       iconDefault: 'calendar-outline' },
  { name: 'TeacherAttendance', component: TeacherAttendanceScreen, label: 'Attendance', iconFocused: 'checkmark-circle', iconDefault: 'checkmark-circle-outline' },
  { name: 'TeacherHomework',   component: TeacherHomeworkScreen,   label: 'Homework',   iconFocused: 'book',           iconDefault: 'book-outline' },
  { name: 'TeacherMarks',      component: TeacherMarksScreen,      label: 'Marks',      iconFocused: 'document-text',  iconDefault: 'document-text-outline' },
  { name: 'TeacherNotices',    component: TeacherNoticesScreen,    label: 'Notices',    iconFocused: 'megaphone',      iconDefault: 'megaphone-outline' },
];

export const TeacherNavigator: React.FC = () => (
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
      tabBarActiveTintColor: colors.teacher,
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

export default TeacherNavigator;
