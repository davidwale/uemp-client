import { useAcademicSettings } from './queries';

/** Grading key printed alongside results so the scale is always documented. */
export function GradeKey() {
  const { data } = useAcademicSettings();
  if (!data) return null;
  return (
    <div className="text-xs text-slate-500">
      <p className="mb-1 font-medium text-slate-600">
        Grading scale (CA {data.caMaxScore} + Exam {data.examMaxScore} = 100)
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.gradeScale.map((b) => (
          <span key={b.grade}>
            <strong className="text-slate-700">{b.grade}</strong> {b.minScore}–{b.maxScore} ({b.gradePoint} pts)
          </span>
        ))}
      </div>
    </div>
  );
}
