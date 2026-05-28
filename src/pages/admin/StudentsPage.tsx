// Students list (spec §34). Read-only directory with grade/active filters.
// Identity is CSV-owned; the only mutations are activate/deactivate (via a future
// RPC) — there is intentionally no UI to add/edit student identity (spec closing #2).
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listStudents, type StudentRow } from '@/lib/api/students';
import { Card, CardBody } from '@/components/ui/Card';
import { formatIdNumber } from '@/lib/hebrew/israeliId';

const GRADES = ['', 'שיעור א', 'שיעור ב', 'שיעור ג', 'שיעור ד-ה', 'אברכים ובוגרים'];

export function StudentsPage() {
  const [grade, setGrade] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'students', grade, activeOnly],
    queryFn: async () => {
      const { data, error } = await listStudents({ grade: grade || undefined, activeOnly });
      if (error) throw error;
      return (data ?? []) as StudentRow[];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">תלמידים</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g || 'כל השכבות'}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          פעילים בלבד
        </label>
        <span className="text-sm text-text-muted">{data?.length ?? 0} תלמידים</span>
      </div>

      {isLoading && <p className="text-text-muted">טוען…</p>}

      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="p-3 text-start">שם</th>
                <th className="p-3 text-start">תעודת זהות</th>
                <th className="p-3 text-start">שכבה</th>
                <th className="p-3 text-start">כיתה</th>
                <th className="p-3 text-start">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="p-3">{s.full_name}</td>
                  <td className="p-3 tnum" dir="ltr">
                    {formatIdNumber(s.id_number)}
                  </td>
                  <td className="p-3">{s.grade}</td>
                  <td className="p-3">{s.class_id}</td>
                  <td className="p-3">
                    {s.is_active ? (
                      <span className="text-success">פעיל</span>
                    ) : (
                      <span className="text-text-subtle">לא פעיל</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
