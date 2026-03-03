import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { translations, type Lang, type Translations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Play, Globe, ArrowRight, TrendingUp, Building2,
  BarChart3, FileSpreadsheet, Zap, Shield, ChevronRight,
} from 'lucide-react';

// ============================================================
// HOOK: Custom Cursor
// ============================================================
function useCustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX - 6 + 'px';
        cursorRef.current.style.top = e.clientY - 6 + 'px';
      }
      if (followerRef.current) {
        followerRef.current.style.left = e.clientX - 18 + 'px';
        followerRef.current.style.top = e.clientY - 18 + 'px';
      }
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return { cursorRef, followerRef };
}

// ============================================================
// HOOK: Mouse Tracking (parallax por sección)
// ============================================================
function useMouseTracking() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return pos;
}

// ============================================================
// HOOK: Contador animado con IntersectionObserver
// ============================================================
function useCountUp(target: number, duration = 2000, decimals = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = eased * target;
      setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));
      if (frame >= totalFrames) { clearInterval(timer); setCount(target); }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration, decimals]);

  return { count, ref };
}

// ============================================================
// HOOK: Typewriter
// ============================================================
function useTypewriter(text: string, speed = 50, delay = 0) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timeout = setTimeout(() => {
      const timer = setInterval(() => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i));
          i++;
        } else {
          clearInterval(timer);
        }
      }, speed);
    }, delay);
    return () => clearTimeout(timeout);
  }, [started, text, speed, delay]);

  return { displayed, ref };
}

// ============================================================
// HOOK: Scroll Y
// ============================================================
function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrollY;
}

// ============================================================
// COMPONENTE: Partículas flotantes (canvas)
// ============================================================
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; lime: boolean;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        lime: Math.random() > 0.7,
      });
    }

    let animFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200, 246, 0, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.lime
          ? `rgba(200, 246, 0, ${p.opacity})`
          : `rgba(255, 255, 255, ${p.opacity * 0.4})`;
        ctx.fill();
      });

      animFrame = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}

// ============================================================
// COMPONENTE: Línea diagonal animada
// ============================================================
function DiagonalLine({ scrollY }: { scrollY: number }) {
  const progress = Math.min(scrollY / 400, 1);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <line
          x1="0" y1="900" x2="1440" y2="0"
          stroke="#c8f600"
          strokeWidth="2"
          strokeDasharray="2000"
          strokeDashoffset={2000 - 2000 * Math.min((1 - progress) * 1.5, 1)}
          opacity={0.3}
        />
        <line
          x1="40" y1="900" x2="1480" y2="0"
          stroke="#c8f600"
          strokeWidth="0.5"
          strokeDasharray="2000"
          strokeDashoffset={2000 - 2000 * Math.min((1 - progress) * 1.2, 1)}
          opacity={0.1}
        />
        <circle
          cx={720 + progress * 200}
          cy={450 - progress * 200}
          r="4"
          fill="#c8f600"
          opacity={0.6}
          style={{ filter: 'blur(1px)', animation: 'glowPulse 2s infinite' }}
        />
      </svg>
    </div>
  );
}

// ============================================================
// NAVBAR
// ============================================================
function NavBar({ t, lang, setLang, user }: { t: Translations; lang: Lang; setLang: (l: Lang) => void; user: unknown }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(13, 31, 45, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(200,246,0,0.08)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <img src="/profit-icon.svg" alt="ProFit" className="h-8 w-auto" />
            <span
              className="text-xl font-black tracking-tight"
              style={{ color: '#c8f600', fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', letterSpacing: '1px' }}
            >
              ProFit
            </span>
          </div>
          <div className="flex items-center gap-1 ml-10">
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>powered by</span>
            <a
              href="https://padelmundial.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200"
              style={{ color: 'rgba(200,246,0,0.55)', fontSize: '10px', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8f600')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,246,0,0.55)')}
            >
              Pádel Mundial ↗
            </a>
          </div>
        </div>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: t.nav.features, href: '#features' },
            { label: t.nav.pricing, href: '#metrics' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs tracking-widest uppercase transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8f600')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all duration-200"
            style={{ border: '1px solid rgba(200,246,0,0.25)', color: '#c8f600', background: 'transparent' }}
          >
            <Globe className="w-3 h-3" />
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="bg-[#c8f600] text-[#0d1f2d] hover:bg-[#b8e600] font-semibold text-xs">
                {t.nav.dashboard}
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white text-xs">
                  {t.nav.login}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-[#c8f600] text-[#0d1f2d] hover:bg-[#b8e600] font-semibold text-xs">
                  {t.nav.cta}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection({ t, user, mouse, scrollY }: { t: Translations; user: unknown; mouse: { x: number; y: number }; scrollY: number }) {
  const { displayed: typeText, ref: typeRef } = useTypewriter(t.hero.subtitle, 25, 1200);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: '#0d1f2d' }}>
      <ParticleField />
      <DiagonalLine scrollY={scrollY} />

      {/* Glow que sigue al mouse */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,246,0,0.06) 0%, transparent 70%)',
          left: `calc(50% + ${mouse.x * 150}px - 300px)`,
          top: `calc(50% + ${mouse.y * 150}px - 300px)`,
          transition: 'left 0.3s ease, top 0.3s ease',
          zIndex: 2,
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ marginTop: '-40px' }}>
        {/* Badge */}
        <div
          className="reveal-up inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10"
          style={{
            background: 'rgba(200,246,0,0.06)',
            border: '1px solid rgba(200,246,0,0.15)',
            color: '#c8f600',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          🏟 {t.hero.badge}
        </div>

        {/* H1 — DM Serif Display */}
        <h1 className="reveal-up reveal-up-delay-1" style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 0.95, marginBottom: '32px' }}>
          <span
            className="block"
            style={{
              fontSize: 'clamp(48px, 10vw, 110px)',
              color: '#f5f5f5',
              letterSpacing: '-1px',
              transform: `translate(${mouse.x * 5}px, ${mouse.y * 3}px)`,
              transition: 'transform 0.3s ease',
            }}
          >
            {t.hero.h1_line1}
          </span>
          <span
            className="block"
            style={{
              fontSize: 'clamp(48px, 10vw, 110px)',
              color: '#c8f600',
              letterSpacing: '-1px',
              transform: `translate(${mouse.x * 8}px, ${mouse.y * 5}px)`,
              transition: 'transform 0.3s ease',
            }}
          >
            {t.hero.h1_line2}
          </span>
        </h1>

        {/* Subtítulo typewriter */}
        <div
          ref={typeRef}
          className="reveal-up reveal-up-delay-2 max-w-2xl mx-auto mb-12"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px',
            color: 'rgba(245,245,245,0.6)',
            lineHeight: 1.6,
            minHeight: '56px',
          }}
        >
          {typeText}
          <span className="inline-block w-[2px] h-[1em] ml-1 align-middle" style={{ background: '#c8f600', animation: 'fadeIn 0.5s ease infinite alternate' }}>
          </span>
        </div>

        {/* CTAs */}
        <div className="reveal-up reveal-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link to={user ? '/dashboard' : '/register'}>
            <Button
              size="lg"
              className="text-base px-8 py-6 font-semibold transition-all duration-300"
              style={{
                background: '#c8f600',
                color: '#0d1f2d',
                boxShadow: '0 0 30px rgba(200,246,0,0.35)',
                animation: 'glowPulse 3s ease infinite',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 50px rgba(200,246,0,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(200,246,0,0.35)'; }}
            >
              {t.hero.cta_primary}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="text-base px-8 py-6 font-semibold transition-all duration-200"
            style={{
              borderColor: 'rgba(200,246,0,0.35)',
              color: '#c8f600',
              background: 'transparent',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,246,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Play className="w-4 h-4 mr-1" />
            {t.hero.cta_secondary}
          </Button>
        </div>

        {/* Social proof */}
        <div className="reveal-up reveal-up-delay-4 flex flex-wrap justify-center gap-3">
          {[t.hero.proof1, t.hero.proof2, t.hero.proof3].map((proof, i) => (
            <span
              key={i}
              className="text-xs px-4 py-2 rounded-full"
              style={{
                color: 'rgba(245,245,245,0.5)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {proof}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <span style={{ color: 'rgba(200,246,0,0.4)', fontSize: '10px', letterSpacing: '3px', fontFamily: "'DM Sans', sans-serif" }}>
          Scroll
        </span>
        <div className="w-[1px] h-8 relative overflow-hidden" style={{ background: 'rgba(200,246,0,0.1)' }}>
          <div
            className="absolute w-full h-3"
            style={{
              background: 'linear-gradient(180deg, #c8f600, transparent)',
              animation: 'scrollDrop 1.5s ease infinite',
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MÉTRICAS — Scoreboard atlético
// ============================================================
function MetricsSection({ t }: { t: Translations }) {
  const tir = useCountUp(19.9, 2500, 1);
  const van = useCountUp(946, 3000, 0);

  return (
    <section id="metrics" className="relative py-24 overflow-hidden" style={{ background: '#071520' }}>
      {/* Línea decorativa horizontal */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,246,0,0.25), transparent)' }} />

      <div className="max-w-5xl mx-auto px-6">
        <p
          className="text-center text-sm mb-14"
          style={{ color: 'rgba(245,245,245,0.4)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '2px' }}
        >
          {t.metrics.title} —{' '}
          <span style={{ color: '#c8f600' }}>{t.metrics.subtitle}</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          {/* TIR */}
          <div
            ref={tir.ref}
            className="group relative text-center py-12 px-8 transition-all duration-300"
            style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '72px', color: '#c8f600', lineHeight: 1 }}>
              {tir.count}%
            </p>
            <p className="mt-3 font-medium text-sm" style={{ color: 'rgba(245,245,245,0.8)', fontFamily: "'DM Sans', sans-serif" }}>
              {t.metrics.m1_label}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'rgba(245,245,245,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
              {t.metrics.m1_sub}
            </p>
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" style={{ background: '#c8f600' }} />
          </div>

          {/* VAN */}
          <div
            ref={van.ref}
            className="group relative text-center py-12 px-8 transition-all duration-300"
            style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '72px', color: '#c8f600', lineHeight: 1 }}>
              ${van.count}M
            </p>
            <p className="mt-3 font-medium text-sm" style={{ color: 'rgba(245,245,245,0.8)', fontFamily: "'DM Sans', sans-serif" }}>
              {t.metrics.m2_label}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'rgba(245,245,245,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
              {t.metrics.m2_sub}
            </p>
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" style={{ background: '#c8f600' }} />
          </div>

          {/* Tiempo */}
          <div className="group relative text-center py-12 px-8 transition-all duration-300">
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '72px', color: '#c8f600', lineHeight: 1 }}>
              {t.metrics.m3_value}
            </p>
            <p className="mt-3 font-medium text-sm" style={{ color: 'rgba(245,245,245,0.8)', fontFamily: "'DM Sans', sans-serif" }}>
              {t.metrics.m3_label}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'rgba(245,245,245,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
              {t.metrics.m3_sub}
            </p>
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" style={{ background: '#c8f600' }} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,246,0,0.25), transparent)' }} />
    </section>
  );
}

// ============================================================
// CÓMO FUNCIONA — Steps editorial
// ============================================================
function HowItWorksSection({ t }: { t: Translations }) {
  return (
    <section className="py-24" style={{ background: '#0d1f2d' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16">
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: '#f5f5f5',
              letterSpacing: '2px',
            }}
          >
            {t.how.title}
          </h2>
          <p
            className="mt-2"
            style={{ color: 'rgba(245,245,245,0.4)', fontFamily: "'DM Serif Display', serif", fontSize: '18px' }}
          >
            {t.how.subtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-6">
          {/* Línea conectora */}
          <div
            className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px]"
            style={{ background: 'linear-gradient(90deg, rgba(200,246,0,0.15), rgba(200,246,0,0.3), rgba(200,246,0,0.15))' }}
          />

          {[
            { num: '01', title: t.how.step1_title, desc: t.how.step1_desc },
            { num: '02', title: t.how.step2_title, desc: t.how.step2_desc },
            { num: '03', title: t.how.step3_title, desc: t.how.step3_desc },
          ].map((step, i) => (
            <div
              key={step.num}
              className="group relative p-8 rounded-none transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(61,127,163,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(200,246,0,0.25)';
                e.currentTarget.style.background = 'rgba(200,246,0,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(61,127,163,0.2)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <span
                className="block mb-4 transition-colors duration-300"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '64px', color: 'rgba(200,246,0,0.15)', lineHeight: 1 }}
              >
                {step.num}
              </span>
              <h3
                className="mb-3 font-semibold"
                style={{ color: '#f5f5f5', fontFamily: "'DM Sans', sans-serif", fontSize: '18px' }}
              >
                {step.title}
              </h3>
              <p
                className="leading-relaxed text-sm"
                style={{ color: 'rgba(245,245,245,0.45)', fontFamily: "'DM Sans', sans-serif" }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES — Grid oscuro con hover glow
// ============================================================
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
    <section id="features" className="py-24" style={{ background: '#071520' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end justify-between mb-14">
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: '#f5f5f5',
              letterSpacing: '2px',
            }}
          >
            {t.features.title}
          </h2>
          <span
            className="hidden sm:block mb-2"
            style={{ color: 'rgba(200,246,0,0.4)', fontFamily: "'DM Serif Display', serif", fontSize: '14px' }}
          >
            6 módulos →
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[1px]" style={{ background: 'rgba(61,127,163,0.15)' }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="p-8 transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(200,246,0,0.06)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(200,246,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="w-10 h-10 rounded-none flex items-center justify-center mb-5"
                style={{ border: '1px solid rgba(200,246,0,0.2)', background: 'rgba(200,246,0,0.05)' }}
              >
                <f.icon className="w-5 h-5" style={{ color: '#c8f600' }} />
              </div>
              <h3
                className="mb-2 font-semibold"
                style={{ color: '#f5f5f5', fontFamily: "'DM Sans', sans-serif", fontSize: '16px' }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(245,245,245,0.4)', fontFamily: "'DM Sans', sans-serif" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CTA FINAL
// ============================================================
function CTASection({ t, user }: { t: Translations; user: unknown }) {
  return (
    <section className="relative py-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #3d7fa3 0%, #2d6085 50%, #1a3a52 100%)' }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(200,246,0,0.15) 0%, transparent 70%)' }}
        />
      </div>

      {/* Diagonal decorativa */}
      <div
        className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(200,246,0,0.03) 100%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2
          className="mb-6"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(36px, 6vw, 64px)',
            color: '#f5f5f5',
            letterSpacing: '2px',
            lineHeight: 1,
          }}
        >
          {t.cta.title}
        </h2>
        <p
          className="mb-10 max-w-lg mx-auto"
          style={{ color: 'rgba(245,245,245,0.5)', fontFamily: "'DM Serif Display', serif", fontSize: '18px', lineHeight: 1.6 }}
        >
          {t.cta.subtitle}
        </p>

        <Link to={user ? '/dashboard' : '/register'}>
          <Button
            size="lg"
            className="text-base px-10 py-6 font-semibold transition-all duration-300"
            style={{
              background: '#c8f600',
              color: '#0d1f2d',
              boxShadow: '0 0 60px rgba(200,246,0,0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 80px rgba(200,246,0,0.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 60px rgba(200,246,0,0.4)'; }}
          >
            {t.cta.button}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <p className="mt-5 text-xs" style={{ color: 'rgba(245,245,245,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
          {t.cta.note}
        </p>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function FooterSection({ t }: { t: Translations }) {
  return (
    <footer style={{ background: '#071520', borderTop: '1px solid rgba(61,127,163,0.15)' }} className="py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/profit-icon.svg" alt="ProFit" className="h-5 w-auto" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm" style={{ color: '#c8f600', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
              ProFit
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>
              by{' '}
              <a
                href="https://padelmundial.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200"
                style={{ color: 'rgba(200,246,0,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c8f600')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,246,0,0.5)')}
              >
                Pádel Mundial ↗
              </a>
            </span>
          </div>
          <span className="text-xs ml-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.footer.rights}</span>
        </div>

        <div className="flex items-center gap-6">
          {[
            { label: t.footer.terms, href: '/terms' },
            { label: t.footer.privacy, href: '/privacy' },
            { label: t.footer.contact, href: '/contact' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8f600')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function LandingPage() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>('es');
  const t = translations[lang];
  const { cursorRef, followerRef } = useCustomCursor();
  const mouse = useMouseTracking();
  const scrollY = useScrollY();

  return (
    <div className="landing-page min-h-screen" style={{ background: '#0d1f2d', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Custom cursor (hidden on mobile) */}
      <div ref={cursorRef} className="custom-cursor hidden md:block" />
      <div ref={followerRef} className="custom-cursor-follower hidden md:block" />

      <NavBar t={t} lang={lang} setLang={setLang} user={user} />
      <HeroSection t={t} user={user} mouse={mouse} scrollY={scrollY} />
      <MetricsSection t={t} />
      <HowItWorksSection t={t} />
      <FeaturesSection t={t} />
      <CTASection t={t} user={user} />
      <FooterSection t={t} />
    </div>
  );
}
