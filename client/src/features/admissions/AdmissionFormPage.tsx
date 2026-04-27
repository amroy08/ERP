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
import { IndianRupee, Calculator, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  classId: z.string().min(1, 'Required'),
  previousSchool: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  parentName: z.string().min(2, 'Required'),
  parentPhone: z.string().min(10, 'Valid phone required'),
  parentEmail: z.string().email().optional().or(z.literal('')),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  address: z.string().optional(),
  remarks: z.string().optional(),
  feeAssignments: z.array(z.object({
    feeStructureId: z.string(),
    amount: z.number().min(0)
  })).optional(),
});

type FormData = z.infer<typeof schema>;

export const AdmissionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [feeStructures, setFeeStructureDocs] = useState<FeeStructureDoc[]>([]);
  const isAdminOrClerk = isRole(['super_admin', 'admin', 'clerk']);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'male', feeAssignments: [] },
  });

  const selectedClassId = watch('classId');
  const watchedAssignments = watch('feeAssignments') || [];

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/admissions', data);
      toast.success('Admission application submitted!');
      navigate('/admissions');
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

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb items={[{ label: 'Admissions', href: '/admissions' }, { label: 'New Application' }]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">New Admission Application</h1>
        <p className="text-slate-500 text-sm">Create a new student admission record with personalized fee assignments.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        {/* Student Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Student Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Field label="First Name" err={errors.firstName?.message} req>
              <input {...register('firstName')} className={inputCls} placeholder="e.g. John" />
            </Field>
            <Field label="Last Name" err={errors.lastName?.message} req>
              <input {...register('lastName')} className={inputCls} placeholder="e.g. Doe" />
            </Field>
            <Field label="Class Applying For" err={errors.classId?.message} req>
              <select {...register('classId')} className={inputCls}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Date of Birth" err={errors.dateOfBirth?.message}>
              <input type="date" {...register('dateOfBirth')} className={inputCls} />
            </Field>
            <Field label="Gender" err={errors.gender?.message}>
              <select {...register('gender')} className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Aadhaar Number">
              <input {...register('aadhaarNumber')} className={inputCls} placeholder="XXXX XXXX XXXX" maxLength={14} />
            </Field>
            <Field label="Previous School Name">
              <input {...register('previousSchool')} className={inputCls} placeholder="Name of previous institution" />
            </Field>
          </div>
        </div>

        {/* Guardian / Parent Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Guardian / Parent Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Field label="Primary Guardian Name" err={errors.parentName?.message} req>
              <input {...register('parentName')} className={inputCls} placeholder="Primary contact person" />
            </Field>
            <Field label="Primary Phone" err={errors.parentPhone?.message} req>
              <input {...register('parentPhone')} className={inputCls} placeholder="+91 9876543210" />
            </Field>

            <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Father's Details <span className="text-slate-300 font-normal">(Optional)</span></p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Father's Name">
                  <input {...register('fatherName')} className={inputCls} placeholder="Father's full name" />
                </Field>
                <Field label="Father's Phone">
                  <input {...register('fatherPhone')} className={inputCls} placeholder="+91 9876543210" />
                </Field>
              </div>
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Mother's Details <span className="text-slate-300 font-normal">(Optional)</span></p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Mother's Name">
                  <input {...register('motherName')} className={inputCls} placeholder="Mother's full name" />
                </Field>
                <Field label="Mother's Phone">
                  <input {...register('motherPhone')} className={inputCls} placeholder="+91 9876543210" />
                </Field>
              </div>
            </div>

            <Field label="Email Address" err={errors.parentEmail?.message}>
              <input type="email" {...register('parentEmail')} className={inputCls} placeholder="email@example.com" />
            </Field>
            <Field label="Residential Address">
              <input {...register('address')} className={inputCls} placeholder="House no, Street, City" />
            </Field>
          </div>
        </div>

        {/* Fee Assignment — Admin/Clerk Only */}
        {isAdminOrClerk && selectedClassId && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
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
          <Field label="Administrative Remarks">
            <textarea {...register('remarks')} className={inputCls} rows={3} placeholder="Any specific requirements or notes..." />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/admissions')}>Discard</Button>
          <Button type="submit" isLoading={isSubmitting} size="lg" className="px-10 h-12 text-base shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
};
