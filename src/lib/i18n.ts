export type Lang = 'es' | 'en';

interface NavStrings { features: string; pricing: string; login: string; cta: string; dashboard: string; }
interface HeroStrings { badge: string; h1_line1: string; h1_line2: string; subtitle: string; cta_primary: string; cta_secondary: string; proof1: string; proof2: string; proof3: string; }
interface MetricsStrings { title: string; subtitle: string; m1_label: string; m1_sub: string; m2_label: string; m2_sub: string; m3_value: string; m3_label: string; m3_sub: string; }
interface HowStrings { title: string; subtitle: string; step1_title: string; step1_desc: string; step2_title: string; step2_desc: string; step3_title: string; step3_desc: string; }
interface FeaturesStrings { title: string; f1_title: string; f1_desc: string; f2_title: string; f2_desc: string; f3_title: string; f3_desc: string; f4_title: string; f4_desc: string; f5_title: string; f5_desc: string; f6_title: string; f6_desc: string; }
interface CtaStrings { title: string; subtitle: string; button: string; note: string; }
interface FooterStrings { rights: string; terms: string; privacy: string; contact: string; }

export interface Translations {
  nav: NavStrings; hero: HeroStrings; metrics: MetricsStrings; how: HowStrings;
  features: FeaturesStrings; cta: CtaStrings; footer: FooterStrings; poweredBy: string;
}

export const translations: Record<Lang, Translations> = {
  es: {
    nav: {
      features: 'Características',
      pricing: 'Precios',
      login: 'Iniciar Sesión',
      cta: 'Comenzar Gratis',
      dashboard: 'Ir al Dashboard',
    },
    hero: {
      badge: '🏟️ Especializado en sportstainment',
      h1_line1: 'Del Excel al pitch deck',
      h1_line2: 'en 15 minutos',
      subtitle: 'ProFit calcula TIR, VAN y payback de tu club deportivo automáticamente. Genera reportes que impresionan inversionistas.',
      cta_primary: 'Crear Proyecto Gratis →',
      cta_secondary: 'Ver Demo',
      proof1: '✓ Proyectos validados con inversionistas reales',
      proof2: '✓ TIR calculada en segundos',
      proof3: '✓ Export Excel + PDF profesional',
    },
    metrics: {
      title: 'Números reales de proyectos reales.',
      subtitle: 'Sin plantillas genéricas.',
      m1_label: 'TIR real',
      m1_sub: 'UniCIEO validado',
      m2_label: 'VAN positivo',
      m2_sub: 'UniCIEO validado',
      m3_value: '< 15 min',
      m3_label: 'por modelo',
      m3_sub: 'promedio',
    },
    how: {
      title: 'Cómo funciona',
      subtitle: '3 pasos para tu modelo financiero',
      step1_title: 'Configura tu club',
      step1_desc: 'Agrega actividades: pádel, gimnasio, F&B, coworking. Cada una con su propio modelo de ingresos.',
      step2_title: 'ProFit calcula todo',
      step2_desc: 'TIR, VAN, EBITDA, Flujo de Caja, Balance. Motor verificado contra Python y Excel.',
      step3_title: 'Exporta y presenta',
      step3_desc: 'Excel con fórmulas nativas + PDF pitch deck de 7 slides. Listo para inversionistas.',
    },
    features: {
      title: 'Todo para convencer inversionistas',
      f1_title: 'Análisis Completo',
      f1_desc: 'TIR, VAN, Payback, MOIC, EBITDA, DCF',
      f2_title: 'Multi-actividad',
      f2_desc: 'Pádel, Tenis, Gym, F&B, Coworking, Spa',
      f3_title: 'Análisis de Sensibilidad',
      f3_desc: 'Escenarios optimista / base / pesimista',
      f4_title: 'Export Profesional',
      f4_desc: 'Excel con fórmulas + PDF pitch deck 7 slides',
      f5_title: 'Tiempo Real',
      f5_desc: 'Recalcula al instante sin esperas',
      f6_title: 'Datos Seguros',
      f6_desc: 'Auth + RLS, privacidad garantizada',
    },
    cta: {
      title: 'Tu próximo proyecto, modelado en minutos',
      subtitle: 'Únete a desarrolladores que ya usan ProFit para presentar proyectos a fondos de inversión.',
      button: 'Crear Mi Proyecto Gratis →',
      note: 'Sin tarjeta de crédito · Cancela cuando quieras',
    },
    footer: {
      rights: '© 2025 Pádel Mundial. Todos los derechos reservados.',
      terms: 'Términos',
      privacy: 'Privacidad',
      contact: 'Contacto',
    },
    poweredBy: 'powered by',
  },
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      login: 'Log In',
      cta: 'Start Free',
      dashboard: 'Go to Dashboard',
    },
    hero: {
      badge: '🏟️ Built for sportstainment',
      h1_line1: 'From spreadsheet to pitch deck',
      h1_line2: 'in 15 minutes',
      subtitle: 'ProFit automatically calculates IRR, NPV and payback for your sports club. Generate reports that impress investors.',
      cta_primary: 'Create Free Project →',
      cta_secondary: 'Watch Demo',
      proof1: '✓ Projects validated with real investors',
      proof2: '✓ IRR calculated in seconds',
      proof3: '✓ Professional Excel + PDF export',
    },
    metrics: {
      title: 'Real numbers from real projects.',
      subtitle: 'No generic templates.',
      m1_label: 'Real IRR',
      m1_sub: 'UniCIEO validated',
      m2_label: 'Positive NPV',
      m2_sub: 'UniCIEO validated',
      m3_value: '< 15 min',
      m3_label: 'per model',
      m3_sub: 'average',
    },
    how: {
      title: 'How it works',
      subtitle: '3 steps to your financial model',
      step1_title: 'Configure your club',
      step1_desc: 'Add activities: padel, gym, F&B, coworking. Each with its own revenue model.',
      step2_title: 'ProFit calculates everything',
      step2_desc: 'IRR, NPV, EBITDA, Cash Flow, Balance Sheet. Engine verified against Python and Excel.',
      step3_title: 'Export and present',
      step3_desc: 'Excel with native formulas + 7-slide PDF pitch deck. Ready for investors.',
    },
    features: {
      title: 'Everything to convince investors',
      f1_title: 'Complete Analysis',
      f1_desc: 'IRR, NPV, Payback, MOIC, EBITDA, DCF',
      f2_title: 'Multi-activity',
      f2_desc: 'Padel, Tennis, Gym, F&B, Coworking, Spa',
      f3_title: 'Sensitivity Analysis',
      f3_desc: 'Optimistic / base / pessimistic scenarios',
      f4_title: 'Professional Export',
      f4_desc: 'Excel with formulas + 7-slide PDF pitch deck',
      f5_title: 'Real-time',
      f5_desc: 'Recalculates instantly with no waiting',
      f6_title: 'Secure Data',
      f6_desc: 'Auth + RLS, guaranteed privacy',
    },
    cta: {
      title: 'Your next project, modeled in minutes',
      subtitle: 'Join developers already using ProFit to present projects to investment funds.',
      button: 'Create My Free Project →',
      note: 'No credit card required · Cancel anytime',
    },
    footer: {
      rights: '© 2025 Pádel Mundial. All rights reserved.',
      terms: 'Terms',
      privacy: 'Privacy',
      contact: 'Contact',
    },
    poweredBy: 'powered by',
  },
} as const;

export function useTranslations(lang: Lang) {
  return translations[lang];
}
