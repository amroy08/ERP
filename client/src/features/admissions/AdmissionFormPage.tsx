import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Button } from '../../components/common/Button';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import { ApiResponse, ClassDoc, FeeStructureDoc } from '../../types';
import { 
  IndianRupee, 
  Calculator, 
  CheckCircle2, 
  User, 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  MapPin, 
  Briefcase,
  AlertCircle,
  FileCheck2,
  Users,
  Upload,
  X,
  Trash2,
  Loader2
} from 'lucide-react';
import { uploadAdmissionDocument } from './admissionApi';

const aadhaarRegex = /^\d{12}$/;
const validateAadhaar = (val: string | undefined | null) => {
  if (!val) return true;
  const clean = val.replace(/\s/g, '');
  return aadhaarRegex.test(clean);
};

const optionalEmailSchema = z.string().email('Invalid email address').optional().or(z.literal(''));
const optionalAadhaarSchema = z.string().optional().refine(validateAadhaar, {
  message: 'Aadhaar number must be exactly 12 digits'
}).or(z.literal(''));

const optionalNumberSchema = z.union([
  z.literal('').transform(() => undefined),
  z.coerce.number().min(0, 'Must be positive')
]).optional();

const schema = z.object({
  // Step 1: Student Personal Information
  firstName: z.string().min(2, 'Required (min 2 chars)'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Required (min 2 chars)'),
  dateOfBirth: z.string().min(1, 'Required'),
  gender: z.enum(['male', 'female', 'other']),
  aadhaarNumber: optionalAadhaarSchema,
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  category: z.string().optional(),
  nationality: z.string().default('Indian'),
  motherTongue: z.string().optional(),

  // Step 2: Academic History Details
  classId: z.string().min(1, 'Required'),
  previousSchool: z.string().optional(),
  previousBoard: z.string().optional(),
  lastClassAttended: z.string().optional(),
  previousMarks: z.union([
    z.literal('').transform(() => undefined),
    z.coerce.number().min(0, 'Must be positive').max(100, 'Cannot exceed 100')
  ]).optional(),
  transferCertificateNo: z.string().optional(),
  admissionSource: z.string().optional(),

  // Step 3: Father / Mother / Parent Details
  parentName: z.string().min(2, 'Required'),
  parentPhone: z.string().min(10, 'Valid phone required'),
  parentEmail: optionalEmailSchema,

  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEmail: optionalEmailSchema,
  fatherOccupation: z.string().optional(),
  fatherQualification: z.string().optional(),
  fatherAnnualIncome: optionalNumberSchema,
  fatherAadhaar: optionalAadhaarSchema,
  fatherOfficeAddress: z.string().optional(),

  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  motherEmail: optionalEmailSchema,
  motherOccupation: z.string().optional(),
  motherQualification: z.string().optional(),
  motherAnnualIncome: optionalNumberSchema,
  motherAadhaar: optionalAadhaarSchema,
  motherOfficeAddress: z.string().optional(),

  // Step 4: Guardian & Address Coordinates
  guardianRelationship: z.string().optional(),
  guardianOccupation: z.string().optional(),
  guardianAddress: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  addressStreet: z.string().min(1, 'Required'),
  addressCity: z.string().min(1, 'Required'),
  addressState: z.string().min(1, 'Required'),
  addressPincode: z.string().min(1, 'Required'),

  permanentAddressStreet: z.string().optional(),
  permanentAddressCity: z.string().optional(),
  permanentAddressState: z.string().optional(),
  permanentAddressPincode: z.string().optional(),

  // Step 6: Fee Assignment & Remarks
  remarks: z.string().optional(),
  feeAssignments: z.array(z.object({
    feeStructureId: z.string(),
    amount: z.number().min(0)
  })).optional(),

  // Medical/additional fields
  medicalCondition: z.string().optional(),
  allergies: z.string().optional(),
  specialNeeds: z.string().optional(),
  transportRequired: z.boolean().optional().default(false),
  hostelRequired: z.boolean().optional().default(false),
});

type FormData = z.infer<typeof schema>;

const stepFields: { [key: number]: (keyof FormData)[] } = {
  1: ['firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'aadhaarNumber', 'bloodGroup', 'religion', 'category', 'nationality', 'motherTongue'],
  2: ['classId', 'previousSchool', 'previousBoard', 'lastClassAttended', 'previousMarks', 'transferCertificateNo', 'admissionSource'],
  3: [
    'parentName', 'parentPhone', 'parentEmail',
    'fatherName', 'fatherPhone', 'fatherEmail', 'fatherOccupation', 'fatherQualification', 'fatherAnnualIncome', 'fatherAadhaar', 'fatherOfficeAddress',
    'motherName', 'motherPhone', 'motherEmail', 'motherOccupation', 'motherQualification', 'motherAnnualIncome', 'motherAadhaar', 'motherOfficeAddress'
  ],
  4: [
    'guardianRelationship', 'guardianOccupation', 'guardianAddress', 'emergencyContactName', 'emergencyContactPhone',
    'addressStreet', 'addressCity', 'addressState', 'addressPincode',
    'permanentAddressStreet', 'permanentAddressCity', 'permanentAddressState', 'permanentAddressPincode',
    'medicalCondition', 'allergies', 'specialNeeds', 'transportRequired', 'hostelRequired'
  ],
  5: [], // Documents checklist, no validation needed
  6: ['remarks', 'feeAssignments']
};


export const AdmissionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole } = usePermissions();
  const [currentStep, setCurrentStep] = useState(1);
  const [sameAsCorrespondence, setSameAsCorrespondence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [feeStructures, setFeeStructureDocs] = useState<FeeStructureDoc[]>([]);
  const isAdminOrClerk = isRole(['super_admin', 'admin', 'clerk']);

  // Document states
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'idle' | 'selected' | 'uploading' | 'success' | 'failed'>>({});

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.type)) {
      setFileErrors(prev => ({ ...prev, [key]: 'Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.' }));
      return;
    }

    // Validate size (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setFileErrors(prev => ({ ...prev, [key]: 'File is too large. Maximum size allowed is 5MB.' }));
      return;
    }

    // Clear errors, set file and status
    setFileErrors(prev => ({ ...prev, [key]: '' }));
    setSelectedFiles(prev => ({ ...prev, [key]: file }));
    setUploadProgress(prev => ({ ...prev, [key]: 'selected' }));
  };

  const handleRemoveFile = (key: string) => {
    setSelectedFiles(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setUploadProgress(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setFileErrors(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      gender: 'male',
      nationality: 'Indian',
      transportRequired: false,
      hostelRequired: false,
      feeAssignments: [],
      middleName: '',
      bloodGroup: '',
      religion: '',
      category: '',
      motherTongue: '',
      previousSchool: '',
      previousBoard: '',
      lastClassAttended: '',
      transferCertificateNo: '',
      admissionSource: '',
      fatherName: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherOccupation: '',
      fatherQualification: '',
      fatherAadhaar: '',
      fatherOfficeAddress: '',
      motherName: '',
      motherPhone: '',
      motherEmail: '',
      motherOccupation: '',
      motherQualification: '',
      motherAadhaar: '',
      motherOfficeAddress: '',
      guardianRelationship: '',
      guardianOccupation: '',
      guardianAddress: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressPincode: '',
      permanentAddressStreet: '',
      permanentAddressCity: '',
      permanentAddressState: '',
      permanentAddressPincode: '',
      remarks: '',
    },
  });

  const selectedClassId = watch('classId');
  const watchedAssignments = watch('feeAssignments') || [];

  const addressStreet = watch('addressStreet');
  const addressCity = watch('addressCity');
  const addressState = watch('addressState');
  const addressPincode = watch('addressPincode');

  useEffect(() => {
    if (sameAsCorrespondence) {
      setValue('permanentAddressStreet', addressStreet || '');
      setValue('permanentAddressCity', addressCity || '');
      setValue('permanentAddressState', addressState || '');
      setValue('permanentAddressPincode', addressPincode || '');
    }
  }, [sameAsCorrespondence, addressStreet, addressCity, addressState, addressPincode, setValue]);

  const totalAmount = useMemo(() => {
    return watchedAssignments.reduce((sum, fa) => sum + (Number(fa.amount) || 0), 0);
  }, [watchedAssignments]);

  useEffect(() => {
    axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes').then(res => setClasses(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      axiosInstance.get<ApiResponse<FeeStructureDoc[]>>(`/fees/structures?classId=${selectedClassId}`)
        .then(res => setFeeStructureDocs(res.data.data))
        .catch(() => setFeeStructureDocs([]));
    } else {
      setFeeStructureDocs([]);
    }
  }, [selectedClassId]);

  const nextStep = async () => {
    const fields = stepFields[currentStep];
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const addressText = `${data.addressStreet}, ${data.addressCity}, ${data.addressState} - ${data.addressPincode}`;
      
      const payload: any = {
        ...data,
        address: addressText,
      };

      if (sameAsCorrespondence) {
        payload.permanentAddressStreet = data.addressStreet;
        payload.permanentAddressCity = data.addressCity;
        payload.permanentAddressState = data.addressState;
        payload.permanentAddressPincode = data.addressPincode;
      }

      // 1. Submit admission JSON first
      const res = await axiosInstance.post('/admissions', payload);
      const createdAdmission = res.data.data;
      const admissionId = createdAdmission.id;

      // 2. Upload selected documents
      const fileKeys = Object.keys(selectedFiles);
      let hasUploadFailures = false;
      const failedDocs: string[] = [];

      if (fileKeys.length > 0) {
        // Go back to the document step visually so they can see progress!
        setCurrentStep(5);
        
        for (const key of fileKeys) {
          const file = selectedFiles[key];
          if (!file) continue;
          
          setUploadProgress(prev => ({ ...prev, [key]: 'uploading' }));
          try {
            await uploadAdmissionDocument(admissionId, key, file);
            setUploadProgress(prev => ({ ...prev, [key]: 'success' }));
          } catch (uploadErr) {
            hasUploadFailures = true;
            failedDocs.push(key);
            setUploadProgress(prev => ({ ...prev, [key]: 'failed' }));
          }
        }
      }

      if (hasUploadFailures) {
        toast.error('Admission created, but some documents failed to upload.', {
          duration: 6000
        });
      } else {
        toast.success('Admission application submitted!');
      }

      setTimeout(() => {
        navigate('/admissions');
      }, 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFee = (fee: FeeStructureDoc) => {
    const current = [...watchedAssignments];
    const index = current.findIndex(fa => fa.feeStructureId === fee.id);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push({ feeStructureId: fee.id, amount: fee.totalAmount });
    }
    setValue('feeAssignments', current);
  };

  const updateAmount = (id: string, amount: string) => {
    const current = [...watchedAssignments];
    const index = current.findIndex(fa => fa.feeStructureId === id);
    if (index > -1) {
      current[index].amount = Number(amount) || 0;
      setValue('feeAssignments', current);
    }
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const Field = ({ label, err, children, req }: { label: string; err?: string; children: React.ReactNode; req?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );

  const steps = [
    { number: 1, label: 'Student Info' },
    { number: 2, label: 'Academic' },
    { number: 3, label: 'Parents' },
    { number: 4, label: 'Address & Med' },
    { number: 5, label: 'Documents' },
    { number: 6, label: 'Review & Fees' }
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <Breadcrumb items={[{ label: 'Admissions', href: '/admissions' }, { label: 'New Application' }]} />
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">New Admission Application</h1>
        <p className="text-slate-500 text-sm italic font-medium">Capture student, parent, academic, address, and fee details in a guided admission workflow.</p>
      </div>

      {/* Horizontal Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between relative flex-wrap md:flex-nowrap gap-y-4 md:gap-y-0">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isActive = currentStep === s.number;
            return (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center flex-1 min-w-[80px] md:min-w-0 relative z-10">
                  <div 
                    onClick={async () => {
                      if (s.number < currentStep) {
                        setCurrentStep(s.number);
                      } else if (s.number > currentStep) {
                        let targetStep = currentStep;
                        while (targetStep < s.number) {
                          const fields = stepFields[targetStep];
                          const isValid = await trigger(fields);
                          if (!isValid) break;
                          targetStep++;
                        }
                        setCurrentStep(targetStep);
                      }
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-50' 
                        : isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 transition-colors duration-300 text-center ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block flex-1 h-0.5 bg-slate-100 mx-2 relative -top-3">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: currentStep > s.number ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Student Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Student Profile</h3>
              <p className="text-slate-500 text-xs mt-0.5">Please provide personal registry details for the student.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <Field label="First Name" err={errors.firstName?.message} req>
                <input {...register('firstName')} className={inputCls} placeholder="e.g. Johnny" />
              </Field>
              <Field label="Middle Name" err={errors.middleName?.message}>
                <input {...register('middleName')} className={inputCls} placeholder="e.g. Alan" />
              </Field>
              <Field label="Last Name" err={errors.lastName?.message} req>
                <input {...register('lastName')} className={inputCls} placeholder="e.g. Appleseed" />
              </Field>
              <Field label="Date of Birth" err={errors.dateOfBirth?.message} req>
                <input type="date" {...register('dateOfBirth')} className={inputCls} />
              </Field>
              <Field label="Gender" err={errors.gender?.message} req>
                <select {...register('gender')} className={inputCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Aadhaar Number" err={errors.aadhaarNumber?.message}>
                <input {...register('aadhaarNumber')} className={inputCls} placeholder="XXXX XXXX XXXX" maxLength={14} />
              </Field>
              <Field label="Blood Group" err={errors.bloodGroup?.message}>
                <select {...register('bloodGroup')} className={inputCls}>
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </Field>
              <Field label="Religion" err={errors.religion?.message}>
                <input {...register('religion')} className={inputCls} placeholder="e.g. Hinduism, Christianity" />
              </Field>
              <Field label="Caste/Category" err={errors.category?.message}>
                <select {...register('category')} className={inputCls}>
                  <option value="">Select category</option>
                  <option value="general">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </Field>
              <Field label="Nationality" err={errors.nationality?.message}>
                <input {...register('nationality')} className={inputCls} placeholder="e.g. Indian" />
              </Field>
              <Field label="Mother Tongue" err={errors.motherTongue?.message}>
                <input {...register('motherTongue')} className={inputCls} placeholder="e.g. English, Hindi" />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: Academic Details */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Academic History</h3>
              <p className="text-slate-500 text-xs mt-0.5">Capture information about class selection and past education records.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <Field label="Class Applying For" err={errors.classId?.message} req>
                <select {...register('classId')} className={inputCls}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Previous School Name" err={errors.previousSchool?.message}>
                <input {...register('previousSchool')} className={inputCls} placeholder="Name of previous institution" />
              </Field>
              <Field label="Previous Board" err={errors.previousBoard?.message}>
                <input {...register('previousBoard')} className={inputCls} placeholder="e.g. CBSE, ICSE, State Board" />
              </Field>
              <Field label="Last Class Attended" err={errors.lastClassAttended?.message}>
                <input {...register('lastClassAttended')} className={inputCls} placeholder="e.g. Grade 1" />
              </Field>
              <Field label="Previous Marks/Percentage (%)" err={errors.previousMarks?.message}>
                <input type="number" step="0.01" {...register('previousMarks')} className={inputCls} placeholder="e.g. 85.5" />
              </Field>
              <Field label="Transfer Certificate (TC) No." err={errors.transferCertificateNo?.message}>
                <input {...register('transferCertificateNo')} className={inputCls} placeholder="TC-XXXXXX" />
              </Field>
              <Field label="Admission Source" err={errors.admissionSource?.message}>
                <select {...register('admissionSource')} className={inputCls}>
                  <option value="">Select source</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Advertisement">Advertisement</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Step 3: Parent Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Primary Guardian */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Primary Guardian Information
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">The main point of contact for school communications.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <Field label="Primary Guardian Name" err={errors.parentName?.message} req>
                  <input {...register('parentName')} className={inputCls} placeholder="Full name" />
                </Field>
                <Field label="Primary Phone" err={errors.parentPhone?.message} req>
                  <input {...register('parentPhone')} className={inputCls} placeholder="10-digit mobile number" />
                </Field>
                <Field label="Primary Email Address" err={errors.parentEmail?.message}>
                  <input type="email" {...register('parentEmail')} className={inputCls} placeholder="email@example.com" />
                </Field>
              </div>
            </div>

            {/* Father Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Father's Details <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Information relating to the candidate's father.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
                <Field label="Father's Name" err={errors.fatherName?.message}>
                  <input {...register('fatherName')} className={inputCls} placeholder="Full name" />
                </Field>
                <Field label="Father's Phone" err={errors.fatherPhone?.message}>
                  <input {...register('fatherPhone')} className={inputCls} placeholder="Phone number" />
                </Field>
                <Field label="Father's Email" err={errors.fatherEmail?.message}>
                  <input type="email" {...register('fatherEmail')} className={inputCls} placeholder="father@example.com" />
                </Field>
                <Field label="Father's Aadhaar" err={errors.fatherAadhaar?.message}>
                  <input {...register('fatherAadhaar')} className={inputCls} placeholder="12-digit Aadhaar" maxLength={12} />
                </Field>
                <Field label="Occupation" err={errors.fatherOccupation?.message}>
                  <input {...register('fatherOccupation')} className={inputCls} placeholder="e.g. Engineer" />
                </Field>
                <Field label="Qualification" err={errors.fatherQualification?.message}>
                  <input {...register('fatherQualification')} className={inputCls} placeholder="e.g. B.Tech, MBA" />
                </Field>
                <Field label="Annual Income (₹)" err={errors.fatherAnnualIncome?.message}>
                  <input type="number" {...register('fatherAnnualIncome')} className={inputCls} placeholder="e.g. 600000" />
                </Field>
                <Field label="Office Address" err={errors.fatherOfficeAddress?.message}>
                  <input {...register('fatherOfficeAddress')} className={inputCls} placeholder="Company name and address" />
                </Field>
              </div>
            </div>

            {/* Mother Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-pink-500" />
                  Mother's Details <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Information relating to the candidate's mother.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
                <Field label="Mother's Name" err={errors.motherName?.message}>
                  <input {...register('motherName')} className={inputCls} placeholder="Full name" />
                </Field>
                <Field label="Mother's Phone" err={errors.motherPhone?.message}>
                  <input {...register('motherPhone')} className={inputCls} placeholder="Phone number" />
                </Field>
                <Field label="Mother's Email" err={errors.motherEmail?.message}>
                  <input type="email" {...register('motherEmail')} className={inputCls} placeholder="mother@example.com" />
                </Field>
                <Field label="Mother's Aadhaar" err={errors.motherAadhaar?.message}>
                  <input {...register('motherAadhaar')} className={inputCls} placeholder="12-digit Aadhaar" maxLength={12} />
                </Field>
                <Field label="Occupation" err={errors.motherOccupation?.message}>
                  <input {...register('motherOccupation')} className={inputCls} placeholder="e.g. Doctor, Homemaker" />
                </Field>
                <Field label="Qualification" err={errors.motherQualification?.message}>
                  <input {...register('motherQualification')} className={inputCls} placeholder="e.g. MBBS, M.Sc" />
                </Field>
                <Field label="Annual Income (₹)" err={errors.motherAnnualIncome?.message}>
                  <input type="number" {...register('motherAnnualIncome')} className={inputCls} placeholder="e.g. 500000" />
                </Field>
                <Field label="Office Address" err={errors.motherOfficeAddress?.message}>
                  <input {...register('motherOfficeAddress')} className={inputCls} placeholder="Office details" />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Guardian & Address Details */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Guardian & Emergency contact */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Guardian & Emergency Contact Details <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Emergency contact and relationship if different from parents.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <Field label="Emergency Contact Name" err={errors.emergencyContactName?.message}>
                  <input {...register('emergencyContactName')} className={inputCls} placeholder="Contact person name" />
                </Field>
                <Field label="Emergency Phone" err={errors.emergencyContactPhone?.message}>
                  <input {...register('emergencyContactPhone')} className={inputCls} placeholder="Contact phone number" />
                </Field>
                <Field label="Relationship to Student" err={errors.guardianRelationship?.message}>
                  <input {...register('guardianRelationship')} className={inputCls} placeholder="e.g. Uncle, Aunt, Grandparent" />
                </Field>
                <Field label="Guardian Occupation" err={errors.guardianOccupation?.message}>
                  <input {...register('guardianOccupation')} className={inputCls} placeholder="Guardian's occupation" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Guardian Address" err={errors.guardianAddress?.message}>
                    <input {...register('guardianAddress')} className={inputCls} placeholder="Guardian's residential address" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Address Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Correspondence Address */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Correspondence Address
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">The primary address for sending letters and reports.</p>
                </div>
                <div className="space-y-4">
                  <Field label="Street / House No." err={errors.addressStreet?.message} req>
                    <input {...register('addressStreet')} className={inputCls} placeholder="Street address details" />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Field label="City" err={errors.addressCity?.message} req>
                        <input {...register('addressCity')} className={inputCls} placeholder="City" />
                      </Field>
                    </div>
                    <div>
                      <Field label="Pincode" err={errors.addressPincode?.message} req>
                        <input {...register('addressPincode')} className={inputCls} placeholder="6 digits" maxLength={6} />
                      </Field>
                    </div>
                  </div>
                  <Field label="State" err={errors.addressState?.message} req>
                    <input {...register('addressState')} className={inputCls} placeholder="State" />
                  </Field>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      Permanent Address
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">Legal permanent address of the candidate.</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200/50 cursor-pointer hover:bg-slate-200/50 select-none">
                    <input 
                      type="checkbox" 
                      checked={sameAsCorrespondence}
                      onChange={(e) => setSameAsCorrespondence(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    Same as Correspondence
                  </label>
                </div>
                <div className="space-y-4">
                  <Field label="Street / House No." err={errors.permanentAddressStreet?.message}>
                    <input 
                      disabled={sameAsCorrespondence}
                      {...register('permanentAddressStreet')} 
                      className={`${inputCls} ${sameAsCorrespondence ? 'opacity-65 bg-slate-100' : ''}`} 
                      placeholder="Street address details" 
                    />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Field label="City" err={errors.permanentAddressCity?.message}>
                        <input 
                          disabled={sameAsCorrespondence}
                          {...register('permanentAddressCity')} 
                          className={`${inputCls} ${sameAsCorrespondence ? 'opacity-65 bg-slate-100' : ''}`} 
                          placeholder="City" 
                        />
                      </Field>
                    </div>
                    <div>
                      <Field label="Pincode" err={errors.permanentAddressPincode?.message}>
                        <input 
                          disabled={sameAsCorrespondence}
                          {...register('permanentAddressPincode')} 
                          className={`${inputCls} ${sameAsCorrespondence ? 'opacity-65 bg-slate-100' : ''}`} 
                          placeholder="Pincode" 
                          maxLength={6}
                        />
                      </Field>
                    </div>
                  </div>
                  <Field label="State" err={errors.permanentAddressState?.message}>
                    <input 
                      disabled={sameAsCorrespondence}
                      {...register('permanentAddressState')} 
                      className={`${inputCls} ${sameAsCorrespondence ? 'opacity-65 bg-slate-100' : ''}`} 
                      placeholder="State" 
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Medical & Additional Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  Medical & Logistics Information <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Please indicate any critical medical issues or transport requirements.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <Field label="Medical Condition" err={errors.medicalCondition?.message}>
                  <input {...register('medicalCondition')} className={inputCls} placeholder="e.g. None, Diabetes" />
                </Field>
                <Field label="Allergies" err={errors.allergies?.message}>
                  <input {...register('allergies')} className={inputCls} placeholder="e.g. Peanuts, Gluten" />
                </Field>
                <Field label="Special Needs" err={errors.specialNeeds?.message}>
                  <input {...register('specialNeeds')} className={inputCls} placeholder="e.g. ADHD, Wheelchair access" />
                </Field>
                <div className="flex items-center gap-6 pt-3 md:col-span-3">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      {...register('transportRequired')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    School Transport Service Required
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      {...register('hostelRequired')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    Hostel Accommodation Required
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Documents Checklist */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Admission Documents Upload
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Select and attach files for validation. Accepted: PDF, JPG, PNG. Max size: 5MB.</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Important Notice</p>
                <p className="mt-0.5 opacity-90">Documents will upload after the admission application is created. All uploaded files are stored securely and privately.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Docs */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Candidate Documentation
                </h4>
                {[
                  { key: 'studentPhoto', label: 'Student Photo', description: 'Recent passport size photograph' },
                  { key: 'birthCertificateDoc', label: 'Birth Certificate', description: 'Official date of birth certificate' },
                  { key: 'studentAadhaarDoc', label: 'Student Aadhaar Card', description: 'Student\'s Aadhaar card' },
                  { key: 'transferCertificateDoc', label: 'Leaving Certificate / TC / LC', description: 'Transfer certificate from last school' },
                  { key: 'previousMarksCardDoc', label: 'Previous Marksheet', description: 'Previous marks card or report card' }
                ].map((field) => {
                  const file = selectedFiles[field.key];
                  const error = fileErrors[field.key];
                  const status = uploadProgress[field.key] || 'idle';
                  return (
                    <div key={field.key} className="flex flex-col p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">{field.label}</span>
                          <span className="text-[10px] text-slate-400 block">{field.description}</span>
                        </div>
                        <div>
                          {status === 'idle' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              Not Selected
                            </span>
                          )}
                          {status === 'selected' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                              Selected
                            </span>
                          )}
                          {status === 'uploading' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading
                            </span>
                          )}
                          {status === 'success' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Uploaded
                            </span>
                          )}
                          {status === 'failed' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>

                      {file ? (
                        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                          <span className="text-xs font-mono text-slate-600 truncate max-w-[250px]">{file.name}</span>
                          {status === 'selected' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field.key)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <Upload className="w-3.5 h-3.5" /> Select File
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(field.key, e)}
                            />
                          </label>
                        </div>
                      )}
                      {error && <p className="text-[10px] text-red-500 font-medium mt-1">{error}</p>}
                    </div>
                  );
                })}
              </div>

              {/* Parent Docs */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Parent & Guardian Documentation
                </h4>
                {[
                  { key: 'parentAadhaarDoc', label: 'Parent/Guardian Aadhaar Card', description: 'Aadhaar identification card' }
                ].map((field) => {
                  const file = selectedFiles[field.key];
                  const error = fileErrors[field.key];
                  const status = uploadProgress[field.key] || 'idle';
                  return (
                    <div key={field.key} className="flex flex-col p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">{field.label}</span>
                          <span className="text-[10px] text-slate-400 block">{field.description}</span>
                        </div>
                        <div>
                          {status === 'idle' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              Not Selected
                            </span>
                          )}
                          {status === 'selected' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                              Selected
                            </span>
                          )}
                          {status === 'uploading' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading
                            </span>
                          )}
                          {status === 'success' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Uploaded
                            </span>
                          )}
                          {status === 'failed' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>

                      {file ? (
                        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                          <span className="text-xs font-mono text-slate-600 truncate max-w-[250px]">{file.name}</span>
                          {status === 'selected' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field.key)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <Upload className="w-3.5 h-3.5" /> Select File
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(field.key, e)}
                            />
                          </label>
                        </div>
                      )}
                      {error && <p className="text-[10px] text-red-500 font-medium mt-1">{error}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Fee Assignment & Review */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Review Summary Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  Application Review Summary
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Please verify all the details entered before submitting the application.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                {/* Student Personal */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2.5">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1.5 border-b border-slate-200/60">Candidate Profile</h4>
                  <div><span className="text-slate-500">Name:</span> <span className="font-bold text-slate-700">{watch('firstName')} {watch('middleName')} {watch('lastName')}</span></div>
                  <div><span className="text-slate-500">Gender / DOB:</span> <span className="font-bold text-slate-700 capitalize">{watch('gender')} / {watch('dateOfBirth')}</span></div>
                  <div><span className="text-slate-500">Aadhaar:</span> <span className="font-bold text-slate-700">{watch('aadhaarNumber') || 'Not provided'}</span></div>
                  <div><span className="text-slate-500">Nationality:</span> <span className="font-bold text-slate-700">{watch('nationality') || 'Indian'}</span></div>
                  <div><span className="text-slate-500">Blood Group:</span> <span className="font-bold text-slate-700">{watch('bloodGroup') || 'Not provided'}</span></div>
                </div>

                {/* Academic */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2.5">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1.5 border-b border-slate-200/60">Academic Details</h4>
                  <div><span className="text-slate-500">Applying For:</span> <span className="font-bold text-slate-700">{classes.find(c => c.id === selectedClassId)?.name || 'Class not selected'}</span></div>
                  <div><span className="text-slate-500">Previous School:</span> <span className="font-bold text-slate-700 truncate block max-w-[200px]">{watch('previousSchool') || 'None'}</span></div>
                  <div><span className="text-slate-500">Previous Marks / Board:</span> <span className="font-bold text-slate-700">{watch('previousMarks') ? `${watch('previousMarks')}%` : '—'} / {watch('previousBoard') || '—'}</span></div>
                  <div><span className="text-slate-500">TC Number:</span> <span className="font-bold text-slate-700">{watch('transferCertificateNo') || '—'}</span></div>
                </div>

                {/* Parent / Guardian */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2.5">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1.5 border-b border-slate-200/60">Parents & Guardians</h4>
                  <div><span className="text-slate-500">Primary Contact:</span> <span className="font-bold text-slate-700">{watch('parentName')} ({watch('parentPhone')})</span></div>
                  {watch('fatherName') && <div><span className="text-slate-500">Father:</span> <span className="font-bold text-slate-700">{watch('fatherName')}</span></div>}
                  {watch('motherName') && <div><span className="text-slate-500">Mother:</span> <span className="font-bold text-slate-700">{watch('motherName')}</span></div>}
                  {watch('emergencyContactName') && <div><span className="text-slate-500">Emergency Contact:</span> <span className="font-bold text-slate-700">{watch('emergencyContactName')} ({watch('emergencyContactPhone')})</span></div>}
                </div>

                {/* Addresses */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2 col-span-1 md:col-span-2">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1.5 border-b border-slate-200/60">Addresses</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Correspondence Address</p>
                      <p className="font-bold text-slate-700 mt-0.5 leading-relaxed">{watch('addressStreet')}, {watch('addressCity')}, {watch('addressState')} - {watch('addressPincode')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Permanent Address</p>
                      <p className="font-bold text-slate-700 mt-0.5 leading-relaxed">
                        {sameAsCorrespondence 
                          ? 'Same as Correspondence Address' 
                          : `${watch('permanentAddressStreet') || ''}, ${watch('permanentAddressCity') || ''}, ${watch('permanentAddressState') || ''} - ${watch('permanentAddressPincode') || ''}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical & Logistics */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2.5">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1.5 border-b border-slate-200/60">Medical & Logistics</h4>
                  <div><span className="text-slate-500">Medical Condition:</span> <span className="font-bold text-slate-700">{watch('medicalCondition') || 'None'}</span></div>
                  <div><span className="text-slate-500">Transport / Hostel:</span> <span className="font-bold text-slate-700">{watch('transportRequired') ? 'Yes' : 'No'} / {watch('hostelRequired') ? 'Yes' : 'No'}</span></div>
                </div>
              </div>

              {/* Document Check alert warning */}
              {(() => {
                const totalDocsCount = 6;
                const selectedCount = Object.keys(selectedFiles).length;
                const missingCount = totalDocsCount - selectedCount;
                
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Selected Digital Documents Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 flex justify-between">
                        <span>Selected Documents:</span>
                        <span className="font-bold">{selectedCount}</span>
                      </div>
                      <div className="bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-100 flex justify-between">
                        <span>Missing Documents:</span>
                        <span className="font-bold">{missingCount}</span>
                      </div>
                    </div>
                    {selectedCount > 0 && (
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-500 mb-1">Selected Files:</p>
                        {Object.entries(selectedFiles).map(([key, file]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-400 capitalize">{key.replace('Doc', '').replace('student', 'Student ').replace('parent', 'Parent ')}:</span>
                            <span className="font-mono text-slate-700 truncate max-w-[200px]">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 italic">
                      Note: Documents will be uploaded to the secure server automatically after the admission record is created.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Fee Assignment Grid */}
            {isAdminOrClerk && selectedClassId && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Fee Assignments
                    </h3>
                    <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter leading-none">Total Admission Fee</p>
                            <p className="text-lg font-black text-blue-900 leading-none mt-1 flex items-baseline gap-0.5">
                                <span className="text-sm font-bold">₹</span>{totalAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {feeStructures.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {feeStructures.map((fee) => {
                      const assignment = watchedAssignments.find(fa => fa.feeStructureId === fee.id);
                      const isSelected = !!assignment;
                      
                      return (
                        <div
                          key={fee.id}
                          className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all ${
                            isSelected 
                              ? 'bg-blue-50/50 border-blue-300 shadow-sm ring-1 ring-blue-500/10' 
                              : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                        >
                            <button 
                                type="button"
                                onClick={() => toggleFee(fee)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                }`}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className={`font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>{fee.name}</p>
                                {fee.components?.[0] && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-bold uppercase">
                                    {fee.components[0].frequency}
                                  </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 capitalize">
                              {fee.components?.map(c => c.category).join(', ') || 'Mixed Fee'}
                            </p>
                          </div>

                          <div className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                              isSelected ? 'bg-white border-blue-200' : 'bg-slate-50 border-transparent opacity-50 gray-scale'
                          }`}>
                            <div className="flex items-center gap-2 px-3">
                                <IndianRupee className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                <input 
                                    type="number"
                                    disabled={!isSelected}
                                    value={assignment?.amount ?? fee.totalAmount}
                                    onChange={(e) => updateAmount(fee.id, e.target.value)}
                                    className={`w-28 text-sm font-bold bg-transparent outline-none ${isSelected ? 'text-blue-900' : 'text-slate-400'}`}
                                />
                            </div>
                            {!isSelected && <span className="text-[10px] font-bold text-slate-400 uppercase pr-3">Default Value</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                    Select a class to see available fee structures.
                  </p>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <Field label="Administrative Remarks" err={errors.remarks?.message}>
                <textarea {...register('remarks')} className={inputCls} rows={3} placeholder="Any specific requirements or notes..." />
              </Field>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            {currentStep > 1 ? (
              <Button type="button" variant="secondary" onClick={prevStep} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => navigate('/admissions')}>
                Discard
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <Button type="button" onClick={nextStep} className="px-8 h-11 text-sm font-black shadow-lg" icon={<ArrowRight className="w-4 h-4" />}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} size="lg" className="px-10 h-12 text-base font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

