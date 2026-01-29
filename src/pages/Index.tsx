import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, BarChart3, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Padel Mundial</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Ir al Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Modelado Financiero Profesional
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Modela tu negocio deportivo con{' '}
            <span className="text-primary">precisión</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La plataforma más completa para crear modelos financieros de clubes
            deportivos, canchas de pádel, gimnasios y más. Proyecta ingresos,
            analiza costos y toma decisiones informadas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2">
              <Link to={user ? '/dashboard' : '/register'}>
                Comenzar Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Análisis Financiero</h3>
            <p className="text-muted-foreground">
              Calcula VAN, TIR, payback y más métricas clave para evaluar la
              viabilidad de tu proyecto.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Múltiples Actividades</h3>
            <p className="text-muted-foreground">
              Modela pádel, tenis, fútbol, gimnasios, restaurantes y todos los
              servicios de tu club.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Proyecciones Precisas</h3>
            <p className="text-muted-foreground">
              Genera proyecciones a 3, 5, 7 o 10 años con ajustes por inflación
              y estacionalidad.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para modelar tu negocio?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Únete a cientos de empresarios que ya confían en Padel Mundial para
            planificar sus inversiones deportivas.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link to={user ? '/dashboard' : '/register'}>
              Crear Mi Primer Proyecto
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="w-4 h-4" />
            <span className="text-sm">
              © 2024 Padel Mundial. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
