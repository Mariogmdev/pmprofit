// Types for Project Activities (Constructor)

export interface ActivitySchedule {
  id: string;
  inicio: number;
  fin: number;
  nombre: string;
  tarifa: number;
  tipo: 'pico' | 'valle';
  ocupacion: number;
  diaSemana: 'LV' | 'SD';
}

export interface ActivityRental {
  id: string;
  item: string;
  porcentaje: number;
  precio: number;
}

export interface ActivityConsumable {
  id: string;
  item: string;
  cantidad: number;
  precioUnitario: number;
}

export interface ActivityStaff {
  id: string;
  cargo: string;
  cantidad: number;
  salarioMensual: number;
}

export interface ActivityMaintenance {
  id: string;
  item: string;
  costoAnual: number;
}

export interface OccupationYear {
  ano: number;
  pico: number;
  valle: number;
}

export type RevenueModel = 'reserva' | 'membresia' | 'pase-diario' | 'mixto';
export type CoverType = 'cubierta' | 'semicubierta' | 'aire-libre';

export interface ActivityConfig {
  // Basic configuration
  cantidad: number;
  tipoUnidad: string;
  areaPorUnidad: number;
  
  // Revenue model
  modeloIngreso: RevenueModel;
  duracionReserva: number;
  jugadoresPorReserva: number;
  
  // Schedules and rates
  horarios: ActivitySchedule[];
  
  // Occupation projection
  ocupacionAnual: OccupationYear[];
  crecimientoAutomatico: boolean;
  tasaCrecimiento: number;
  
  // Complementary income
  alquileres: ActivityRental[];
  tieneClases: boolean;
  configuracionClases?: {
    clasesPorDia: number;
    precioClase: number;
    descuento: number;
  };
  
  // CAPEX
  tipoCubierta: CoverType;
  capexCubierta: number;
  capexSemicubierta: number;
  capexAireLibre: number;
  consumibles: ActivityConsumable[];
  mobiliario: ActivityConsumable[];
  
  // OPEX
  personal: ActivityStaff[];
  mantenimiento: ActivityMaintenance[];
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  module_id?: string;
  name: string;
  icon: string;
  config: ActivityConfig;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

export interface ActivityCalculations {
  // Schedule summary
  totalHorasPico: number;
  totalHorasValle: number;
  porcentajePico: number;
  porcentajeValle: number;
  tarifaPromedio: number;
  ocupacionPromedio: number;
  turnosPorDia: number;
  
  // Income
  ingresosMensualesAno1: number;
  ingresosHorarios: number;
  ingresosComplementarios: number;
  totalUsuariosMes: number;
  
  // CAPEX
  capexInfraestructura: number;
  capexConsumibles: number;
  capexMobiliario: number;
  capexTotal: number;
  
  // OPEX
  opexPersonal: number;
  opexMantenimiento: number;
  opexReposicion: number;
  opexMensual: number;
  
  // Metrics
  margen: number;
  margenPorcentaje: number;
  payback: number;
}

// Default values for new activities
export const DEFAULT_ACTIVITY_CONFIG: ActivityConfig = {
  cantidad: 1,
  tipoUnidad: 'Unidad',
  areaPorUnidad: 0,
  modeloIngreso: 'reserva',
  duracionReserva: 1.5,
  jugadoresPorReserva: 4,
  horarios: [],
  ocupacionAnual: [
    { ano: 1, pico: 60, valle: 30 },
    { ano: 2, pico: 70, valle: 40 },
    { ano: 3, pico: 80, valle: 50 },
    { ano: 4, pico: 85, valle: 60 },
    { ano: 5, pico: 90, valle: 70 },
  ],
  crecimientoAutomatico: false,
  tasaCrecimiento: 15,
  alquileres: [],
  tieneClases: false,
  tipoCubierta: 'cubierta',
  capexCubierta: 0,
  capexSemicubierta: 0,
  capexAireLibre: 0,
  consumibles: [],
  mobiliario: [],
  personal: [],
  mantenimiento: [],
};

// Helper to generate unique IDs
export const generateId = () => crypto.randomUUID();
