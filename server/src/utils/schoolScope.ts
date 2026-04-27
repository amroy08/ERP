import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Utility to get the Prisma where clause for school isolation.
 * - Super Admin (schoolId: null) can see all schools (no filter).
 * - School-specific users are strictly scoped to their own schoolId.
 */
export const getSchoolScope = (req: AuthRequest) => {
  const user = req.user;
  if (!user) return { schoolId: '___NONE___' }; // Safety fallback

  // Super Admin bypass or scoped view
  if (user.role === 'super_admin') {
    const scopedId = req.headers['x-school-id'];
    if (scopedId && typeof scopedId === 'string') {
      return { schoolId: scopedId };
    }
    return {};
  }

  // Strict scope for all other roles
  return { schoolId: user.schoolId };
};
