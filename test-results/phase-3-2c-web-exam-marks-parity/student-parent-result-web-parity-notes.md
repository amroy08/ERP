# Phase 3.2C: Student & Parent Result Web Parity Notes

## Results Web Integration
- **Student Dashboard / Exams**: Students can click on their scheduled exams in the web console and view detailed gradebook results representing marks obtained, max marks, percentage, grade, and teacher remarks.
- **Parent Portal**: Parents can view their child's grade performance directly under My Academics in the web console.
- **Scoping / IDOR Security**: All endpoints enforce that the logged-in student user matches the requested student ID, and the logged-in parent user matches the children relationship table. Mismatched queries result in a `403 Forbidden` response.
