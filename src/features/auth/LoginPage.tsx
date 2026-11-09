import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { Alert, Button, Input } from '@/components/ui';
import { ROLE_HOME, useLogin, useMe } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@uemp.edu.ng' },
  { role: 'Lecturer', email: 'lecturer@uemp.edu.ng' },
  { role: 'Department Admin', email: 'csc.admin@uemp.edu.ng' },
  { role: 'Super Admin', email: 'admin@uemp.edu.ng' },
];
const DEMO_PASSWORD = 'Password123!';

export function LoginPage() {
  const { data: user } = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: (u) => {
        // Only honour the "from" redirect if it belongs to this role's area.
        const home = ROLE_HOME[u.role];
        navigate(from?.startsWith(home) ? from : home, { replace: true });
      },
    }),
  );

  const fillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2">
            <GraduationCap className="h-6 w-6" aria-hidden />
          </div>
          <span className="text-lg font-semibold">UEMP</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl leading-tight font-semibold">University Education Management Portal</h1>
          <p className="mt-4 text-brand-100/80">
            Course registration, result management and academic oversight — in one secure place for students, lecturers and
            administrators.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-brand-200/80">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Role-based access · Audited result approvals
        </p>
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" aria-hidden />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 inline-flex rounded-xl bg-brand-800 p-2">
              <GraduationCap className="h-6 w-6 text-white" aria-hidden />
            </div>
            <p className="text-sm font-medium text-brand-800">University Education Management Portal</p>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use your university email and password.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {login.isError && <Alert tone="danger">{errorMessage(login.error)}</Alert>}
            <Input label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
          </form>

          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Demo accounts</p>
            <p className="mt-1 text-xs text-slate-500">
              Password for all accounts: <code className="rounded bg-slate-100 px-1 py-0.5">{DEMO_PASSWORD}</code>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a.email)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="block font-medium text-slate-800">{a.role}</span>
                  <span className="block truncate text-slate-500">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
