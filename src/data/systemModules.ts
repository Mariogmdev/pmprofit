import { ModuleDefaultConfig, ModuleCategory, ModuleType } from '@/types';

export interface SystemModuleData {
  name: string;
  category: ModuleCategory;
  type: ModuleType;
  icon: string;
  description: string;
  default_config: ModuleDefaultConfig;
  is_public: boolean;
  is_system: boolean;
  usage_count: number;
}

export const SYSTEM_MODULES: SystemModuleData[] = [
  // DEPORTES RAQUETA
  {
    name: 'Pádel Estándar',
    category: 'deportes-raqueta',
    type: 'actividad',
    icon: '🎾',
    description: 'Configuración estándar para canchas de pádel',
    default_config: {
      cantidad: 4,
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      tipoCubierta: 'cubierta',
      capexCubierta: 200000000,
      capexSemicubierta: 150000000,
      capexAireLibre: 120000000,
      horarios: [
        { inicio: 6, fin: 8, nombre: 'Madrugada', tarifa: 120000, tipo: 'pico' },
        { inicio: 8, fin: 12, nombre: 'Mañana', tarifa: 90000, tipo: 'valle' },
        { inicio: 12, fin: 14, nombre: 'Mediodía', tarifa: 80000, tipo: 'valle' },
        { inicio: 14, fin: 18, nombre: 'Tarde', tarifa: 90000, tipo: 'valle' },
        { inicio: 18, fin: 22, nombre: 'Noche', tarifa: 140000, tipo: 'pico' }
      ],
      ocupacionMes1: { pico: 60, valle: 30 },
      alquileres: [
        { item: 'Palas', porcentaje: 50, precio: 10000 },
        { item: 'Bolas', porcentaje: 10, precio: 25000 }
      ]
    },
    is_public: true,
    is_system: true,
    usage_count: 247
  },
  {
    name: 'Pádel Premium',
    category: 'deportes-raqueta',
    type: 'actividad',
    icon: '🎾',
    description: 'Configuración premium con tarifas más altas',
    default_config: {
      cantidad: 6,
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      tipoCubierta: 'cubierta',
      capexCubierta: 280000000,
      capexSemicubierta: 220000000,
      capexAireLibre: 180000000,
      horarios: [
        { inicio: 6, fin: 8, nombre: 'Madrugada', tarifa: 180000, tipo: 'pico' },
        { inicio: 8, fin: 12, nombre: 'Mañana', tarifa: 120000, tipo: 'valle' },
        { inicio: 12, fin: 14, nombre: 'Mediodía', tarifa: 100000, tipo: 'valle' },
        { inicio: 14, fin: 18, nombre: 'Tarde', tarifa: 120000, tipo: 'valle' },
        { inicio: 18, fin: 22, nombre: 'Noche', tarifa: 200000, tipo: 'pico' }
      ],
      ocupacionMes1: { pico: 70, valle: 40 },
      alquileres: [
        { item: 'Palas Premium', porcentaje: 60, precio: 15000 },
        { item: 'Bolas', porcentaje: 15, precio: 30000 }
      ]
    },
    is_public: true,
    is_system: true,
    usage_count: 89
  },
  {
    name: 'Tenis',
    category: 'deportes-raqueta',
    type: 'actividad',
    icon: '🎾',
    description: 'Canchas de tenis estándar',
    default_config: {
      cantidad: 2,
      duracionReserva: 1.5,
      jugadoresPorReserva: 2,
      tipoCubierta: 'cubierta',
      capexCubierta: 250000000,
      capexSemicubierta: 180000000,
      capexAireLibre: 120000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 100000, tipo: 'pico' }
      ],
      ocupacionMes1: { pico: 55, valle: 40 },
      alquileres: [
        { item: 'Raquetas', porcentaje: 30, precio: 15000 }
      ]
    },
    is_public: true,
    is_system: true,
    usage_count: 156
  },
  {
    name: 'Pickleball',
    category: 'deportes-raqueta',
    type: 'actividad',
    icon: '🏸',
    description: 'Canchas de pickleball',
    default_config: {
      cantidad: 2,
      duracionReserva: 1,
      jugadoresPorReserva: 4,
      tipoCubierta: 'cubierta',
      capexCubierta: 80000000,
      capexSemicubierta: 60000000,
      capexAireLibre: 40000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 60000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 60, valle: 45 }
    },
    is_public: true,
    is_system: true,
    usage_count: 78
  },
  {
    name: 'Squash',
    category: 'deportes-raqueta',
    type: 'actividad',
    icon: '🎾',
    description: 'Canchas de squash indoor',
    default_config: {
      cantidad: 2,
      duracionReserva: 1,
      jugadoresPorReserva: 2,
      tipoCubierta: 'cubierta',
      capexCubierta: 150000000,
      capexSemicubierta: 150000000,
      capexAireLibre: 150000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 80000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 50, valle: 35 }
    },
    is_public: true,
    is_system: true,
    usage_count: 45
  },
  // DEPORTES COLECTIVOS
  {
    name: 'Fútbol 5',
    category: 'deportes-colectivos',
    type: 'actividad',
    icon: '⚽',
    description: 'Canchas de fútbol 5',
    default_config: {
      cantidad: 2,
      duracionReserva: 1,
      jugadoresPorReserva: 10,
      tipoCubierta: 'cubierta',
      capexCubierta: 140000000,
      capexSemicubierta: 100000000,
      capexAireLibre: 80000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 150000, tipo: 'pico' }
      ],
      ocupacionMes1: { pico: 70, valle: 50 },
      alquileres: [
        { item: 'Balones', porcentaje: 5, precio: 5000 }
      ]
    },
    is_public: true,
    is_system: true,
    usage_count: 189
  },
  {
    name: 'Fútbol 7',
    category: 'deportes-colectivos',
    type: 'actividad',
    icon: '⚽',
    description: 'Canchas de fútbol 7',
    default_config: {
      cantidad: 1,
      duracionReserva: 1.5,
      jugadoresPorReserva: 14,
      tipoCubierta: 'cubierta',
      capexCubierta: 200000000,
      capexSemicubierta: 150000000,
      capexAireLibre: 120000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 200000, tipo: 'pico' }
      ],
      ocupacionMes1: { pico: 75, valle: 55 }
    },
    is_public: true,
    is_system: true,
    usage_count: 92
  },
  {
    name: 'Básquetbol',
    category: 'deportes-colectivos',
    type: 'actividad',
    icon: '🏀',
    description: 'Canchas de básquetbol',
    default_config: {
      cantidad: 1,
      duracionReserva: 1.5,
      jugadoresPorReserva: 10,
      tipoCubierta: 'cubierta',
      capexCubierta: 180000000,
      capexSemicubierta: 140000000,
      capexAireLibre: 100000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 120000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 60, valle: 40 }
    },
    is_public: true,
    is_system: true,
    usage_count: 67
  },
  {
    name: 'Voleibol',
    category: 'deportes-colectivos',
    type: 'actividad',
    icon: '🏐',
    description: 'Canchas de voleibol',
    default_config: {
      cantidad: 1,
      duracionReserva: 1.5,
      jugadoresPorReserva: 12,
      tipoCubierta: 'aire-libre',
      capexCubierta: 120000000,
      capexSemicubierta: 90000000,
      capexAireLibre: 60000000,
      horarios: [
        { inicio: 6, fin: 22, nombre: 'Todo el día', tarifa: 100000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 55, valle: 35 }
    },
    is_public: true,
    is_system: true,
    usage_count: 54
  },
  // FITNESS & WELLNESS
  {
    name: 'Gimnasio Estándar',
    category: 'fitness',
    type: 'espacio',
    icon: '💪',
    description: 'Gimnasio con equipamiento básico',
    default_config: {
      cantidad: 1,
      duracionReserva: 1,
      jugadoresPorReserva: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 300000000,
      capexSemicubierta: 300000000,
      capexAireLibre: 200000000,
      horarios: [
        { inicio: 5, fin: 22, nombre: 'Todo el día', tarifa: 50000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 65, valle: 50 }
    },
    is_public: true,
    is_system: true,
    usage_count: 178
  },
  {
    name: 'CrossFit Box',
    category: 'fitness',
    type: 'espacio',
    icon: '🏋️',
    description: 'Espacio para CrossFit',
    default_config: {
      cantidad: 1,
      duracionReserva: 1,
      jugadoresPorReserva: 15,
      tipoCubierta: 'cubierta',
      capexCubierta: 250000000,
      capexSemicubierta: 200000000,
      capexAireLibre: 150000000,
      horarios: [
        { inicio: 5, fin: 21, nombre: 'Clases', tarifa: 35000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 70, valle: 55 }
    },
    is_public: true,
    is_system: true,
    usage_count: 134
  },
  {
    name: 'Yoga/Pilates',
    category: 'wellness',
    type: 'espacio',
    icon: '🧘',
    description: 'Salas para yoga y pilates',
    default_config: {
      cantidad: 2,
      duracionReserva: 1,
      jugadoresPorReserva: 15,
      tipoCubierta: 'cubierta',
      capexCubierta: 50000000,
      capexSemicubierta: 40000000,
      capexAireLibre: 30000000,
      horarios: [
        { inicio: 6, fin: 21, nombre: 'Clases', tarifa: 25000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 60, valle: 45 },
      alquileres: [
        { item: 'Mat', porcentaje: 30, precio: 5000 }
      ]
    },
    is_public: true,
    is_system: true,
    usage_count: 156
  },
  {
    name: 'Spa/Masajes',
    category: 'wellness',
    type: 'servicio',
    icon: '💆',
    description: 'Cabinas de spa y masajes',
    default_config: {
      cantidad: 4,
      duracionReserva: 1,
      jugadoresPorReserva: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 30000000,
      capexSemicubierta: 30000000,
      capexAireLibre: 30000000,
      horarios: [
        { inicio: 9, fin: 20, nombre: 'Servicio', tarifa: 80000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 55, valle: 40 }
    },
    is_public: true,
    is_system: true,
    usage_count: 89
  },
  {
    name: 'Clases Grupales',
    category: 'fitness',
    type: 'espacio',
    icon: '👥',
    description: 'Salas para clases grupales variadas',
    default_config: {
      cantidad: 3,
      duracionReserva: 1,
      jugadoresPorReserva: 20,
      tipoCubierta: 'cubierta',
      capexCubierta: 60000000,
      capexSemicubierta: 50000000,
      capexAireLibre: 40000000,
      horarios: [
        { inicio: 6, fin: 21, nombre: 'Clases', tarifa: 20000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 70, valle: 55 }
    },
    is_public: true,
    is_system: true,
    usage_count: 145
  },
  // COWORKING
  {
    name: 'Coworking Estándar',
    category: 'coworking',
    type: 'espacio',
    icon: '💼',
    description: 'Espacio de coworking con puestos fijos y flexibles',
    default_config: {
      cantidad: 40,
      duracionReserva: 1,
      jugadoresPorReserva: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 5000000,
      capexSemicubierta: 5000000,
      capexAireLibre: 5000000,
      horarios: [
        { inicio: 8, fin: 20, nombre: 'Horario laboral', tarifa: 15000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 50, valle: 40 }
    },
    is_public: true,
    is_system: true,
    usage_count: 112
  },
  {
    name: 'Coworking Premium',
    category: 'coworking',
    type: 'espacio',
    icon: '💼',
    description: 'Coworking con oficinas privadas y salas de reunión',
    default_config: {
      cantidad: 30,
      duracionReserva: 1,
      jugadoresPorReserva: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 8000000,
      capexSemicubierta: 8000000,
      capexAireLibre: 8000000,
      horarios: [
        { inicio: 7, fin: 21, nombre: 'Horario extendido', tarifa: 25000, tipo: 'valle' }
      ],
      ocupacionMes1: { pico: 60, valle: 50 }
    },
    is_public: true,
    is_system: true,
    usage_count: 78
  },
  // FOOD & BEVERAGE
  {
    name: 'Cafetería',
    category: 'f&b',
    type: 'servicio',
    icon: '☕',
    description: 'Cafetería básica',
    default_config: {
      cantidad: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 40000000,
      capexSemicubierta: 40000000,
      capexAireLibre: 30000000
    },
    is_public: true,
    is_system: true,
    usage_count: 145
  },
  {
    name: 'Restaurante',
    category: 'f&b',
    type: 'servicio',
    icon: '🍽️',
    description: 'Restaurante completo',
    default_config: {
      cantidad: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 120000000,
      capexSemicubierta: 100000000,
      capexAireLibre: 80000000
    },
    is_public: true,
    is_system: true,
    usage_count: 98
  },
  {
    name: 'Sports Bar',
    category: 'f&b',
    type: 'servicio',
    icon: '🍺',
    description: 'Bar deportivo con pantallas',
    default_config: {
      cantidad: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 80000000,
      capexSemicubierta: 70000000,
      capexAireLibre: 60000000
    },
    is_public: true,
    is_system: true,
    usage_count: 67
  },
  // RETAIL
  {
    name: 'Pro Shop',
    category: 'retail',
    type: 'servicio',
    icon: '🛍️',
    description: 'Tienda de artículos deportivos',
    default_config: {
      cantidad: 1,
      tipoCubierta: 'cubierta',
      capexCubierta: 35000000,
      capexSemicubierta: 30000000,
      capexAireLibre: 25000000
    },
    is_public: true,
    is_system: true,
    usage_count: 123
  }
];
