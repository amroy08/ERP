# Icon Replacement Plan

We have successfully eliminated raw text emoji characters from the bottom navigation bar tabs and key UI elements, replacing them with standard vector icons.

## Emoji to Vector Mappings

### 1. Student Bottom Tabs
- Emojis Removed: `🏠` (Home), `📅` (Timetable), `📚` (Homework), `📝` (Exams).
- Vectors Integrated:
  - **Home**: `home` / `home-outline` (Ionicons)
  - **Timetable**: `calendar` / `calendar-outline` (Ionicons)
  - **Homework**: `book` / `book-outline` (Ionicons)
  - **Exams**: `document-text` / `document-text-outline` (Ionicons)

### 2. Parent Bottom Tabs
- Emojis Removed: `🏠` (Home), `📅` (Attendance), `📚` (Academics), `₹` (Fees), `📢` (Notices).
- Vectors Integrated:
  - **Home**: `home` / `home-outline` (Ionicons)
  - **Attendance**: `calendar` / `calendar-outline` (Ionicons)
  - **Academics**: `school` / `school-outline` (Ionicons)
  - **Fees**: `wallet` / `wallet-outline` (Ionicons)
  - **Notices**: `megaphone` / `megaphone-outline` (Ionicons)

### 3. Teacher Bottom Tabs
- Emojis Removed: `🏠` (Home), `🗓` (Timetable), `✅` (Attendance), `📚` (Homework), `📝` (Marks), `📢` (Notices).
- Vectors Integrated:
  - **Home**: `home` / `home-outline` (Ionicons)
  - **Timetable**: `calendar` / `calendar-outline` (Ionicons)
  - **Attendance**: `checkmark-circle` / `checkmark-circle-outline` (Ionicons)
  - **Homework**: `book` / `book-outline` (Ionicons)
  - **Marks**: `document-text` / `document-text-outline` (Ionicons)
  - **Notices**: `megaphone` / `megaphone-outline` (Ionicons)

## Technical Safety
- All vector icons are imported directly from `@expo/vector-icons/Ionicons`.
- No heavy external third-party vector libraries were added.
- All styles leverage centralized `colors` and `sizes` to ensure consistent rendering.
