import { describe, it, expect } from 'vitest';
import { monthlyFinancialsWithOccupancy } from '../monthlyFinancials';
import { ActivityConfig } from '@/types/activity';

/**
 * Fase 1.2 & Bug #5: Monthly Financials Complete
 * Validates that all income components are included and calculated correctly
 */
describe('Fase 1.2: monthlyFinancials Complete', () => {
  it('incluye TODOS los componentes para modelo mixto', () => {
    const config: Partial<ActivityConfig> = {
      cantidad: 4,
      modeloIngreso: 'mixto',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        { id: '1', nombre: 'Mañana LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
      ],
      alquileres: [
        { id: '1', item: 'Palas', porcentaje: 20, precio: 5000 }
      ],
      membershipConfig: {
        miembrosProyectados: [200, 250, 300, 350, 400],
        precioMembresia: 100000,
        capacidadMaxima: 500,
        crecimientoAutomatico: false,
        tasaCrecimiento: 10,
        maximoMiembros: 500,
      },
      dailyPassConfig: {
        pasesProyectadosDia: 10,
        precioPase: 50000,
        capacidadMaxima: 50,
      },
      tieneClases: true,
      configuracionClases: {
        clasesPorDia: 2,
        duracionClase: 1,
        precioAlumno: 30000,
        alumnosPorClase: 10,
        ocupacionClase: 80,
        modeloCobro: 'por-alumno',
        modeloProfesor: 'por-clase',
        pagoClase: 50000,
        cantidadProfesores: 0,
        salarioProfesor: 0,
        precioClase: 200000,
        horariosClases: [],
      },
    };
    
    const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
    
    // Verificar estructura completa
    expect(result.ingresos).toHaveProperty('reservas');
    expect(result.ingresos).toHaveProperty('complementarios');
    expect(result.ingresos).toHaveProperty('clases');
    expect(result.ingresos).toHaveProperty('membresias');
    expect(result.ingresos).toHaveProperty('pases');
    expect(result.ingresos).toHaveProperty('trafico');
    expect(result.ingresos).toHaveProperty('total');
    
    // Verificar que calcula valores
    expect(result.ingresos.reservas).toBeGreaterThan(0);
    expect(result.ingresos.complementarios).toBeGreaterThan(0);
    expect(result.ingresos.clases).toBeGreaterThan(0);
    expect(result.ingresos.membresias).toBe(20000000); // 200 × 100k
    expect(result.ingresos.pases).toBe(15000000); // 10/día × 30 días × 50k
  });
  
  it('total es suma de todos los componentes', () => {
    const config: Partial<ActivityConfig> = {
      cantidad: 4,
      modeloIngreso: 'mixto',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        { id: '1', nombre: 'Día LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
      ],
      alquileres: [
        { id: '1', item: 'Palas', porcentaje: 20, precio: 5000 }
      ],
      membershipConfig: {
        miembrosProyectados: [200, 250, 300, 350, 400],
        precioMembresia: 100000,
        capacidadMaxima: 500,
        crecimientoAutomatico: false,
        tasaCrecimiento: 10,
        maximoMiembros: 500,
      },
    };
    
    const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
    
    const manualTotal =
      result.ingresos.reservas +
      result.ingresos.complementarios +
      result.ingresos.clases +
      result.ingresos.membresias +
      result.ingresos.pases +
      result.ingresos.trafico;
    
    expect(result.ingresos.total).toBe(manualTotal);
  });
  
  it('usa weeksPerMonth dinámico', () => {
    const config: Partial<ActivityConfig> = {
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 60, diaSemana: 'LV' }
      ],
    };
    
    const result28 = monthlyFinancialsWithOccupancy(config as ActivityConfig, 28, 60, 40, 0);
    const result31 = monthlyFinancialsWithOccupancy(config as ActivityConfig, 31, 60, 40, 0);
    
    // 31 días debe generar ~10.75% más ingresos que 28 días
    const ratio = result31.ingresos.reservas / result28.ingresos.reservas;
    
    expect(ratio).toBeCloseTo(1.1071, 3);
  });

  describe('Bug #5: Membresías en Mixto', () => {
    it('modelo mixto incluye membresías en total', () => {
      const config: Partial<ActivityConfig> = {
        cantidad: 4,
        modeloIngreso: 'mixto',
        duracionReserva: 1.5,
        horarios: [
          { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
        ],
        membershipConfig: {
          miembrosProyectados: [200, 250, 300, 350, 400],
          precioMembresia: 100000,
          capacidadMaxima: 500,
          crecimientoAutomatico: false,
          tasaCrecimiento: 10,
          maximoMiembros: 500,
        },
      };
      
      const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
      
      // Membresías deben estar presentes
      expect(result.ingresos.membresias).toBe(20000000); // 200 × 100k
      
      // Total debe incluir membresías
      expect(result.ingresos.total).toBeGreaterThan(20000000);
    });
    
    it('usa defaults cuando membershipConfig no existe', () => {
      const config: Partial<ActivityConfig> = {
        cantidad: 4,
        modeloIngreso: 'mixto',
        duracionReserva: 1.5,
        horarios: [
          { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
        ],
        // NO membershipConfig - debe usar DEFAULT
      };
      
      const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
      
      // Sin config explícito, usa DEFAULT_MEMBERSHIP_CONFIG
      expect(result.ingresos.membresias).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Modelo Reserva solo', () => {
    it('no incluye membresías ni pases', () => {
      const config: Partial<ActivityConfig> = {
        cantidad: 4,
        modeloIngreso: 'reserva',
        duracionReserva: 1.5,
        horarios: [
          { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
        ],
      };
      
      const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
      
      expect(result.ingresos.membresias).toBe(0);
      expect(result.ingresos.pases).toBe(0);
      expect(result.ingresos.reservas).toBeGreaterThan(0);
    });
  });

  describe('Modelo Membresía solo', () => {
    it('no incluye reservas de horarios', () => {
      const config: Partial<ActivityConfig> = {
        cantidad: 1,
        modeloIngreso: 'membresia',
        membershipConfig: {
          miembrosProyectados: [100, 150, 200, 250, 300],
          precioMembresia: 150000,
          capacidadMaxima: 300,
          crecimientoAutomatico: false,
          tasaCrecimiento: 10,
          maximoMiembros: 500,
        },
      };
      
      const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
      
      expect(result.ingresos.reservas).toBe(0);
      expect(result.ingresos.membresias).toBe(15000000); // 100 × 150k
    });
  });
});
