import { MessageCircle, HardDrive, Bot, FileCode2, Database, LayoutDashboard, ArrowRight, FileText } from "lucide-react";
import { useStore } from "@/store";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

const STAGES = [
  { icon: MessageCircle, label: "Fuentes", sub: "WhatsApp · notas · Excel · Gmail · Calendar", estado: "semi", color: "var(--amber)" },
  { icon: HardDrive, label: "Drive / carpeta", sub: "Captura cruda", estado: "futuro", color: "var(--muted)" },
  { icon: Bot, label: "Codex / agente", sub: "Extracción + normalización", estado: "activo", color: "var(--brand)" },
  { icon: FileCode2, label: "Obsidian vault", sub: "00_CEO_Intelligence (8 archivos)", estado: "activo", color: "var(--emerald)" },
  { icon: Database, label: "ETL → JSON", sub: "parse_vault.py · 18 entidades", estado: "activo", color: "var(--emerald)" },
  { icon: LayoutDashboard, label: "Dashboard", sub: "Briefing · feedback · decisiones", estado: "activo", color: "var(--violet)" },
];

const EST = { activo: { t: "Activo", c: "var(--emerald)" }, semi: { t: "Semi-manual", c: "var(--amber)" }, futuro: { t: "Por automatizar", c: "var(--muted)" } } as const;

export default function ContextPipeline(_: ViewProps) {
  const { bundle } = useStore();
  if (!bundle) return null;

  return (
    <>
      <ViewHeader id="context" />
      <Card className="mb-3">
        <SectionTitle title="Flujo de contexto" subtitle="Cómo entra y se convierte la información en decisiones" />
        <div className="flex flex-col lg:flex-row items-stretch gap-2 mt-2">
          {STAGES.map((s, i) => {
            const e = EST[s.estado as keyof typeof EST];
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex-1 rounded-xl border border-[var(--border)] bg-surface-2/40 p-3 h-full">
                  <span className="grid place-items-center h-8 w-8 rounded-lg mb-2" style={{ background: `color-mix(in oklch, ${s.color} 14%, transparent)`, color: s.color }}><Icon size={16} /></span>
                  <div className="text-sm font-semibold leading-tight">{s.label}</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-snug">{s.sub}</div>
                  <div className="mt-2"><Badge color={e.c}>{e.t}</Badge></div>
                </div>
                {i < STAGES.length - 1 && <ArrowRight size={16} className="text-muted shrink-0 hidden lg:block" />}
              </div>
            );
          })}
        </div>
      </Card>

      <Grid cols={2}>
        <Card>
          <SectionTitle icon={FileText} title="Fuentes procesadas" subtitle={`${bundle.fuentes.length} archivos del último corte`} />
          <div className="space-y-1 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
            {bundle.fuentes.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-xs py-1 border-b border-[var(--border)] last:border-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)] shrink-0" />
                <span className="flex-1 truncate text-fg-2">{f.nombre}</span>
                <Badge color="var(--emerald)">{f.calidad}</Badge>
              </div>
            ))}
            {bundle.fuentes.length === 0 && <p className="text-xs text-muted py-4">Sin fuentes registradas en el log.</p>}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Próxima evolución" subtitle="Hacia el pipeline automático" />
          <ol className="space-y-2 text-sm">
            {[
              "WhatsApp → carpeta/Drive automatizada (webhook).",
              "Agente extractor normaliza a Markdown del vault.",
              "ETL corre cada 3h o on-demand ('Actualiza mi dashboard').",
              "Dashboard recalcula scores, deltas y briefing.",
              "Alertas P0 a WhatsApp/Gmail del CEO.",
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="grid place-items-center h-5 w-5 rounded-full bg-surface-2 text-[11px] font-semibold text-fg-2 shrink-0">{i + 1}</span>
                <span className="text-fg-2">{t}</span>
              </li>
            ))}
          </ol>
        </Card>
      </Grid>
    </>
  );
}
