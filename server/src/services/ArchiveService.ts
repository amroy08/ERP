import prisma from '../config/prisma';

export type EntityType = 'student' | 'teacher' | 'staff' | 'parent' | 'notice' | 'exam' | 'subject' | 'class';

export class ArchiveService {
  static async moveToArchive(type: EntityType, id: string, deletedBy?: string, schoolId?: string) {
    return await prisma.$transaction(async (tx) => {
      let record: any = null;
      let name = 'Unknown';

      const scope = schoolId ? { schoolId } : {};

      // 1. Fetch record with relations
      switch (type) {
        case 'student':
          record = await tx.student.findFirst({
            where: { id, ...scope },
            include: { 
              user: true, 
              parent: true, 
              class: true, 
              section: true,
              attendance: true,
              feePayments: true,
              results: true,
              assignedFees: true,
              leaveRequests: true,
              activityLogs: true
            }
          });
          name = record?.fullName || name;
          break;
        case 'teacher':
          record = await tx.teacher.findFirst({
            where: { id, ...scope },
            include: { user: true, assignedClasses: true, classTeacherOf: true, subjects: true }
          });
          name = record?.user?.name || name;
          break;
        case 'staff':
          record = await tx.staff.findFirst({
            where: { id, ...scope },
            include: { user: true }
          });
          name = record?.user?.name || name;
          break;
        case 'parent':
          record = await tx.parent.findFirst({
            where: { id, ...scope },
            include: { user: true, children: true }
          });
          name = record?.fatherName || name;
          break;
        case 'notice':
          record = await tx.notice.findFirst({ where: { id, ...scope } });
          name = record?.title || name;
          break;
        case 'class':
          record = await tx.class.findFirst({ 
            where: { id, ...scope },
            include: { sections: true, subjects: true, students: true }
          });
          name = record?.name || name;
          break;
        case 'subject':
          record = await tx.subject.findFirst({ where: { id, ...scope } });
          name = record?.name || name;
          break;
      }

      if (!record) throw new Error(`${type} record not found`);

      // 2. Save to Archive
      await (tx as any).archive.create({
        data: {
          entityType: type,
          entityId: id,
          entityName: name,
          data: record as any,
          deletedBy
        }
      });

      // 3. Delete original (Prisma will handle constraints or we might need to disconnect)
      // For now, we perform hard delete of the main record
      // NOTE: In production, you'd want to handle cascading or disconnection more carefully.
      switch (type) {
        case 'student':
          await tx.attendance.deleteMany({ where: { studentId: id } });
          await tx.feePayment.deleteMany({ where: { studentId: id } });
          await tx.result.deleteMany({ where: { studentId: id } });
          await tx.studentFee.deleteMany({ where: { studentId: id } });
          await tx.leaveRequest.deleteMany({ where: { studentId: id } });
          await tx.activityLog.deleteMany({ where: { studentId: id } });
          
          await tx.student.delete({ where: { id } });
          if (record.userId) await tx.user.delete({ where: { id: record.userId } });
          break;
        case 'teacher':
          await tx.teacher.delete({ where: { id } });
          if (record.userId) await tx.user.delete({ where: { id: record.userId } });
          break;
        case 'staff':
          await tx.staff.delete({ where: { id } });
          if (record.userId) await tx.user.delete({ where: { id: record.userId } });
          break;
        case 'parent':
          await tx.parent.delete({ where: { id } });
          if (record.userId) await tx.user.delete({ where: { id: record.userId } });
          break;
        case 'notice':
          await tx.notice.delete({ where: { id } });
          break;
        case 'class':
          // We only delete the class itself, Prisma might prevent deletion if students exist
          await tx.class.delete({ where: { id } });
          break;
        case 'subject':
          await tx.subject.delete({ where: { id } });
          break;
      }

      return { success: true, name };
    });
  }

  static async restoreFromArchive(archiveId: string) {
    const archive = await (prisma as any).archive.findUnique({ where: { id: archiveId } });
    if (!archive) throw new Error('Archive record not found');

    const data = archive.data as any;
    const type = archive.entityType as EntityType;

    return await prisma.$transaction(async (tx) => {
      switch (type) {
        case 'student':
          // Re-create user if existed
          if (data.user) {
            await tx.user.create({ data: { ...data.user } });
          }
          // Re-create student
          const { 
            user, parent, class: cls, section, 
            attendance, feePayments, results, assignedFees, 
            leaveRequests, activityLogs,
            ...studentData 
          } = data;
          
          await tx.student.create({ data: studentData });

          // Re-insert related records
          if (attendance) await tx.attendance.createMany({ data: attendance });
          if (feePayments) await tx.feePayment.createMany({ data: feePayments });
          if (results) await tx.result.createMany({ data: results });
          if (assignedFees) await tx.studentFee.createMany({ data: assignedFees });
          if (leaveRequests) await tx.leaveRequest.createMany({ data: leaveRequests });
          if (activityLogs) await tx.activityLog.createMany({ data: activityLogs });
          break;
          
        case 'teacher':
          if (data.user) {
            await tx.user.create({ data: { ...data.user } });
          }
          const { user: tUser, assignedClasses, classTeacherOf, subjects, ...teacherData } = data;
          await tx.teacher.create({ data: teacherData });
          // Note: Restoring many-to-many relations might be complex depending on if IDs still exist
          break;

        case 'staff':
          if (data.user) {
            await tx.user.create({ data: { ...data.user } });
          }
          const { user: sUser, ...staffData } = data;
          await tx.staff.create({ data: staffData });
          break;

        case 'parent':
          if (data.user) {
            await tx.user.create({ data: { ...data.user } });
          }
          const { user: pUser, children, ...parentData } = data;
          await tx.parent.create({ data: parentData });
          break;

        case 'notice':
          await tx.notice.create({ data: { ...data } });
          break;
        case 'class':
          const { sections: clsSections, subjects: clsSubjects, students: clsStudents, ...classData } = data;
          await tx.class.create({ data: classData });
          if (clsSections) await tx.section.createMany({ data: clsSections });
          break;
        case 'subject':
          await tx.subject.create({ data: { ...data } });
          break;
      }

      // Delete from archive after restoration
      await (tx as any).archive.delete({ where: { id: archiveId } });

      return { success: true };
    });
  }
}
