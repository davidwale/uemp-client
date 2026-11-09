import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, Button, Input, Modal, Select } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import { errorMessage, ROLE_LABELS } from '@/lib/utils';
import type { Role, User } from '@/types/api';
import { useDepartments, usePrograms } from '../shared/queries';

const schema = z
  .object({
    role: z.enum(['STUDENT', 'LECTURER', 'DEPT_ADMIN', 'SUPER_ADMIN']),
    firstName: z.string().trim().min(1, 'Required'),
    lastName: z.string().trim().min(1, 'Required'),
    email: z.email('Enter a valid email'),
    phone: z.string().trim().regex(/^(\+?[0-9\s-]{7,20})?$/, 'Invalid phone number'),
    departmentId: z.string(),
    password: z.string(),
    matricNumber: z.string().trim(),
    programId: z.string(),
    level: z.string(),
    entryYear: z.string(),
    gender: z.string(),
    dateOfBirth: z.string(),
    staffNumber: z.string().trim(),
    title: z.string().trim(),
    rank: z.string().trim(),
    isEdit: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const need = (field: keyof typeof v, message = 'Required') => {
      if (!String(v[field] ?? '').trim()) ctx.addIssue({ code: 'custom', path: [field], message });
    };
    if (v.role !== 'SUPER_ADMIN') need('departmentId', 'Select a department');
    if (!v.isEdit) {
      if (v.password.length < 8 || !/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) {
        ctx.addIssue({ code: 'custom', path: ['password'], message: 'At least 8 characters with a letter and a number' });
      }
    }
    if (v.role === 'STUDENT') {
      need('matricNumber');
      need('programId', 'Select a programme');
      need('level', 'Select a level');
      need('entryYear');
    }
    if (v.role === 'LECTURER') need('staffNumber');
  });

type FormValues = z.infer<typeof schema>;

const emptyValues = (role: Role, departmentId: string): FormValues => ({
  role,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  departmentId,
  password: '',
  matricNumber: '',
  programId: '',
  level: '',
  entryYear: String(new Date().getFullYear()),
  gender: '',
  dateOfBirth: '',
  staffNumber: '',
  title: '',
  rank: '',
  isEdit: false,
});

const fromUser = (u: User): FormValues => ({
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone ?? '',
  departmentId: u.department?.id ?? '',
  password: '',
  matricNumber: u.studentProfile?.matricNumber ?? '',
  programId: u.studentProfile?.program?.id ?? '',
  level: u.studentProfile ? String(u.studentProfile.level) : '',
  entryYear: u.studentProfile ? String(u.studentProfile.entryYear) : '',
  gender: u.studentProfile?.gender ?? '',
  dateOfBirth: u.studentProfile?.dateOfBirth ?? '',
  staffNumber: u.lecturerProfile?.staffNumber ?? '',
  title: u.lecturerProfile?.title ?? '',
  rank: u.lecturerProfile?.rank ?? '',
  isEdit: true,
});

function toPayload(v: FormValues) {
  const base = {
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone || null,
    ...(v.role !== 'SUPER_ADMIN' ? { departmentId: v.departmentId } : {}),
  };
  const student =
    v.role === 'STUDENT'
      ? {
          student: {
            matricNumber: v.matricNumber,
            programId: v.programId,
            level: Number(v.level),
            entryYear: Number(v.entryYear),
            gender: v.gender || null,
            dateOfBirth: v.dateOfBirth || null,
          },
        }
      : {};
  const lecturer =
    v.role === 'LECTURER' ? { lecturer: { staffNumber: v.staffNumber, title: v.title || null, rank: v.rank || null } } : {};
  return v.isEdit ? { ...base, ...student, ...lecturer } : { ...base, ...student, ...lecturer, role: v.role, password: v.password };
}

interface Props {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  /** Fixed role when creating from a role-specific page (e.g. "Students"). */
  defaultRole: Role;
  allowedRoles: Role[];
}

export function UserFormModal({ open, onClose, user, defaultRole, allowedRoles }: Props) {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const { data: departments = [] } = useDepartments(isSuper);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: user ? fromUser(user) : emptyValues(defaultRole, me.department?.id ?? ''),
  });
  const { register, handleSubmit, watch, reset, setError, formState } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (open) reset(user ? fromUser(user) : emptyValues(defaultRole, me.department?.id ?? ''));
  }, [open, user, defaultRole, me.department?.id, reset]);

  const role = watch('role');
  const departmentId = watch('departmentId');
  const programId = watch('programId');
  const { data: programs = [] } = usePrograms(departmentId || undefined);
  const levels = programs.find((p) => p.id === programId)?.levels ?? [];

  const save = useMutation({
    mutationFn: (v: FormValues) => (user ? api.patch(`/users/${user.id}`, toPayload(v)) : api.post('/users', toPayload(v))),
    onSuccess: () => {
      toast.success(user ? 'Account updated' : 'Account created');
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (err) => {
      // Map server-side field errors back onto the form.
      if (err instanceof ApiError) {
        for (const issue of err.fieldIssues) {
          const field = issue.field.split('.').pop() as keyof FormValues;
          if (field in schema.shape) setError(field, { message: issue.message });
        }
      }
      toast.error(errorMessage(err));
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={user ? `Edit ${user.fullName}` : `New ${ROLE_LABELS[role].toLowerCase()} account`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(v))}>
            {user ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
        {!user && allowedRoles.length > 1 && (
          <Select label="Role" required {...register('role')} containerClassName="sm:col-span-2">
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        )}
        <Input label="First name" required error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last name" required error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />

        {role !== 'SUPER_ADMIN' &&
          (isSuper ? (
            <Select label="Department" required error={errors.departmentId?.message} {...register('departmentId')}>
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input label="Department" value={me.department?.name ?? ''} disabled />
          ))}

        {!user && (
          <Input
            label="Initial password"
            type="password"
            autoComplete="new-password"
            required
            hint="Share securely; the user can change it after signing in."
            error={errors.password?.message}
            {...register('password')}
          />
        )}

        {role === 'STUDENT' && (
          <>
            <div className="border-t border-slate-100 pt-2 sm:col-span-2">
              <p className="text-sm font-semibold text-slate-800">Academic record</p>
            </div>
            <Input label="Matric number" required placeholder="CSC/2026/010" error={errors.matricNumber?.message} {...register('matricNumber')} />
            <Select label="Programme" required error={errors.programId?.message} {...register('programId')}>
              <option value="">{departmentId ? 'Select programme…' : 'Select a department first'}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select label="Level" required error={errors.level?.message} {...register('level')}>
              <option value="">Select level…</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l} Level
                </option>
              ))}
            </Select>
            <Input label="Year of entry" type="number" required error={errors.entryYear?.message} {...register('entryYear')} />
            <Select label="Gender" {...register('gender')}>
              <option value="">Not specified</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </Select>
            <Input label="Date of birth" type="date" {...register('dateOfBirth')} />
          </>
        )}

        {role === 'LECTURER' && (
          <>
            <div className="border-t border-slate-100 pt-2 sm:col-span-2">
              <p className="text-sm font-semibold text-slate-800">Staff record</p>
            </div>
            <Input label="Staff number" required error={errors.staffNumber?.message} {...register('staffNumber')} />
            <Select label="Title" {...register('title')}>
              <option value="">None</option>
              {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Engr.', 'Prof.'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
            <Input label="Rank" placeholder="e.g. Senior Lecturer" {...register('rank')} containerClassName="sm:col-span-2" />
          </>
        )}

        {user && isSuper && user.department?.id !== departmentId && user.role !== 'SUPER_ADMIN' && (
          <Alert tone="warning" className="sm:col-span-2">
            Moving this user to another department changes which administrators can manage them.
          </Alert>
        )}
      </form>
    </Modal>
  );
}
