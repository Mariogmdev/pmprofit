import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { translations, type Lang, type Translations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  BarChart3, ArrowRight, Zap, Shield,
  FileSpreadsheet, TrendingUp, Building2, Globe,
} from 'lucide-react';

/* ───────── count-up hook ───────── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = Math.round(duration / 16);
    const id = setInterval(() => {
      frame++;
      const p = 1 - Math.pow(1 - frame / total, 3);
      setCount(Math.floor(p * target));
      if (frame >= total) { setCount(target); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [started, target, duration]);

  return { count, ref };
}

/* ───────── NAV ───────── */
function NavBar({
  t, lang, setLang, user,
}: {
  t: Translations;
  lang: Lang;
  setLang: (l: Lang) => void;
  user: unknown;
}) {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* logo */}
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg"
                 style={{ background: '#c8f600', color: '#1a1a1a' }}>
              P
            </div>
            <span className="text-xl font-black tracking-tight"
                  style={{ color: '#c8f600' }}>
              ProFit
            </span>
          </div>
          <div className="flex items-center gap-1 ml-10">
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>powered by</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', fontWeight: 600 }}>
              Pádel Mundial
            </span>
          </div>
        </div>

        {/* centre links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.features}</a>
          <a href="#metrics" className="text-sm text-white/70 hover:text-white transition-colors">{t.nav.pricing}</a>
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 text-xs font-medium transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          {user ? (
            <Button asChild size="sm" className="bg-[#c8f600] text-[#0f172a] hover:bg-[#b8e600] font-semibold">
              <Link to="/dashboard">{t.nav.dashboard}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-white/80 hover:text-white hidden sm:inline-flex">
                <Link to="/login">{t.nav.login}</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#c8f600] text-[#0f172a] hover:bg-[#b8e600] font-semibold">
                <Link to="/register">{t.nav.cta}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ───────── HERO ───────── */
function HeroSection({ t, user }: { t: Translations; user: unknown }) {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#1a3a52] to-[#3d7fa3]">
      {/* decorative circles */}
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-[#c8f600]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full bg-[#3d7fa3]/30 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#c8f600] text-sm font-medium backdrop-blur-sm border border-white/10 mb-8">
          {t.hero.badge}
        </span>

        <h1 className="font-['DM_Serif_Display',serif] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-6">
          {t.hero.h1_line1}
          <br />
          <span className="text-[#c8f600]">{t.hero.h1_line2}</span>
        </h1>

        <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-10 font-['DM_Sans',sans-serif]">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button asChild size="lg" className="bg-[#c8f600] text-[#0f172a] hover:bg-[#b8e600] font-semibold text-base px-8 h-12">
            <Link to={user ? '/dashboard' : '/register'}>{t.hero.cta_primary}</Link>
          </Button>
          <Button variant="outline" size="lg"
            style={{ borderColor: '#c8f600', color: '#c8f600', background: 'transparent' }}
            className="text-base px-8 h-12 hover:opacity-80 font-semibold">
            {t.hero.cta_secondary}
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[t.hero.proof1, t.hero.proof2, t.hero.proof3].map((p, i) => (
            <span key={i} className="text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── METRICS ───────── */
function MetricsSection({ t }: { t: Translations }) {
  const tir = useCountUp(199, 2000);
  const van = useCountUp(946, 2500);

  return (
    <section id="metrics" className="py-20 bg-[#0f172a]">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-center text-white/60 text-sm mb-10 font-['DM_Sans',sans-serif]">
          {t.metrics.title}{' '}
          <span className="text-[#c8f600]">{t.metrics.subtitle}</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* TIR */}
          <div ref={tir.ref} className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
            <p className="text-4xl sm:text-5xl font-bold text-[#c8f600] font-['DM_Serif_Display',serif]">
              {(tir.count / 10).toFixed(1)}%
            </p>
            <p className="text-white/80 font-medium mt-2">{t.metrics.m1_label}</p>
            <p className="text-white/50 text-xs mt-1">{t.metrics.m1_sub}</p>
          </div>

          {/* VAN */}
          <div ref={van.ref} className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
            <p className="text-4xl sm:text-5xl font-bold text-[#c8f600] font-['DM_Serif_Display',serif]">
              ${van.count}M
            </p>
            <p className="text-white/80 font-medium mt-2">{t.metrics.m2_label}</p>
            <p className="text-white/50 text-xs mt-1">{t.metrics.m2_sub}</p>
          </div>

          {/* Tiempo */}
          <div className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
            <p className="text-4xl sm:text-5xl font-bold text-[#c8f600] font-['DM_Serif_Display',serif]">
              {t.metrics.m3_value}
            </p>
            <p className="text-white/80 font-medium mt-2">{t.metrics.m3_label}</p>
            <p className="text-white/50 text-xs mt-1">{t.metrics.m3_sub}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── HOW IT WORKS ───────── */
function HowItWorksSection({ t }: { t: Translations }) {
  const steps = [
    { num: '01', title: t.how.step1_title, desc: t.how.step1_desc, icon: Building2 },
    { num: '02', title: t.how.step2_title, desc: t.how.step2_desc, icon: TrendingUp },
    { num: '03', title: t.how.step3_title, desc: t.how.step3_desc, icon: FileSpreadsheet },
  ];

  return (
    <section className="py-20 bg-[#1a3a52]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-['DM_Serif_Display',serif] text-white mb-3">{t.how.title}</h2>
          <p className="text-white/60 font-['DM_Sans',sans-serif]">{t.how.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="relative bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-[#c8f600]/30 transition-colors group">
              <span className="text-[#c8f600]/30 text-6xl font-bold absolute top-4 right-6 font-['DM_Serif_Display',serif] group-hover:text-[#c8f600]/50 transition-colors">
                {s.num}
              </span>
              <div className="w-12 h-12 rounded-xl bg-[#c8f600]/10 flex items-center justify-center mb-5">
                <s.icon className="w-6 h-6 text-[#c8f600]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-['DM_Sans',sans-serif]">{s.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed font-['DM_Sans',sans-serif]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FEATURES ───────── */
function FeaturesSection({ t }: { t: Translations }) {
  const features = [
    { icon: TrendingUp, title: t.features.f1_title, desc: t.features.f1_desc },
    { icon: Building2, title: t.features.f2_title, desc: t.features.f2_desc },
    { icon: BarChart3, title: t.features.f3_title, desc: t.features.f3_desc },
    { icon: FileSpreadsheet, title: t.features.f4_title, desc: t.features.f4_desc },
    { icon: Zap, title: t.features.f5_title, desc: t.features.f5_desc },
    { icon: Shield, title: t.features.f6_title, desc: t.features.f6_desc },
  ];

  return (
    <section id="features" className="py-20 bg-[#0f172a]">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-['DM_Serif_Display',serif] text-white text-center mb-14">
          {t.features.title}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-[#c8f600]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#c8f600]/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#c8f600]" />
              </div>
              <h3 className="text-white font-semibold mb-1 font-['DM_Sans',sans-serif]">{f.title}</h3>
              <p className="text-white/60 text-sm font-['DM_Sans',sans-serif]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── CTA ───────── */
function CTASection({ t, user }: { t: Translations; user: unknown }) {
  return (
    <section className="py-20 bg-gradient-to-b from-[#3d7fa3] to-[#1a3a52]">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-['DM_Serif_Display',serif] text-white mb-4">
          {t.cta.title}
        </h2>
        <p className="text-white/70 mb-8 font-['DM_Sans',sans-serif]">{t.cta.subtitle}</p>
        <Button asChild size="lg" className="bg-[#c8f600] text-[#0f172a] hover:bg-[#b8e600] font-semibold text-base px-8 h-12">
          <Link to={user ? '/dashboard' : '/register'}>{t.cta.button}</Link>
        </Button>
        <p className="text-white/50 text-xs mt-4 font-['DM_Sans',sans-serif]">{t.cta.note}</p>
      </div>
    </section>
  );
}

/* ───────── FOOTER ───────── */
function FooterSection({ t }: { t: Translations }) {
  return (
    <footer className="bg-[#0f172a] border-t border-white/10 py-8">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-sm"
                 style={{ background: '#c8f600', color: '#1a1a1a' }}>
              P
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm" style={{ color: '#c8f600' }}>ProFit</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>by Pádel Mundial</span>
            </div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }} className="text-xs">{t.footer.rights}</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/50">
          <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
          <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
          <a href="#" className="hover:text-white transition-colors">{t.footer.contact}</a>
        </div>
      </div>
    </footer>
  );
}

/* ───────── PAGE ───────── */
export default function LandingPage() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>('es');
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0f172a] font-['DM_Sans',sans-serif]">
      <NavBar t={t} lang={lang} setLang={setLang} user={user} />
      <HeroSection t={t} user={user} />
      <MetricsSection t={t} />
      <HowItWorksSection t={t} />
      <FeaturesSection t={t} />
      <CTASection t={t} user={user} />
      <FooterSection t={t} />
    </div>
  );
}
