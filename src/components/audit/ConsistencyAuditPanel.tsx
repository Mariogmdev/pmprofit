import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExcelExport } from '@/hooks/useExcelExport';
import { auditDashboardMetrics, auditStatements, summarizeAudit, AuditCheck } from '@/lib/consistencyAudit';
import { CheckCircle2, XCircle } from 'lucide-react';

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('es-CO', { maximumFractionDigits: 2 }) : '—');

/**
 * Internal consistency audit. Not linked anywhere in the UI:
 * opened only by adding ?auditoria=1 to the URL.
 */
export const ConsistencyAuditPanel = () => {
  const [open, setOpen] = useState(true);
  const [onlyFailed, setOnlyFailed] = useState(true);
  const { metrics, buildStatements } = useExcelExport();

  const checks = useMemo<AuditCheck[]>(() => {
    if (metrics.loading) return [];
    const list = auditDashboardMetrics(metrics);
    try {
      const st = buildStatements();
      if (st) list.push(...auditStatements(metrics, st.pl, st.balance));
    } catch (e) {
      console.error('Audit statements error', e);
    }
    return list;
  }, [metrics, buildStatements]);

  const { total, failed } = summarizeAudit(checks);
  const visible = onlyFailed ? checks.filter((c) => !c.ok) : checks;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Auditoría interna de congruencia</SheetTitle>
          <SheetDescription>
            {metrics.loading ? 'Calculando…' : `${total - failed} de ${total} verificaciones OK. Tolerancia: $1.000.`}
          </SheetDescription>
        </SheetHeader>
        <div className="my-3 flex items-center gap-2">
          <Badge variant={failed ? 'destructive' : 'default'}>{failed ? `${failed} diferencias` : 'Modelo congruente'}</Badge>
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setOnlyFailed((v) => !v)}>
            {onlyFailed ? 'Ver todas' : 'Ver solo diferencias'}
          </button>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)] pr-3">
          <ul className="space-y-2">
            {visible.map((c) => (
              <li key={c.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  {c.label}
                </div>
                <p className="mt-1 text-muted-foreground">{c.detail}</p>
                {!c.ok && (
                  <p className="mt-1 font-mono">
                    esperado {fmt(c.expected)} · actual {fmt(c.actual)} · dif {fmt(c.diff)}
                  </p>
                )}
              </li>
            ))}
            {visible.length === 0 && !metrics.loading && <li className="text-sm text-muted-foreground">Sin diferencias.</li>}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
