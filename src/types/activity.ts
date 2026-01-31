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

// Monthly occupation for detailed Year 1 projection
export interface OccupationMonth {
  mes: number;
  pico: number;
  valle: number;
}

export type RevenueModel = 'reserva' | 'membresia' | 'pase-diario' | 'mixto' | 'trafico';
export type CoverType = 'cubierta' | 'semicubierta' | 'aire-libre';
export type ClassPaymentModel = 'por-alumno' | 'por-clase';
export type TeacherPaymentModel = 'fijo' | 'por-clase';
export type TrafficOperationModel = 'propia' | 'concesion';

// Complete classes configuration
export interface ClassesConfig {
  clasesPorDia: number;
  duracionClase: number; // hours
  alumnosPorClase: number;
  modeloCobro: ClassPaymentModel;
  precioAlumno: number;
  ocupacionClase: number; // percentage
  precioClase: number;
  modeloProfesor: TeacherPaymentModel;
  salarioProfesor: number;
  cantidadProfesores: number;
  pagoClase: number;
  horariosClases: string[]; // IDs of schedules used for classes
}

// Membership model config
export interface MembershipConfig {
  precioMembresia: number;
  capacidadMaxima: number;
  miembrosProyectados: number[];  // 5 years projection
  crecimientoAutomatico: boolean;
  tasaCrecimiento: number;
  maximoMiembros: number;
}

// Daily pass model config
export interface DailyPassConfig {
  precioPase: number;
  capacidadMaxima: number;
  pasesProyectadosDia: number;
}

// Traffic model config (F&B, retail)
export interface TrafficConfig {
  porcentajeUsuariosClub: number;
  visitantesExternosDia: number;
  ticketPromedio: number;
  consumosPorPersona: number;
  modeloOperacion: TrafficOperationModel;
  costoVentas: number; // percentage
  comisionConcesion: number; // percentage
  ventasOperador: number;
}

export interface ActivityConfig {
  // Basic configuration
  cantidad: number;
  tipoUnidad: string;
  areaPorUnidad: number;
  
  // Revenue model
  modeloIngreso: RevenueModel;
  duracionReserva: number;
  jugadoresPorReserva: number;
  
  // Membership/Pass configs (for non-reservation models)
  membershipConfig?: MembershipConfig;
  dailyPassConfig?: DailyPassConfig;
  trafficConfig?: TrafficConfig;
  
  // Schedules and rates (only for reservation model)
  horarios: ActivitySchedule[];
  
  // Occupation projection
  ocupacionAnual: OccupationYear[];
  ocupacionMensual?: OccupationMonth[]; // Detailed month-by-month for Year 1
  modoOcupacion: 'anual' | 'mensual';
  crecimientoAutomatico: boolean;
  tasaCrecimiento: number;
  
  // Complementary income
  alquileres: ActivityRental[];
  tieneClases: boolean;
  configuracionClases?: ClassesConfig;
  
  // CAPEX - Activity construction + equipment
  tipoCubierta: CoverType;  // Construction type for this activity
  capexCubierta: number;     // Cost per unit for covered construction
  capexSemicubierta: number; // Cost per unit for semi-covered
  capexAireLibre: number;    // Cost per unit for open-air
  equipamientoEspecifico: ActivityConsumable[]; // Additional equipment beyond basic construction
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
  ocupacionPromedioPico: number;   // Weighted average of PICO schedules only
  ocupacionPromedioValle: number;  // Weighted average of VALLE schedules only
  turnosPorDia: number;
  ocupacionTarget?: number;        // Target occupancy based on schedule types
  
  // Income
  ingresosMensualesAno1: number;
  ingresosHorarios: number;
  ingresosComplementarios: number;
  ingresosClases: number;
  ingresosMembresiasPases: number;
  ingresosTrafico: number;
  totalUsuariosMes: number;
  
  // CAPEX (Activity construction + equipment)
  capexConstruccion: number;  // Construction of this activity
  capexEquipamiento: number;  // Activity-specific equipment
  capexConsumibles: number;
  capexMobiliario: number;
  capexTotal: number;
  
  // OPEX
  opexPersonal: number;
  opexMantenimiento: number;
  opexReposicion: number;
  opexProfesores: number;
  opexCostoVentas: number;
  opexMensual: number;
  
  // Metrics
  margen: number;
  margenPorcentaje: number;
  payback: number;
}

// Default monthly occupation for Year 1
const DEFAULT_MONTHLY_OCCUPATION: OccupationMonth[] = [
  { mes: 1, pico: 40, valle: 20 },
  { mes: 2, pico: 45, valle: 22 },
  { mes: 3, pico: 50, valle: 25 },
  { mes: 4, pico: 55, valle: 28 },
  { mes: 5, pico: 60, valle: 30 },
  { mes: 6, pico: 65, valle: 35 },
  { mes: 7, pico: 68, valle: 38 },
  { mes: 8, pico: 70, valle: 40 },
  { mes: 9, pico: 72, valle: 42 },
  { mes: 10, pico: 75, valle: 45 },
  { mes: 11, pico: 78, valle: 48 },
  { mes: 12, pico: 80, valle: 50 },
];

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
  ocupacionMensual: DEFAULT_MONTHLY_OCCUPATION,
  modoOcupacion: 'anual',
  crecimientoAutomatico: false,
  tasaCrecimiento: 15,
  alquileres: [],
  tieneClases: false,
  // CAPEX - Construction + equipment for this activity
  tipoCubierta: 'cubierta',
  capexCubierta: 0,
  capexSemicubierta: 0,
  capexAireLibre: 0,
  equipamientoEspecifico: [],
  consumibles: [],
  mobiliario: [],
  personal: [],
  mantenimiento: [],
};

// Default classes configuration
export const DEFAULT_CLASSES_CONFIG: ClassesConfig = {
  clasesPorDia: 4,
  duracionClase: 1,
  alumnosPorClase: 8,
  modeloCobro: 'por-alumno',
  precioAlumno: 30000,
  ocupacionClase: 80,
  precioClase: 200000,
  modeloProfesor: 'fijo',
  salarioProfesor: 3000000,
  cantidadProfesores: 2,
  pagoClase: 50000,
  horariosClases: [],
};

// Default membership config
export const DEFAULT_MEMBERSHIP_CONFIG: MembershipConfig = {
  precioMembresia: 200000,
  capacidadMaxima: 50,
  miembrosProyectados: [150, 200, 250, 280, 300],
  crecimientoAutomatico: false,
  tasaCrecimiento: 15,
  maximoMiembros: 500,
};

// Default daily pass config
export const DEFAULT_DAILY_PASS_CONFIG: DailyPassConfig = {
  precioPase: 50000,
  capacidadMaxima: 50,
  pasesProyectadosDia: 30,
};

// Default traffic config
export const DEFAULT_TRAFFIC_CONFIG: TrafficConfig = {
  porcentajeUsuariosClub: 40,
  visitantesExternosDia: 15,
  ticketPromedio: 35000,
  consumosPorPersona: 1.2,
  modeloOperacion: 'propia',
  costoVentas: 40,
  comisionConcesion: 20,
  ventasOperador: 150000000,
};

// Helper to generate unique IDs
export const generateId = () => crypto.randomUUID();
