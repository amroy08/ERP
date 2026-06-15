# Teacher Assignment Root Cause Analysis

This document identifies the root cause of the teacher class and section visibility bug on the mobile dashboard.

---

## 1. Description of the Bug

On the mobile dashboard, teachers who are assigned as **Class Teachers** of specific sections (but are not assigned as **Subject Teachers** for those sections) do not see the class/section listed under their classes list. This prevents them from marking attendance or viewing details for that class on the mobile app.

---

## 2. Technical Code Analysis & Root Cause

The bug originates in `mobileController.ts` within the `getTeacherDashboard` controller function ([getTeacherDashboard](file:///Users/amroy/Desktop/ERP/server/src/controllers/mobileController.ts#L525)).

### 2.1 Prisma Query Limitations
In lines 532–544:
```typescript
    const teacher = await prisma.teacher.findUnique({
      where: { userId: authUser.id },
      include: {
        assignedClasses: true,
        classTeacherOf: true, // <--- Bug: Only fetches Section fields, does not fetch the related Class object
        subjectTeachers: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
      },
    });
```
Because `classTeacherOf` is set to `true`, the query retrieves the Section record but does **not** fetch the associated Class object. Thus, `sec.class` is `undefined` at runtime.

### 2.2 Incomplete Mapping Logic
In lines 587–603, the mapping loops over teacher assignments:
```typescript
    // 1. Process from Phase 2.8 SubjectTeacher allocations
    teacher.subjectTeachers.forEach(st => {
      if (st.section && st.section.class) {
        classesMap.set(st.section.class.id, { id: st.section.class.id, name: st.section.class.name });
        sectionsMap.set(st.section.id, { id: st.section.id, name: st.section.name, className: st.section.class.name });
      }
      ...
    });

    // 2. Add class teacher sections and classes
    teacher.classTeacherOf.forEach(sec => {
      sectionsMap.set(sec.id, { id: sec.id, name: sec.name }); // <--- Bug 1: Missing className field!
    });
```

#### Consequences of the Bug:
1. **Missing Class Name on Sections**: The section objects added in step 2 lack the `className` property, causing UI rendering bugs or fallback values on mobile.
2. **Missing Classes in Classes Map**: If the teacher is only linked to the class as a Class Teacher of a section (not as a Subject Teacher or through the direct many-to-many `assignedClasses` list), the class of that section is **never** added to the `classesMap`. As a result, the teacher cannot see the class on mobile.

---

## 3. Recommended Technical Resolution

To fix this issue:

### Step A: Update the Prisma Query Include Clause
Modify the query to include the related class object:
```typescript
        classTeacherOf: {
          include: { class: true },
        },
```

### Step B: Update Mapping Loop
Process the class teacher assignments correctly by adding the class details to both maps:
```typescript
    // 2. Add class teacher sections and classes
    teacher.classTeacherOf.forEach(sec => {
      if (sec.class) {
        classesMap.set(sec.class.id, { id: sec.class.id, name: sec.class.name });
        sectionsMap.set(sec.id, { id: sec.id, name: sec.name, className: sec.class.name });
      }
    });
```
