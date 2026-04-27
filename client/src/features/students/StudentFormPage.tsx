import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Copy, Check, DollarSign, User, Users, ShieldCheck, Printer, Loader2 } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import axiosInstance from '../../api/axiosInstance';

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  rollNumber: z.string().optional(),
  fatherName: z.string().min(2, 'Father name is required'),
  fatherPhone: z.string().min(10, 'Valid phone required'),
  parentEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  medicalNote: z.string().optional(),
  house: z.string().optional(),
  previousSchool: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Credentials {
  student: { email: string; password: string; admissionNumber: string };
  parent: { email: string; password: string } | null;
}

interface FeeStructure {
  id: string;
  name: string;
  totalAmount: number;
  components: { category: string; name: string; amount: number; frequency: string }[];
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode; required?: boolean }> = ({ label, error, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all";

export const StudentFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }>>([]);
  const [selectedClassSections, setSelectedClassSections] = useState<Array<{ id: string; name: string }>>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { gender: 'male', category: 'General' },
  });

  const selectedClass = watch('class');

  useEffect(() => {
    axiosInstance.get('/classes?limit=50').then((res) => {
      setClasses(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const cls = classes.find((c) => c.id === selectedClass);
      setSelectedClassSections(cls?.sections || []);
      // Fetch fee structure for selected class
      axiosInstance.get(`/fees/structures?classId=${selectedClass}`)
        .then(res => setFeeStructure(res.data.data?.[0] || null))
        .catch(() => setFeeStructure(null));
    } else {
      setFeeStructure(null);
    }
  }, [selectedClass, classes]);

  useEffect(() => {
    if (isEdit && id) {
      setIsLoading(true);
      axiosInstance.get(`/students/${id}`).then((res) => {
        const s = res.data.data;
        if (!s) throw new Error('Student not found');
        
        setValue('firstName', s.firstName);
        setValue('lastName', s.lastName);
        setValue('dateOfBirth', s.dateOfBirth?.slice(0, 10) || '');
        setValue('gender', s.gender);
        setValue('bloodGroup', s.bloodGroup || '');
        setValue('category', s.category || 'General');
        setValue('religion', s.religion || '');
        setValue('class', s.class?.id || '');
        setValue('section', s.section?.id || '');
        setValue('rollNumber', s.rollNumber || '');
        setValue('fatherName', s.parent?.fatherName || '');
        setValue('fatherPhone', s.parent?.fatherPhone || '');
        setValue('parentEmail', s.parent?.email || '');
        setValue('street', s.addressStreet || s.address?.street || '');
        setValue('city', s.addressCity || s.address?.city || '');
        setValue('state', s.addressState || s.address?.state || '');
        setValue('pincode', s.addressPincode || s.address?.pincode || '');
        setValue('house', s.house || '');
        setValue('previousSchool', s.previousSchool || '');
        setValue('aadhaarNumber', s.aadhaarNumber || '');
        setValue('medicalNote', s.medicalNote || '');
        setValue('emergencyName', s.emergencyName || s.emergencyContact?.name || '');
        setValue('emergencyPhone', s.emergencyPhone || s.emergencyContact?.phone || '');
        setValue('emergencyRelation', s.emergencyRel || s.emergencyContact?.relation || '');
        setValue('motherName', s.parent?.motherName || '');
        setValue('motherPhone', s.parent?.motherPhone || '');
      }).catch((err) => {
        console.error('Failed to load student:', err);
        toast.error('Failed to load student data');
        navigate('/students');
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [id, isEdit, navigate, setValue]);

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        category: data.category,
        religion: data.religion,
        class: data.class,
        section: data.section,
        rollNumber: data.rollNumber,
        house: data.house,
        previousSchool: data.previousSchool,
        aadhaarNumber: data.aadhaarNumber,
        medicalNote: data.medicalNote,
        parent: {
          fatherName: data.fatherName,
          fatherPhone: data.fatherPhone,
          motherName: data.motherName,
          motherPhone: data.motherPhone,
          email: data.parentEmail,
        },
        address: { street: data.street, city: data.city, state: data.state, pincode: data.pincode },
        emergencyContact: { name: data.emergencyName, phone: data.emergencyPhone, relation: data.emergencyRelation },
      };

      if (isEdit) {
        await axiosInstance.put(`/students/${id}`, payload);
        toast.success('Student updated successfully!');
        navigate('/students');
      } else {
        const res = await axiosInstance.post('/students', payload);
        if (res.data.credentials) {
          setCredentials(res.data.credentials);
          setIsCredModalOpen(true);
        } else {
          toast.success('Student added successfully!');
          navigate('/students');
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl pb-10">
      <Breadcrumb items={[{ label: 'Students', href: '/students' }, { label: isEdit ? 'Edit Student' : 'Add Student' }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Student' : 'Add New Student'}</h1>
        <p className="text-slate-500 text-sm">
          {isEdit ? 'Update student information.' : 'Login credentials will be auto-generated for the student and parent upon enrollment.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="First Name" error={errors.firstName?.message} required>
              <input {...register('firstName')} className={inputClass} placeholder="Arjun" />
            </Field>
            <Field label="Last Name" error={errors.lastName?.message} required>
              <input {...register('lastName')} className={inputClass} placeholder="Sharma" />
            </Field>
            <Field label="Date of Birth" error={errors.dateOfBirth?.message} required>
              <input type="date" {...register('dateOfBirth')} className={inputClass} />
            </Field>
            <Field label="Gender" error={errors.gender?.message} required>
              <select {...register('gender')} className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group">
              <select {...register('bloodGroup')} className={inputClass}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select {...register('category')} className={inputClass}>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Religion">
              <input {...register('religion')} className={inputClass} placeholder="Hindu" />
            </Field>
            <Field label="House">
              <input {...register('house')} className={inputClass} placeholder="e.g. Red House" />
            </Field>
            <Field label="Previous School">
              <input {...register('previousSchool')} className={inputClass} placeholder="School name" />
            </Field>
            <Field label="Aadhaar Number">
              <input {...register('aadhaarNumber')} className={inputClass} placeholder="XXXX XXXX XXXX" maxLength={14} />
            </Field>
          </div>
        </div>

        {/* Class Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Academic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Class" error={errors.class?.message} required>
              <select {...register('class')} className={inputClass}>
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Section" error={errors.section?.message} required>
              <select {...register('section')} className={inputClass} disabled={!selectedClass}>
                <option value="">Select Section</option>
                {selectedClassSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Roll Number">
              <input {...register('rollNumber')} className={inputClass} placeholder="01" />
            </Field>
          </div>

          {/* Fee Preview */}
          {feeStructure && (
            <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-800">Fee Structure: {feeStructure.name}</p>
                </div>
                <p className="text-lg font-black text-emerald-700">₹{(feeStructure.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {feeStructure.components?.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-emerald-100 shadow-sm">
                    <span className="text-[11px] text-slate-600 font-medium truncate mr-2">{c.name}</span>
                    <span className="text-xs font-bold text-slate-800 shrink-0">₹{(Number(c.amount) || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedClass && !feeStructure && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-medium">
              <DollarSign className="w-4 h-4 shrink-0" />
              No fee structure defined for this class yet. Go to <a href="/fees/structures" className="underline font-bold">Fee Structures</a> to create one.
            </div>
          )}
        </div>

        {/* Parent Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            Parent / Guardian Information
            {!isEdit && <span className="ml-2 text-xs text-blue-500 font-normal">· Login account will be auto-created</span>}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Father's Name" error={errors.fatherName?.message} required>
              <input {...register('fatherName')} className={inputClass} placeholder="Rohit Sharma" />
            </Field>
            <Field label="Father's Phone" error={errors.fatherPhone?.message} required>
              <input {...register('fatherPhone')} className={inputClass} placeholder="+91 9876543210" />
            </Field>
            <Field label="Parent Email" error={errors.parentEmail?.message}>
              <input type="email" {...register('parentEmail')} className={inputClass} placeholder="rohit@gmail.com" />
            </Field>
            <Field label="Mother's Name">
              <input {...register('motherName')} className={inputClass} placeholder="Mother's full name" />
            </Field>
            <Field label="Mother's Phone">
              <input {...register('motherPhone')} className={inputClass} placeholder="+91 9876543210" />
            </Field>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Field label="Street Address">
                <input {...register('street')} className={inputClass} placeholder="123, Model Colony" />
              </Field>
            </div>
            <Field label="City"><input {...register('city')} className={inputClass} placeholder="Mumbai" /></Field>
            <Field label="State"><input {...register('state')} className={inputClass} placeholder="Maharashtra" /></Field>
            <Field label="Pincode"><input {...register('pincode')} className={inputClass} placeholder="400001" /></Field>
          </div>
        </div>

        {/* Medical & Emergency */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Medical & Emergency</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Emergency Contact Name">
              <input {...register('emergencyName')} className={inputClass} placeholder="Guardian name" />
            </Field>
            <Field label="Emergency Phone">
              <input {...register('emergencyPhone')} className={inputClass} placeholder="+91 9000000000" />
            </Field>
            <Field label="Relation">
              <input {...register('emergencyRelation')} className={inputClass} placeholder="Father/Mother/Guardian" />
            </Field>
            <div className="md:col-span-3">
              <Field label="Medical Note">
                <textarea {...register('medicalNote')} className={inputClass} rows={2} placeholder="Any medical conditions, allergies, etc." />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end pt-5">
          <Button type="button" variant="secondary" onClick={() => navigate('/students')}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Update Student' : 'Enroll Student & Generate Credentials'}
          </Button>
        </div>
      </form>

      {/* ── Credentials Modal ─────────────────────────────────────────── */}
      <Modal isOpen={isCredModalOpen} onClose={() => { setIsCredModalOpen(false); navigate('/students'); }} title="🎉 Student Enrolled Successfully" size="md">
        <div className="space-y-5">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">
              Login credentials have been auto-generated. <strong>Save these now</strong> — the password won't be shown again.
            </p>
          </div>

          {/* Student Credentials */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5">
              <User className="w-4 h-4 text-white" />
              <p className="text-sm font-bold text-white">Student Login</p>
              <span className="ml-auto text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-bold">{credentials?.student?.admissionNumber}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email / Username</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{credentials?.student?.email}</p>
                </div>
                <CopyButton text={credentials?.student?.email || ''} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Password</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{credentials?.student?.password}</p>
                </div>
                <CopyButton text={credentials?.student?.password || ''} />
              </div>
            </div>
          </div>

          {/* Parent Credentials */}
          {credentials?.parent && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 bg-indigo-600 px-4 py-2.5">
                <Users className="w-4 h-4 text-white" />
                <p className="text-sm font-bold text-white">Parent Login</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Email / Username</p>
                    <p className="text-sm font-mono font-bold text-slate-800">{credentials.parent.email}</p>
                  </div>
                  <CopyButton text={credentials.parent.email} />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Password</p>
                    <p className="text-sm font-mono font-bold text-slate-800">{credentials.parent.password}</p>
                  </div>
                  <CopyButton text={credentials.parent.password} />
                </div>
              </div>
            </div>
          )}

          {!credentials?.parent && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 font-medium">
              ℹ️ Parent account already exists (matched by phone number). No new credentials created.
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</Button>
            <Button onClick={() => { setIsCredModalOpen(false); navigate('/students'); }}>
              Done — Go to Students
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
