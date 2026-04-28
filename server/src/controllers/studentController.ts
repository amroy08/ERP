import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';
import { createLog } from '../services/LogService';
import { FeeService } from '../services/FeeService';
import { ArchiveService } from '../services/ArchiveService';
import { getSchoolScope } from '../utils/schoolScope';

const generatePassword = (prefix: string): string => {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}@${digits}`;
};

export const getStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, sectionId, status, search, page, limit } = req.query as Record<string, string>;
    
    const scope = getSchoolScope(req);
    const where: any = {
      ...scope,
      AND: [
        classId ? { classId } : {},
        sectionId ? { sectionId } : {},
        status ? { status: status as any } : {},
        search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { fullName: { contains: search } },
            { admissionNumber: { contains: search } }
          ]
        } : {}
      ]
    };

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
          parent: { select: { fatherName: true, fatherPhone: true } }
        },
        orderBy: { firstName: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) { next(error); }
};

export const getStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const scope = getSchoolScope(req);

    const student = await prisma.student.findFirst({
      where: { id: id as string, ...scope },
      include: {
        class: true,
        section: true,
        parent: true,
        leaveRequests: true,
        activityLogs: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!student) {
      next(createError('Student not found', 404));
      return;
    }

    // RBAC: Students can only view their own profile
    const authUser = (req as any).user;
    if (authUser.role === 'student' && student.userId !== authUser.id) {
      return next(createError('Access denied. You can only view your own profile.', 403));
    }

    res.json({ success: true, data: student });
  } catch (error) { next(error); }
};

export const createStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rollNumber, firstName, lastName, dateOfBirth, gender, admissionNumber, classId, sectionId, parentId } = req.body;
    const schoolId = req.user?.schoolId;

    if (!schoolId && req.user?.role !== 'super_admin') {
      return next(createError('School ID missing for user', 400));
    }

    // Create student record
    const student = await prisma.student.create({
      data: {
        rollNumber,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        admissionNumber,
        classId,
        sectionId,
        parentId,
        status: 'active',
        schoolId,
        addressStreet: req.body.address?.street,
        addressCity: req.body.address?.city,
        addressState: req.body.address?.state,
        addressPincode: req.body.address?.pincode,
        emergencyName: req.body.emergencyContact?.name,
        emergencyPhone: req.body.emergencyContact?.phone,
        emergencyRel: req.body.emergencyContact?.relation,
        academicYearId: req.body.academicYearId || (await prisma.academicYear.findFirst({ where: { isCurrent: true, ...getSchoolScope(req) } }))?.id || ''
      }
    });

    // Create user account
    const email = `stu.${admissionNumber.toLowerCase().replace(/-/g, '')}@school.local`;
    const password = await bcrypt.hash('Student@123', 10);
    
    const user = await prisma.user.create({
      data: {
        name: student.fullName,
        email,
        password,
        role: 'student',
        isActive: true,
        schoolId
      }
    });

    await prisma.student.update({
      where: { id: student.id },
      data: { userId: user.id }
    });

    // Assign Class Fees automatically
    const classFees = await prisma.feeStructure.findMany({
      where: { 
        OR: [{ classId: classId }, { classId: null }],
        isActive: true,
        ...getSchoolScope(req)
      }
    });
    
    if (classFees.length > 0) {
      await prisma.studentFee.createMany({
        data: classFees.map(cf => ({
          studentId: student.id,
          feeStructureId: cf.id,
          customAmount: null,
          academicYearId: student.academicYearId,
          schoolId
        }))
      });
    }


    await createLog(student.id, 'ENROLLMENT', `Student record and user account created. ${classFees.length} fees assigned.`);

    res.status(201).json({ success: true, data: student });
  } catch (error) { next(error); }
};

export const updateStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const scope = getSchoolScope(req);

    // Verify ownership
    const existing = await prisma.student.findFirst({ where: { id: id as string, ...(scope as any) } });
    if (!existing) return next(createError('Student not found or access denied', 404));

    const {
      firstName, lastName, dateOfBirth, gender, bloodGroup, category, religion,
      class: classId, section: sectionId, rollNumber, house, previousSchool,
      aadhaarNumber, medicalNote, parent, address, emergencyContact
    } = req.body;

    // Update student record
    const student = await prisma.student.update({
      where: { id: id as string },
      data: {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        bloodGroup: bloodGroup || null,
        category: category || null,
        religion: religion || null,
        classId: classId || undefined,
        sectionId: sectionId || undefined,
        rollNumber: rollNumber || null,
        house: house || null,
        previousSchool: previousSchool || null,
        aadhaarNumber: aadhaarNumber || null,
        medicalNote: medicalNote || null,
        addressStreet: address?.street || null,
        addressCity: address?.city || null,
        addressState: address?.state || null,
        addressPincode: address?.pincode || null,
        emergencyName: emergencyContact?.name || null,
        emergencyPhone: emergencyContact?.phone || null,
        emergencyRel: emergencyContact?.relation || null,
      },
      include: { parent: true }
    });

    // Update parent record if parent data is provided
    if (parent && student.parentId) {
      await prisma.parent.update({
        where: { id: student.parentId },
        data: {
          fatherName: parent.fatherName || undefined,
          fatherPhone: parent.fatherPhone || undefined,
          motherName: parent.motherName || '',
          motherPhone: parent.motherPhone || '',
          address: address ? [address.street, address.city, address.state].filter(Boolean).join(', ') : undefined,
        }
      });

      // Also update parent user email if changed
      if (parent.email && student.parent?.userId) {
        await prisma.user.update({
          where: { id: student.parent.userId },
          data: { email: parent.email }
        }).catch(() => {}); // Silently fail if email conflicts
      }
    }

    res.json({ success: true, data: student });
  } catch (error) { next(error); }
};

export const deleteStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ArchiveService.moveToArchive('student', req.params.id as string, req.user?.id);
    res.json({ success: true, message: `Student ${result.name} archived successfully` });
  } catch (error) { next(error); }
};

export const promoteStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { newClassId, newSectionId } = req.body;
    const studentId = req.params.id as string;

    if (!newClassId || !newSectionId) {
      throw createError('Target Class and Section are required', 400);
    }

    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...getSchoolScope(req) } });
    if (!academicYear) throw createError('No active academic year found', 400);

    const targetClass = await prisma.class.findFirst({ where: { id: newClassId, ...getSchoolScope(req) } });
    const targetSection = await prisma.section.findFirst({ where: { id: newSectionId, ...getSchoolScope(req) } });
    if (!targetClass || !targetSection) {
      throw createError('Selected Class or Section not found', 404);
    }

    // 1. Calculate TOTAL outstanding using the same logic the dashboard uses
    const ledger = await FeeService.getStudentLedger(studentId);
    const totalOutstanding = ledger.balanceDue;

    const result = await prisma.$transaction(async (tx: any) => {
      // 2. Clean slate: delete all old fee assignments
      await tx.studentFee.deleteMany({ where: { studentId } });

      // 3. Move student to the new class
      const updated = await tx.student.update({
        where: { id: studentId },
        data: { classId: newClassId, sectionId: newSectionId },
        include: { class: { select: { name: true } }, section: { select: { name: true } } }
      });

      // 4. Assign new class fees (excluding Previous Dues structure)
      const newClassFees = await tx.feeStructure.findMany({
        where: {
          OR: [{ classId: newClassId }, { classId: null }],
          isActive: true,
          name: { not: 'Previous Dues' },
          ...getSchoolScope(req)
        }
      });


      if (newClassFees.length > 0) {
        await tx.studentFee.createMany({
          data: newClassFees.map((cf: any) => ({
            studentId,
            feeStructureId: cf.id,
            academicYearId: academicYear.id,
            status: 'pending',
            schoolId: cf.schoolId || req.user?.schoolId
          }))
        });

      }

      // 5. Add Previous Dues if there is any outstanding balance
      if (totalOutstanding > 0) {
        const scope = getSchoolScope(req) as any;
        let prevDues = await tx.feeStructure.findFirst({ where: { name: 'Previous Dues', ...scope } });
        if (!prevDues) {
          prevDues = await tx.feeStructure.create({
            data: {
              name: 'Previous Dues',
              description: 'Balance carried forward from previous session',
              totalAmount: 0,
              isActive: true,
              schoolId: scope.schoolId || req.user?.schoolId
            }
          });
        }

        await tx.studentFee.create({
          data: {
            studentId,
            feeStructureId: prevDues.id,
            customAmount: totalOutstanding,
            academicYearId: academicYear.id,
            status: 'pending',
            schoolId: prevDues.schoolId || req.user?.schoolId
          }
        });

      }

      return updated;
    });

    await createLog(
      result.id,
      'PROMOTION',
      `Promoted to ${result.class?.name} - ${result.section?.name}. New class fees assigned.${totalOutstanding > 0 ? ' Previous dues: Rs.' + totalOutstanding.toLocaleString() + '.' : ''}`,
      req.user?.name
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Promotion error:', error);
    next(error);
  }
};

export const resetStudentPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id as string, ...getSchoolScope(req) },
      include: { user: true }
    });

    if (!student || !student.user) {
      return next(new Error('Student user not found'));
    }

    const hashedPassword = await bcrypt.hash('Student@123', 10);
    await prisma.user.update({
      where: { id: student.userId as string },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password reset successfully to Student@123' });
  } catch (error) { next(error); }
};

// Removed local createLog as it is now in LogService.ts

export const getStudentActivityLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { studentId: req.params.id as string, ...getSchoolScope(req) },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

export const importStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      next(createError('No file uploaded. Please upload an Excel file (.xlsx or .xls).', 400));
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) {
      next(createError('The uploaded file has no data rows.', 400));
      return;
    }

    // Normalize column headers (case-insensitive, trim spaces)
    const normalize = (s: string) => s.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const rows = rawRows.map(row => {
      const normalized: Record<string, string> = {};
      for (const key of Object.keys(row)) {
        normalized[normalize(key)] = String(row[key]).trim();
      }
      return normalized;
    });

    // Column mapping: try multiple common names
    const col = (row: Record<string, string>, ...keys: string[]) => {
      for (const k of keys) {
        const val = row[normalize(k)];
        if (val) return val;
      }
      return '';
    };

    // Pre-fetch all classes and sections for fast lookup
    const allClasses = await prisma.class.findMany({ 
      where: getSchoolScope(req),
      include: { sections: true } 
    });
    const classMap = new Map<string, { id: string; sections: { id: string; name: string }[] }>();
    for (const c of allClasses) {
      // Map by name and numericValue for flexible matching
      classMap.set(c.name.toLowerCase(), { id: c.id, sections: c.sections });
      classMap.set(String(c.numericValue), { id: c.id, sections: c.sections });
      // Also map without 'class ' prefix
      classMap.set(c.name.toLowerCase().replace('class ', ''), { id: c.id, sections: c.sections });
    }

    const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true, ...getSchoolScope(req) } });
    if (!academicYear) {
      next(createError('No active academic year found. Please set one before importing.', 400));
      return;
    }

    const scope = getSchoolScope(req) as any;
    const schoolId = scope.schoolId || req.user?.schoolId;
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const hashedPassword = await bcrypt.hash('Student@123', 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is headers, data starts at 2
      try {
        const firstName = col(row, 'First Name', 'FirstName', 'first_name', 'fname');
        const lastName = col(row, 'Last Name', 'LastName', 'last_name', 'lname', 'surname');
        const className = col(row, 'Class', 'class_name', 'grade', 'standard', 'std');
        const sectionName = col(row, 'Section', 'sec', 'division', 'div');
        const gender = col(row, 'Gender', 'sex').toLowerCase();
        const dob = col(row, 'Date of Birth', 'DOB', 'dateofbirth', 'birth_date', 'birthdate');
        const fatherName = col(row, 'Father Name', 'FatherName', 'father_name', 'fathersname', 'guardian', 'parent_name', 'parentname');
        const fatherPhone = col(row, 'Father Phone', 'FatherPhone', 'father_phone', 'parent_phone', 'phone', 'mobile', 'contact');
        const motherName = col(row, 'Mother Name', 'MotherName', 'mother_name', 'mothersname');
        const motherPhone = col(row, 'Mother Phone', 'MotherPhone', 'mother_phone');
        const rollNumber = col(row, 'Roll Number', 'RollNo', 'roll_no', 'roll', 'rollnumber');
        const aadhaar = col(row, 'Aadhaar', 'AadhaarNumber', 'aadhaar_number', 'aadhar', 'uid');
        const religion = col(row, 'Religion');
        const category = col(row, 'Category', 'caste');
        const bloodGroup = col(row, 'Blood Group', 'bloodgroup', 'blood_group');
        const address = col(row, 'Address', 'full_address', 'residential_address');

        // Validations
        if (!firstName) { results.errors.push(`Row ${rowNum}: First Name is required`); results.failed++; continue; }
        if (!className) { results.errors.push(`Row ${rowNum}: Class is required`); results.failed++; continue; }
        if (!fatherName && !col(row, 'Guardian', 'guardian_name')) {
          results.errors.push(`Row ${rowNum}: Father/Guardian Name is required`);
          results.failed++;
          continue;
        }
        if (!fatherPhone) { results.errors.push(`Row ${rowNum}: Contact phone is required`); results.failed++; continue; }

        // Resolve class
        const classLookup = classMap.get(className.toLowerCase()) || classMap.get(className.toLowerCase().replace('class ', ''));
        if (!classLookup) {
          results.errors.push(`Row ${rowNum}: Class "${className}" not found in system`);
          results.failed++;
          continue;
        }

        // Resolve section (default to first section if not specified)
        let sectionId: string;
        if (sectionName) {
          const section = classLookup.sections.find(
            s => s.name.toLowerCase() === sectionName.toLowerCase()
          );
          if (!section) {
            results.errors.push(`Row ${rowNum}: Section "${sectionName}" not found for class "${className}"`);
            results.failed++;
            continue;
          }
          sectionId = section.id;
        } else {
          if (classLookup.sections.length === 0) {
            results.errors.push(`Row ${rowNum}: No sections exist for class "${className}"`);
            results.failed++;
            continue;
          }
          sectionId = classLookup.sections[0].id;
        }

        // Parse DOB
        let dateOfBirth: Date;
        if (dob) {
          // Handle Excel serial number dates
          const serial = Number(dob);
          if (!isNaN(serial) && serial > 10000) {
            dateOfBirth = new Date((serial - 25569) * 86400 * 1000);
          } else {
            dateOfBirth = new Date(dob);
          }
          if (isNaN(dateOfBirth.getTime())) {
            dateOfBirth = new Date('2010-01-01');
          }
        } else {
          dateOfBirth = new Date('2010-01-01');
        }

        // Parse gender
        let genderEnum: 'male' | 'female' | 'other' = 'male';
        if (gender.startsWith('f')) genderEnum = 'female';
        else if (gender.startsWith('o') || gender.startsWith('t')) genderEnum = 'other';

        // Generate admission number
        const year = new Date().getFullYear();
        const seq = Math.floor(1000 + Math.random() * 9000);
        const admissionNumber = `ADM-${year}-${seq}`;

        // Create parent
        const parent = await prisma.parent.create({
          data: {
            fatherName: fatherName || col(row, 'Guardian', 'guardian_name') || 'Guardian',
            fatherPhone,
            motherName: motherName || '',
            motherPhone: motherPhone || '',
            address: address || '',
            schoolId
          }
        });

        // Create student
        const student = await prisma.student.create({
          data: {
            admissionNumber,
            rollNumber: rollNumber || null,
            firstName,
            lastName: lastName || '',
            fullName: `${firstName}${lastName ? ' ' + lastName : ''}`,
            dateOfBirth,
            gender: genderEnum,
            bloodGroup: bloodGroup || null,
            religion: religion || null,
            category: category || 'general',
            classId: classLookup.id,
            sectionId,
            parentId: parent.id,
            academicYearId: academicYear.id,
            aadhaarNumber: aadhaar || null,
            status: 'active',
            schoolId
          }
        });

        // Create user account for login
        const email = `stu.${admissionNumber.toLowerCase().replace(/-/g, '')}@school.local`;
        const user = await prisma.user.create({
          data: {
            name: student.fullName,
            email,
            password: hashedPassword,
            role: 'student',
            isActive: true,
            schoolId
          }
        });

        await prisma.student.update({
          where: { id: student.id },
          data: { userId: user.id }
        });

        // Assign Class Fees automatically (New requested feature)
        const classFees = await prisma.feeStructure.findMany({
          where: { 
            OR: [{ classId: classLookup.id }, { classId: null }],
            isActive: true,
            schoolId
          }
        });
        
        if (classFees.length > 0) {
          await prisma.studentFee.createMany({
            data: classFees.map(cf => ({
              studentId: student.id,
              feeStructureId: cf.id,
              customAmount: null, // Use default from structure
              academicYearId: academicYear.id,
              schoolId
            }))
          });
        }


        await createLog(student.id, 'IMPORT', `Imported via Excel upload to ${className}. ${classFees.length} fee structures assigned.`);
        results.success++;
      } catch (err: any) {
        results.errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
        results.failed++;
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${results.success} students added, ${results.failed} failed.`,
      data: results
    });
  } catch (error) { next(error); }
};
