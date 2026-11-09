import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, Card, CardBody, CardHeader, Detail, Input, PageHeader } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api, type DataResponse } from '@/lib/api';
import { ME_QUERY_KEY } from '@/lib/queryClient';
import { errorMessage, formatDate, levelLabel, ROLE_LABELS } from '@/lib/utils';
import type { CurrentUser } from '@/types/api';

const contactSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9\s-]{7,20})?$/, 'Enter a valid phone number'),
  address: z.string().trim().max(255),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export function ProfilePage() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const isStudent = user.role === 'STUDENT';

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { phone: user.phone ?? '', address: user.studentProfile?.address ?? '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const updateContact = useMutation({
    mutationFn: (v: z.infer<typeof contactSchema>) =>
      api.patch<DataResponse<CurrentUser>>('/profile', {
        phone: v.phone || null,
        ...(isStudent ? { address: v.address || null } : {}),
      }),
    onSuccess: (res) => {
      qc.setQueryData(ME_QUERY_KEY, res.data);
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const changePassword = useMutation({
    mutationFn: (v: z.infer<typeof passwordSchema>) =>
      api.post('/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Password changed. Other devices have been signed out.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const sp = user.studentProfile;
  const lp = user.lecturerProfile;

  return (
    <>
      <PageHeader title="My profile" description="Your account details. Contact your department to correct official records." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Official record" description="Managed by the university" />
          <CardBody>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label="Full name" value={user.fullName} />
              <Detail label="Email" value={user.email} />
              <Detail label="Role" value={ROLE_LABELS[user.role]} />
              <Detail label="Department" value={user.department?.name} />
              <Detail label="Faculty" value={user.department?.faculty?.name} />
              {sp && (
                <>
                  <Detail label="Matric number" value={sp.matricNumber} />
                  <Detail label="Programme" value={sp.program?.name} />
                  <Detail label="Level" value={levelLabel(sp.level)} />
                  <Detail label="Year of entry" value={sp.entryYear} />
                  <Detail label="Gender" value={sp.gender} />
                  <Detail label="Date of birth" value={formatDate(sp.dateOfBirth)} />
                </>
              )}
              {lp && (
                <>
                  <Detail label="Staff number" value={lp.staffNumber} />
                  <Detail label="Title / rank" value={[lp.title, lp.rank].filter(Boolean).join(' · ')} />
                </>
              )}
              <Detail label="Last sign-in" value={formatDate(user.lastLoginAt, true)} />
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contact details" />
            <CardBody>
              <form className="space-y-4" onSubmit={contactForm.handleSubmit((v) => updateContact.mutate(v))} noValidate>
                <Input label="Phone number" error={contactForm.formState.errors.phone?.message} {...contactForm.register('phone')} />
                {isStudent && (
                  <Input label="Address" error={contactForm.formState.errors.address?.message} {...contactForm.register('address')} />
                )}
                <Button type="submit" loading={updateContact.isPending} disabled={!contactForm.formState.isDirty}>
                  Save changes
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Change password" />
            <CardBody>
              <form className="space-y-4" onSubmit={passwordForm.handleSubmit((v) => changePassword.mutate(v))} noValidate>
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  error={passwordForm.formState.errors.currentPassword?.message}
                  {...passwordForm.register('currentPassword')}
                />
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  hint="At least 8 characters with a letter and a number."
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword')}
                />
                <Button type="submit" loading={changePassword.isPending}>
                  Update password
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
