# Navigation & Access Checklist — Phase 3.4

### 1. Teacher Bottom Navigation
* **Screen**: bottom tab bar for Teacher navigation
* **Primary flow**: Swapping tabs (Home, Timetable, Attendance, Homework, Marks, Notices)
* **Data/API dependency**: navigator contexts
* **User action to test**: Tap each bottom icon in sequence.
* **Expected result**: Renders the respective target views without app lag or crashes.
* **Priority**: High

### 2. Student Bottom Navigation
* **Screen**: bottom tab bar for Student navigation
* **Primary flow**: Swapping tabs (Home, Timetable, Homework, Exams)
* **Data/API dependency**: navigator contexts
* **User action to test**: Tap each bottom icon in sequence.
* **Expected result**: Transitions smoothly, loading screen contents quickly.
* **Priority**: High

### 3. Parent Bottom Navigation
* **Screen**: bottom tab bar for Parent navigation
* **Primary flow**: Swapping tabs (Home, Attendance, Academics, Fees, Notices)
* **Data/API dependency**: navigator contexts
* **User action to test**: Tap each bottom icon in sequence.
* **Expected result**: Opens the respective target screens instantly.
* **Priority**: High

### 4. Role-Based Route Isolation
* **Screen**: app routes protection
* **Primary flow**: Block unauthorized roles from requesting other roles' paths.
* **Data/API dependency**: `AuthContext` token verification
* **User action to test**: Attempt direct navigations or access routes of a different role.
* **Expected result**: Route security middleware catches inputs and redirects to proper homes or blocks with `403`.
* **Possible bug/risk**: Role leak allows a student to fetch teacher marks routes.
* **Priority**: High

### 5. Login/Logout Flow
* **Screen**: `LoginScreen` and all role dashboard pages
* **Primary flow**: Logging in via email/password and signing out.
* **Data/API dependency**: `Login` API, `signOut` handler
* **User action to test**: Key in correct credentials, click sign-in, scroll dashboard, click signout, click back.
* **Expected result**: Back action after signing out must NOT navigate back into session; user remains on Login view.
* **Possible bug/risk**: Back button bypasses signout state.
* **Priority**: High

### 6. Quick Demo Login Flow
* **Screen**: `LoginScreen` demo chips
* **Primary flow**: Easy one-tap logins for UAT and testing.
* **Data/API dependency**: Login mock credentials mapping
* **User action to test**: Tap "Teacher"/"Student"/"Parent" demo pill chips, tap Sign In.
* **Expected result**: Credentials populate automatically, logging users into correct roles.
* **Possible bug/risk**: Chips load stale or inactive profiles.
* **Priority**: High

### 7. Back Button Behavior
* **Screen**: Mobile screens headers
* **Primary flow**: Standard navigation back tracking.
* **Data/API dependency**: native screen history stack
* **User action to test**: Open inner sub-view sheets and click header back buttons.
* **Expected result**: Safely pops the active view and returns to previous layout.
* **Possible bug/risk**: Back action triggers blank white screens.
* **Priority**: High

### 8. Pull-to-Refresh Behavior
* **Screen**: dashboard and lists scroll areas
* **Primary flow**: Reloading API parameters on demand.
* **Data/API dependency**: reload controllers
* **User action to test**: Swipe down from top of scroll panels.
* **Expected result**: Spinner triggers, updates dashboard widgets, and closes spinner successfully.
* **Possible bug/risk**: Refresh stays stuck in a spinning state.
* **Priority**: High

### 9. Keyboard Behavior
* **Screen**: Text inputs inputs (Submission modal, marks enter grid)
* **Primary flow**: Handling focus in scroll boxes.
* **Data/API dependency**: native keyboard layouts
* **User action to test**: Click answer fields or input scores.
* **Expected result**: Keyboard rises smoothly, screen scales, inputs remain fully focusable and bounds do not clip.
* **Possible bug/risk**: Input box overlaps action buttons.
* **Priority**: Medium

### 10. Modal Behavior
* **Screen**: modals views (e.g., submission upload popup)
* **Primary flow**: Backdrop dismissals and clean overlay focus.
* **Data/API dependency**: React Native `Modal` context
* **User action to test**: Click resubmit to launch modal, try typing, click cancel to exit.
* **Expected result**: Modal overlays correctly. Cancel trigger closes modal.
* **Possible bug/risk**: Modal backdrop blocks keyboard inputs.
* **Priority**: High

### 11. Empty/Loading/Error States
* **Screen**: list views fallback states
* **Primary flow**: Showing fallbacks for blank or failed requests.
* **Data/API dependency**: query state parameters
* **User action to test**: Simulate blank schedules or network failures.
* **Expected result**: Renders `EmptyState` and `ErrorState` components displaying retry actions.
* **Possible bug/risk**: Visual layout overflows on empty fallbacks.
* **Priority**: Medium
