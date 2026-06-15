# Teacher Homework Review UI Notes — Phase 3.1G

## Layout & Aesthetics

Following Phase 3.0H, the screens follow premium Light ERP design paradigms:

1. **Aesthetics & Colors**:
   - Palette coordinates perfectly with the `teacher` brand violet (`#8B5CF6`).
   - Cards match standard `AppCard` and spacing matches screen containers.
   - Headers and bottom navigation tabs are clean, preventing text wrapping or overcrowding.

2. **Components**:
   - `AppCard` represents each homework assignment with a structured statistics grid mapping student distribution.
   - `StatusBadge` uses tailormade colors representing statuses:
     - `submitted` -> info (blue)
     - `late` -> warning (orange)
     - `reviewed` -> success (green)
     - `returned` -> danger (red)

3. **Modals & Inputs**:
   - The review action opens [HomeworkReviewModal.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/components/HomeworkReviewModal.tsx).
   - Multiline inputs capture long text comments, and specialized numeric inputs parse marks correctly.
   - Secure files are handled natively by installing `expo-file-system` and `expo-sharing` which retrieve the private JWT auth token securely and stream the file into cache without leaking paths.
