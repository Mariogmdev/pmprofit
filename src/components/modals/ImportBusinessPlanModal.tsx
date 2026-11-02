import { useRef, useState } from 'react';
import { FileUp, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { CURRENCIES, CurrencyCode } from '@/types';
import { Json } from '@/integrations/supabase/types';
import {
  BusinessPlanDraft,
  SERVICE_CATEGORIES,
  draftActivityToConfig,
  draftToOpexRow,
  extractTextFromFile,
} from '@/lib/businessPlanImport';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'analyzing' | 'review' | 'creating';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
const MODEL_LABEL: Record<string, string> = {
  reserva: 'Reservas', membresia: 'Membresía', 'pase-diario': 'Pase diario', trafico: 'Tráfico / F&B',
};

export default function ImportBusinessPlanModal({ open, onOpenChange }: Props) {
  const { createProject } = useProject();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BusinessPlanDraft | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<boolean[]>([]);
  const [truncated, setTruncated] = useState(false);

  const reset = () => {
    setStep('upload'); setError(null); setDraft(null); setName(''); setSelected([]); setTruncated(false);
  };

  const handleClose = (o: boolean) => {
    if (step === 'analyzing' || step === 'creating') return;
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setStep('analyzing');
    try {
      setStatus('Leyendo el documento…');
      const text = await extractTextFromFile(file);
      if (text.replace(/\s/g, '').length < 50) {
        throw new Error('No se encontró texto en el archivo. Si es un PDF escaneado, exporta una versión con texto.');
      }
      setStatus('Analizando supuestos con IA (puede tardar hasta un minuto)…');
      const { data, error: fnError } = await supabase.functions.invoke('extract-business-plan', {
        body: { text, fileName: file.name },
      });
      if (fnError) {
        let msg = 'No se pudo analizar el documento.';
        try { msg = (await fnError.context.json()).error || msg; } catch { /* keep default */ }
        throw new Error(msg);
      }
      const d = data.draft as BusinessPlanDraft;
      setDraft(d);
      setTruncated(!!data.truncated);
      setName(d.project.name || file.name.replace(/\.[^.]+$/, ''));
      setSelected(d.activities.map(() => true));
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
      setStep('upload');
    }
  };

  const handleCreate = async () => {
    if (!draft || !name.trim()) return;
    setStep('creating');
    try {
      const p = draft.project;
      const currency = (p.currency && p.currency in CURRENCIES ? p.currency : 'COP') as Exclude<CurrencyCode, 'CUSTOM'>;
      const project = await createProject({
        name: name.trim(),
        location: p.location || undefined,
        currency,
        currency_symbol: CURRENCIES[currency].symbol,
        ...(p.opening_hour != null && { opening_hour: p.opening_hour }),
        ...(p.closing_hour != null && { closing_hour: p.closing_hour }),
        ...(p.days_per_month != null && { days_per_month: Math.round(p.days_per_month) }),
        ...(p.discount_rate != null && { discount_rate: p.discount_rate }),
        ...(p.inflation_rate != null && { inflation_rate: p.inflation_rate }),
        ...(p.projection_years != null && { projection_years: Math.round(p.projection_years) }),
      });
      if (!project) throw new Error('No se pudo crear el proyecto');

      const acts = draft.activities.filter((_, i) => selected[i]);
      if (acts.length) {
        const { error: aErr } = await supabase.from('project_activities').insert(
          acts.map((a, i) => ({
            project_id: project.id,
            name: a.name,
            quantity: Math.round(a.cantidad || 1),
            config: draftActivityToConfig(a) as unknown as Json,
            order_index: i,
          })),
        );
        if (aErr) throw aErr;
      }

      const { error: oErr } = await supabase
        .from('project_opex')
        .insert({ project_id: project.id, ...(draftToOpexRow(draft.opex) as unknown as Record<string, Json>) } as any);
      if (oErr) throw oErr;

      if (draft.capex_obra_civil_total && draft.capex_obra_civil_total > 0) {
        await supabase.from('obra_civil').insert({
          project_id: project.id,
          capex_construccion: draft.capex_obra_civil_total,
          capex_obra_civil_total: draft.capex_obra_civil_total,
        } as any);
      }

      toast({ title: 'Borrador creado', description: `"${project.name}" se creó desde el plan de negocio. Revisa y ajusta los valores.` });
      reset();
      onOpenChange(false);
      // Reload so all sections pick up the imported data
      setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando el proyecto');
      setStep('review');
    }
  };

  const opexLines = draft
    ? [
        ...draft.opex.nomina_administrativa.map((n) => ({ label: `${n.cargo} (x${n.cantidad})`, value: n.salarioMensual * n.cantidad, cat: 'Nómina admin.' })),
        ...draft.opex.nomina_operativa.map((n) => ({ label: `${n.cargo} (x${n.cantidad})`, value: n.salarioMensual * n.cantidad, cat: 'Nómina operativa' })),
        ...SERVICE_CATEGORIES.flatMap((c) => draft.opex[c].map((s) => ({ label: s.concepto, value: s.costoMensual, cat: c.replace(/_/g, ' ') }))),
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Importar plan de negocio</DialogTitle>
          <DialogDescription>
            Sube un PDF o Excel. La IA extrae los supuestos operativos y crea un proyecto borrador que podrás ajustar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {error && (
            <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {step === 'upload' && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary p-10 flex flex-col items-center gap-3 text-muted-foreground transition-colors"
            >
              <FileUp className="w-10 h-10" />
              <span className="font-medium text-foreground">Selecciona el plan de negocio</span>
              <span className="text-xs">PDF, XLSX, XLS o CSV</span>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.xlsm,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleFile(f); }}
              />
            </button>
          )}

          {(step === 'analyzing' || step === 'creating') && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm">{step === 'creating' ? 'Creando proyecto…' : status}</span>
            </div>
          )}

          {step === 'review' && draft && (
            <>
              {truncated && (
                <p className="text-xs text-muted-foreground">El documento es muy largo; solo se analizó la primera parte.</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="bp-name">Nombre del proyecto</Label>
                <Input id="bp-name" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {draft.project.location && <Badge variant="secondary">{draft.project.location}</Badge>}
                  {draft.project.currency && <Badge variant="secondary">{draft.project.currency}</Badge>}
                  {draft.project.opening_hour != null && draft.project.closing_hour != null && (
                    <Badge variant="secondary">{draft.project.opening_hour}h – {draft.project.closing_hour}h</Badge>
                  )}
                  {draft.project.discount_rate != null && <Badge variant="secondary">Tasa desc. {draft.project.discount_rate}%</Badge>}
                  {draft.capex_obra_civil_total != null && <Badge variant="secondary">Obra civil ${fmt(draft.capex_obra_civil_total)}</Badge>}
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold">Actividades ({draft.activities.length})</h4>
                {draft.activities.length === 0 && <p className="text-sm text-muted-foreground">No se identificaron actividades.</p>}
                {draft.activities.map((a, i) => (
                  <label key={i} className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer">
                    <Checkbox
                      checked={selected[i]}
                      onCheckedChange={(v) => setSelected((s) => s.map((x, j) => (j === i ? !!v : x)))}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{a.name}</span>
                        <Badge variant="outline">{MODEL_LABEL[a.modeloIngreso]}</Badge>
                        {a.cantidad != null && <span className="text-xs text-muted-foreground">x{a.cantidad}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.horarios.length > 0 && `${a.horarios.length} franjas horarias · `}
                        {a.precioMembresia != null && `Membresía $${fmt(a.precioMembresia)} · `}
                        {a.ticketPromedio != null && `Ticket $${fmt(a.ticketPromedio)} · `}
                        {a.capexPorUnidad != null && `CAPEX/u $${fmt(a.capexPorUnidad)} · `}
                        {a.fuente}
                      </p>
                    </div>
                  </label>
                ))}
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold">OPEX mensual ({opexLines.length} partidas)</h4>
                <p className="text-xs text-muted-foreground">
                  Arrendamiento: {draft.opex.arrendamiento_modelo}
                  {draft.opex.arrendamiento_fijo ? ` · fijo $${fmt(draft.opex.arrendamiento_fijo)}` : ''}
                  {draft.opex.arrendamiento_variable_porcentaje ? ` · ${draft.opex.arrendamiento_variable_porcentaje}% ventas` : ''}
                </p>
                {opexLines.length > 0 && (
                  <div className="rounded-md border border-border divide-y divide-border text-sm">
                    {opexLines.map((l, i) => (
                      <div key={i} className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="truncate"><span className="text-muted-foreground capitalize">{l.cat}:</span> {l.label}</span>
                        <span className="font-mono shrink-0">${fmt(l.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {draft.notas.length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Notas y supuestos no mapeados</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {draft.notas.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={reset}>Subir otro archivo</Button>
              <Button onClick={handleCreate} disabled={!name.trim()}>Crear proyecto borrador</Button>
            </>
          )}
          {step === 'upload' && <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
