# Component Notes: Mobile Notification UI Components

This document outlines the detailed configuration and design of the shared mobile components implemented in Phase 4.1C.

## 1. NotificationBell (`mobile/src/components/notifications/NotificationBell.tsx`)
- **Visual Presentation**:
  - Displays a clean outline icon (`notifications-outline` from Ionicons) scaled to `24` in white.
  - Positioned in the header bar of the `DashboardHero` next to the `StatusBadge`.
  - Integrates an absolute-positioned badge with a red (`colors.danger`) circular background.
  - Conditionally renders when unread count is greater than 0.
  - Badge text is restricted to `"99+"` for large values to maintain a compact design.
- **Dynamic Refresh**:
  - Leverages React Navigation's `useIsFocused` hook.
  - Automatically queries `getUnreadCount` from the database every time the student/teacher/parent home dashboard returns to active focus.
- **Accessibility**:
  - Uses `TouchableOpacity` with explicit `accessibilityRole="button"` and `accessibilityLabel="Notifications"` to ensure compliance with screen readers.

## 2. NotificationCard (`mobile/src/components/notifications/NotificationCard.tsx`)
- **Core Layout**:
  - A card container using `colors.surface` background, standard `radii.md` rounded corners, and a light shadow `shadows.sm`.
  - Left-hand side: Features an app icon inside a circular container with an ultra-light version of the icon color (10% opacity) as the background.
  - Center: Message container displaying the bold `title`, body `message`, and relative Indian-Standard time `createdAt`.
  - Right-hand side: Optional `URGENT` red badge for `HIGH` or `URGENT` priority levels.
- **Type-Aware Icons**:
  - `HOMEWORK_POSTED` → Book icon in `colors.info` (blue).
  - `EXAM_POSTED` → Calendar icon in `colors.warningDark` (gold).
  - `MARKS_POSTED` → Ribbon icon in `colors.success` (green).
  - `NOTICE_POSTED` → Megaphone icon in `colors.primary` (indigo).
  - `FEES_OVERDUE` / `FEES_REMINDER` → Wallet icon in `colors.danger` (red).
  - `ATTENDANCE_ABSENCE_ALERT` → Alert icon in `colors.danger` (red).
- **Interactive State**:
  - Unread cards render with a 1px border colored with the active role's theme color (30% opacity) and show a colored circular status dot on the left.
  - Read cards are rendered with `opacity: 0.75` and have no border or status dot, indicating an inactive/read state.
  - Pressing an unread card invokes the `onPress` callback, which updates the local state immediately (optimistic UI) and contacts the backend to persist the read status.

## 3. NotificationEmptyState (`mobile/src/components/notifications/NotificationEmptyState.tsx`)
- **Visual Presentation**:
  - Wraps the existing premium `EmptyState` component.
  - Utilizes the `notifications-off-outline` Ionicons glyph contained inside an accent circle matching the active role's color theme.
  - Title: "All Caught Up!"
  - Subtitle: "You have no notifications at this time."
