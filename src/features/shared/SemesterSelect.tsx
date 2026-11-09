import { Select } from '@/components/ui';
import { useSemesters } from './queries';

/** Semester picker; an empty value means "current semester" on the server. */
export function SemesterSelect({
  value,
  onChange,
  label = 'Semester',
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}) {
  const { data: semesters = [] } = useSemesters();
  return (
    <Select label={label} value={value} onChange={(e) => onChange(e.target.value)} containerClassName={className}>
      <option value="">Current semester</option>
      {semesters.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
          {s.isCurrent ? ' (current)' : ''}
        </option>
      ))}
    </Select>
  );
}
