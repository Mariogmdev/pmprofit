# 📊 AUDITORÍA MATEMÁTICA COMPLETA
## Sistema de Modelación Financiera para Proyectos Deportivos

**Fecha:** 2026-02-06  
**Versión:** 1.0  

---

## 📑 Tabla de Contenidos

1. [Arquitectura de Cálculo](#1-arquitectura-de-cálculo)
2. [Cálculos Base por Actividad](#2-cálculos-base-por-actividad)
3. [Cálculos con Ocupación Variable](#3-cálculos-con-ocupación-variable)
4. [OPEX Global y Consolidado](#4-opex-global-y-consolidado)
5. [Agregación y Consolidación](#5-agregación-y-consolidación)
6. [CAPEX Total y Capital de Trabajo](#6-capex-total-y-capital-de-trabajo)
7. [Proyecciones Temporales](#7-proyecciones-temporales)
8. [Indicadores Financieros](#8-indicadores-financieros)
9. [Lógicas Especiales y Edge Cases](#9-lógicas-especiales-y-edge-cases)
10. [Flujo de Datos](#10-flujo-de-datos)
11. [Ejemplo Numérico Completo](#11-ejemplo-numérico-completo)
12. [Glosario de Variables](#12-glosario-de-variables)

---

## 1. Arquitectura de Cálculo

### 1.1 Archivos Fuente Principales

| Archivo | Propósito |
|---------|-----------|
| `src/lib/activityCalculations.ts` | Cálculos base por actividad (100% madurez) |
| `src/lib/monthlyFinancials.ts` | Cálculos mensuales con ocupación variable |
| `src/lib/projectionCalculations.ts` | Curvas de proyección y crecimiento |
| `src/lib/occupancyCalculations.ts` | Ocupación ponderada |
| `src/lib/capexCalculations.ts` | Cálculos de inversión |
| `src/hooks/useDashboardMetrics.ts` | Consolidación para Dashboard |
| `src/hooks/useProjectOpex.ts` | Gestión de OPEX global |
| `src/lib/timeHelpers.ts` | Constantes temporales |

### 1.2 Constantes Globales

**Archivo:** `src/lib/timeHelpers.ts`

```typescript
// Líneas 25-31
export const DAYS_PER_WEEK = 7;
export const WEEKDAYS_LV = 5;  // Lunes - Viernes
export const WEEKDAYS_SD = 2;  // Sábado - Domingo

// Función dinámica
export function getWeeksPerMonth(daysPerMonth: number = 30): number {
  return daysPerMonth / 7;  // Ej: 30/7 = 4.2857
}
```

**Fórmulas Constantes:**
```
SEMANAS_MES = días_por_mes / 7
```

---

## 2. Cálculos Base por Actividad

### 2.1 Capacidad y Horarios

**Archivo:** `src/lib/activityCalculations.ts`  
**Función:** `calculateActivityFinancials()` (Líneas 102-340)

#### 2.1.1 Horas Operativas Semanales

```typescript
// Líneas 139-159
horariosLV.forEach((s) => {
  const hours = Math.max(0, s.fin - s.inicio);
  const weightedHours = hours * WEEKDAYS_LV; // × 5 días
  if (s.tipo === 'pico') {
    totalHorasPico += weightedHours;
  } else {
    totalHorasValle += weightedHours;
  }
  weightedOcupacion += s.ocupacion * weightedHours;
});

horariosSD.forEach((s) => {
  const hours = Math.max(0, s.fin - s.inicio);
  const weightedHours = hours * WEEKDAYS_SD; // × 2 días
  // ... igual lógica
});
```

**Fórmulas:**
```
Horas_Pico_Semana = Σ (fin - inicio) × días_semana × [tipo == 'pico']
Horas_Valle_Semana = Σ (fin - inicio) × días_semana × [tipo == 'valle']

Donde días_semana = 5 para L-V, 2 para S-D
```

#### 2.1.2 Turnos por Día

```typescript
// Líneas 178-196
const turnosDiaLV = horariosLV.reduce((sum, h) => {
  const horas = Math.max(0, h.fin - h.inicio);
  const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
  const turnosDisponibles = turnosPorUnidad * cantidad;
  return sum + turnosDisponibles * (h.ocupacion / 100);
}, 0);
```

**Fórmula:**
```
Turnos_Día_LV = Σ [ (horas_horario / duración_reserva) × cantidad_unidades × (ocupación/100) ]
Turnos_Día_SD = Σ [ (horas_horario / duración_reserva) × cantidad_unidades × (ocupación/100) ]

Turnos_Semana = (Turnos_Día_LV × 5) + (Turnos_Día_SD × 2)
Turnos_Mes = Turnos_Semana × semanas_mes
```

#### 2.1.3 Ocupación Promedio Ponderada

```typescript
// Líneas 259-260
const totalHours = totalHorasPico + totalHorasValle;
const ocupacionPromedio = totalHours > 0 ? weightedOcupacion / totalHours : 0;
```

**Fórmula:**
```
Ocupación_Promedio = Σ(ocupación_i × horas_ponderadas_i) / Σ(horas_ponderadas_i)
```

---

### 2.2 Ingresos por Modelo de Negocio

#### 2.2.1 Modelo RESERVAS (reserva)

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 69-94, 162-174

```typescript
// Función calculateIngresosPorDia (líneas 69-94)
function calculateIngresosPorDia(
  schedules: ActivitySchedule[],
  cantidad: number,
  duracion: number
): { ingresos: number; turnos: number; usuarios: number } {
  let ingresosDia = 0;
  schedules.forEach((horario) => {
    const horas = Math.max(0, horario.fin - horario.inicio);
    const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
    const turnosDisponibles = turnosPorUnidad * cantidad;
    const turnosOcupados = turnosDisponibles * (horario.ocupacion / 100);
    const ingresosHorario = turnosOcupados * horario.tarifa;
    ingresosDia += ingresosHorario;
  });
  return { ingresos: ingresosDia, turnos: turnosTotales, usuarios: 0 };
}
```

**Fórmula Paso a Paso:**

```
1. Turnos_por_unidad = horas_operación / duración_reserva
2. Turnos_disponibles = turnos_por_unidad × cantidad_unidades  
3. Turnos_ocupados = turnos_disponibles × (ocupación / 100)
4. Ingresos_horario = turnos_ocupados × tarifa

Ingresos_Día_LV = Σ (turnos_ocupados × tarifa) para horarios L-V
Ingresos_Día_SD = Σ (turnos_ocupados × tarifa) para horarios S-D

5. Ingresos_Semana = (Ingresos_Día_LV × 5) + (Ingresos_Día_SD × 2)
6. Ingresos_Mes = Ingresos_Semana × semanas_mes
```

**Código:**
```typescript
// Líneas 162-174
const resultLV = calculateIngresosPorDia(horariosLV, cantidad, duracion);
ingresosDiaLV = resultLV.ingresos;

const resultSD = calculateIngresosPorDia(horariosSD, cantidad, duracion);
ingresosDiaSD = resultSD.ingresos;

ingresosSemana = (ingresosDiaLV * WEEKDAYS_LV) + (ingresosDiaSD * WEEKDAYS_SD);

const weeksPerMonth = getWeeksPerMonth(daysPerMonth);
ingresosHorarios = ingresosSemana * weeksPerMonth;
```

#### 2.2.2 Modelo MEMBRESÍA (membresia)

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 205-209

```typescript
if (config.modeloIngreso === 'membresia' || config.modeloIngreso === 'mixto') {
  const membershipConfig = config.membershipConfig || DEFAULT_MEMBERSHIP_CONFIG;
  ingresosMembresiasPases += membershipConfig.miembrosProyectados[0] * membershipConfig.precioMembresia;
  totalUsuariosMes += membershipConfig.miembrosProyectados[0];
}
```

**Fórmula:**
```
Ingresos_Membresía = miembros_proyectados[año_actual] × precio_membresía
Usuarios_Mes += miembros_proyectados[año_actual]
```

**Defaults:** `src/types/activity.ts` líneas 273-280
```typescript
export const DEFAULT_MEMBERSHIP_CONFIG: MembershipConfig = {
  precioMembresia: 200000,
  capacidadMaxima: 50,
  miembrosProyectados: [150, 200, 250, 280, 300], // 5 años
  crecimientoAutomatico: false,
  tasaCrecimiento: 15,
  maximoMiembros: 500,
};
```

#### 2.2.3 Modelo PASES DIARIOS (pase-diario)

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 212-216

```typescript
if (config.modeloIngreso === 'pase-diario' || config.modeloIngreso === 'mixto') {
  const dailyPassConfig = config.dailyPassConfig || DEFAULT_DAILY_PASS_CONFIG;
  ingresosMembresiasPases += dailyPassConfig.pasesProyectadosDia * daysPerMonth * dailyPassConfig.precioPase;
  totalUsuariosMes += dailyPassConfig.pasesProyectadosDia * daysPerMonth;
}
```

**Fórmula:**
```
Ingresos_Pases = pases_por_día × días_mes × precio_pase
Usuarios_Mes += pases_por_día × días_mes
```

**Defaults:** `src/types/activity.ts` líneas 283-287
```typescript
export const DEFAULT_DAILY_PASS_CONFIG: DailyPassConfig = {
  precioPase: 50000,
  capacidadMaxima: 50,
  pasesProyectadosDia: 30,
};
```

#### 2.2.4 Modelo CLASES

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 238-256

```typescript
if (config.tieneClases && config.configuracionClases) {
  const classConfig = config.configuracionClases;
  const clasesMes = classConfig.clasesPorDia * daysPerMonth * cantidad;
  
  if (classConfig.modeloCobro === 'por-alumno') {
    const alumnosReales = classConfig.alumnosPorClase * (classConfig.ocupacionClase / 100);
    ingresosClases = clasesMes * alumnosReales * classConfig.precioAlumno;
  } else {
    ingresosClases = clasesMes * classConfig.precioClase;
  }
  
  // Teacher costs
  if (classConfig.modeloProfesor === 'fijo') {
    opexProfesores = classConfig.cantidadProfesores * classConfig.salarioProfesor;
  } else {
    opexProfesores = clasesMes * classConfig.pagoClase;
  }
}
```

**Fórmulas:**

**Cobro por Alumno:**
```
Clases_Mes = clases_por_día × días_mes × cantidad_unidades
Alumnos_Reales = alumnos_por_clase × (ocupación_clase / 100)
Ingresos_Clases = Clases_Mes × Alumnos_Reales × precio_por_alumno
```

**Cobro por Clase:**
```
Ingresos_Clases = Clases_Mes × precio_por_clase
```

**OPEX Profesores:**
```
Si modelo_profesor == 'fijo':
  OPEX_Profesores = cantidad_profesores × salario_profesor

Si modelo_profesor == 'por-clase':
  OPEX_Profesores = Clases_Mes × pago_por_clase
```

#### 2.2.5 Modelo TRÁFICO (F&B, Retail)

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 219-236

```typescript
if (config.modeloIngreso === 'trafico') {
  const trafficConfig = config.trafficConfig || DEFAULT_TRAFFIC_CONFIG;
  
  // Usuarios del club (de otras actividades)
  const usuariosDeportivos = Math.round(
    totalClubUsersFromOtherActivities * (trafficConfig.porcentajeUsuariosClub / 100)
  );
  const usuariosExternos = trafficConfig.visitantesExternosDia * daysPerMonth;
  const traficoTotal = usuariosDeportivos + usuariosExternos;
  
  if (trafficConfig.modeloOperacion === 'propia') {
    const ingresosBrutos = traficoTotal * trafficConfig.ticketPromedio * trafficConfig.consumosPorPersona;
    opexCostoVentas = ingresosBrutos * (trafficConfig.costoVentas / 100);
    ingresosTrafico = ingresosBrutos - opexCostoVentas;
  } else { // concesion
    ingresosTrafico = trafficConfig.ventasOperador * (trafficConfig.comisionConcesion / 100);
    opexCostoVentas = 0;
  }
  
  totalUsuariosMes += traficoTotal;
}
```

**Fórmulas Operación PROPIA:**
```
Usuarios_Deportivos = Total_Usuarios_Club × (% usuarios_club / 100)
Usuarios_Externos = visitantes_externos_día × días_mes
Tráfico_Total = Usuarios_Deportivos + Usuarios_Externos

Ingresos_Brutos = Tráfico_Total × ticket_promedio × consumos_por_persona
Costo_Ventas = Ingresos_Brutos × (% costo_ventas / 100)
Ingresos_Netos = Ingresos_Brutos - Costo_Ventas
```

**Fórmulas Operación CONCESIÓN:**
```
Ingresos_Netos = ventas_operador × (% comisión / 100)
Costo_Ventas = 0
```

**Defaults:** `src/types/activity.ts` líneas 290-299
```typescript
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
```

#### 2.2.6 Modelo MIXTO

**Archivo:** `src/lib/activityCalculations.ts`

El modelo mixto combina RESERVAS + MEMBRESÍA + PASES:

```typescript
// Línea 130
if (config.modeloIngreso === 'reserva' || config.modeloIngreso === 'mixto') {
  // Calcula ingresos por reserva...
}

// Línea 205
if (config.modeloIngreso === 'membresia' || config.modeloIngreso === 'mixto') {
  // Suma ingresos por membresía...
}

// Línea 212
if (config.modeloIngreso === 'pase-diario' || config.modeloIngreso === 'mixto') {
  // Suma ingresos por pases...
}
```

**Fórmula:**
```
Ingresos_Mixto = Ingresos_Reservas + Ingresos_Membresías + Ingresos_Pases

⚠️ NOTA: Los modelos se SUMAN, no se ponderan por porcentaje.
   NO hay validación de conflicto de capacidad.
   Los usuarios también se suman (posible doble conteo).
```

#### 2.2.7 Ingresos Complementarios (Alquileres)

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 199-201

```typescript
(config.alquileres || []).forEach((a) => {
  ingresosComplementarios += (totalUsuariosMes * (a.porcentaje / 100) * a.precio);
});
```

**Fórmula:**
```
Ingresos_Complementarios = Σ (usuarios_mes × (% adopción / 100) × precio_item)
```

---

### 2.3 CAPEX por Actividad

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 265-287

```typescript
// Construcción según tipo de cubierta
const tipoCubierta = config.tipoCubierta || 'cubierta';
const capexPorUnidad = tipoCubierta === 'cubierta' 
  ? (config.capexCubierta || 0)
  : tipoCubierta === 'semicubierta'
    ? (config.capexSemicubierta || 0)
    : (config.capexAireLibre || 0);

const capexConstruccion = capexPorUnidad * cantidad;

const capexEquipamiento = (config.equipamientoEspecifico || []).reduce(
  (sum, e) => sum + ((e.cantidad || 0) * (e.precioUnitario || 0)), 0
);

const capexConsumibles = (config.consumibles || []).reduce(
  (sum, c) => sum + ((c.cantidad || 0) * (c.precioUnitario || 0)), 0
);

const capexMobiliario = (config.mobiliario || []).reduce(
  (sum, m) => sum + ((m.cantidad || 0) * (m.precioUnitario || 0)), 0
);

const capexTotal = capexConstruccion + capexEquipamiento + capexConsumibles + capexMobiliario;
```

**Fórmulas:**
```
CAPEX_Construcción = costo_por_unidad[tipo_cubierta] × cantidad_unidades

CAPEX_Equipamiento = Σ (cantidad_i × precio_unitario_i)
CAPEX_Consumibles = Σ (cantidad_i × precio_unitario_i)
CAPEX_Mobiliario = Σ (cantidad_i × precio_unitario_i)

CAPEX_Actividad = CAPEX_Construcción + CAPEX_Equipamiento + CAPEX_Consumibles + CAPEX_Mobiliario
```

---

### 2.4 OPEX por Actividad

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 289-302

```typescript
const opexPersonal = (config.personal || []).reduce(
  (sum, p) => sum + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0
);

const opexMantenimientoAnual = (config.mantenimiento || []).reduce(
  (sum, m) => sum + (m.costoAnual || 0), 0
);
const opexMantenimiento = opexMantenimientoAnual / 12;

const opexReposicion = capexConsumibles * 0.3 / 12; // 30% reposición anual

const opexMensual = opexPersonal + opexMantenimiento + opexReposicion + opexProfesores;
```

**Fórmulas:**
```
OPEX_Personal = Σ (cantidad_empleados × salario_mensual)
OPEX_Mantenimiento = Σ (costo_anual) / 12
OPEX_Reposición = CAPEX_Consumibles × 0.30 / 12

OPEX_Actividad = OPEX_Personal + OPEX_Mantenimiento + OPEX_Reposición + OPEX_Profesores

⚠️ NOTA: El Costo de Ventas (tráfico) NO se incluye aquí - 
   ya está descontado del ingreso de tráfico.
```

---

### 2.5 Métricas de Actividad

**Archivo:** `src/lib/activityCalculations.ts`  
**Líneas:** 304-308

```typescript
const ebitdaMensual = ingresosMensuales - opexMensual;
const margenEbitda = ingresosMensuales > 0 ? (ebitdaMensual / ingresosMensuales) * 100 : 0;
const paybackMeses = ebitdaMensual > 0 ? Math.ceil(capexTotal / ebitdaMensual) : 999;
const roiAnual = capexTotal > 0 ? ((ebitdaMensual * 12) / capexTotal) * 100 : 0;
```

**Fórmulas:**
```
EBITDA_Mensual = Ingresos_Mensuales - OPEX_Mensual

⚠️ IMPORTANTE: Este es "EBITDA Parcial" o "Margen de Contribución"
   Solo resta OPEX directo de la actividad
   NO incluye OPEX global (arriendo, admin, etc.)

Margen_EBITDA = (EBITDA_Mensual / Ingresos_Mensuales) × 100

Payback_Actividad = ⌈ CAPEX_Actividad / EBITDA_Mensual ⌉

ROI_Anual = (EBITDA_Mensual × 12 / CAPEX_Actividad) × 100
```

---

## 3. Cálculos con Ocupación Variable

### 3.1 Función monthlyFinancialsWithOccupancy

**Archivo:** `src/lib/monthlyFinancials.ts`  
**Función:** `monthlyFinancialsWithOccupancy()` (Líneas 60-256)

Esta función calcula ingresos con ocupación CUSTOM (diferente a la configurada en horarios).

```typescript
export function monthlyFinancialsWithOccupancy(
  config: ActivityConfig,
  daysPerMonth: number = 30,
  occupancyPico: number,      // % ocupación pico custom
  occupancyValle: number,     // % ocupación valle custom
  totalClubUsersFromOtherActivities: number = 0
): MonthlyFinancialsResult
```

**Diferencia Clave:**
- `calculateActivityFinancials()`: Usa ocupación de horarios (base/madurez)
- `monthlyFinancialsWithOccupancy()`: Usa ocupación pasada como parámetro (para proyecciones)

**Fórmula de Ingresos con Ocupación Custom:**
```typescript
// Líneas 97-105
horariosLV.forEach(h => {
  const horas = Math.max(0, h.fin - h.inicio);
  const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
  const turnosDisponibles = turnosPorUnidad * cantidad;
  const ocupacion = h.tipo === 'pico' ? occupancyPico : occupancyValle; // ← Custom
  const reservas = turnosDisponibles * (ocupacion / 100);
  ingresosReservas += reservas * h.tarifa * WEEKDAYS_LV * weeksPerMonth;
});
```

---

### 3.2 Curvas de Maduración

**Archivo:** `src/lib/projectionCalculations.ts`  
**Función:** `calculateMonthlyProjection()` (Líneas 49-113)

#### 3.2.1 Curva LINEAL

```typescript
// Líneas 76-79
if (tipoCurva === 'lineal') {
  const incrementoPorMes = (madurezProyecto - inicioProyecto) / 11;
  factorMadurez = inicioProyecto + (incrementoPorMes * (mes - 1));
}
```

**Fórmula:**
```
Incremento_Mes = (Madurez_Final - Inicio) / 11

Factor_Madurez[mes] = Inicio + (Incremento_Mes × (mes - 1))

Ejemplo con inicio=70%, madurez=100%:
  Mes 1: 70 + (2.73 × 0) = 70%
  Mes 6: 70 + (2.73 × 5) = 83.6%
  Mes 12: 70 + (2.73 × 11) = 100%
```

#### 3.2.2 Curva S-CURVE (Sigmoidea)

```typescript
// Líneas 80-84
} else {
  const t = (mes - 1) / 11; // Normalizar 0-1
  const s = 1 / (1 + Math.exp(-10 * (t - 0.5))); // Función sigmoide
  factorMadurez = inicioProyecto + (s * (madurezProyecto - inicioProyecto));
}
```

**Fórmula:**
```
t = (mes - 1) / 11                           // Normalizado [0, 1]
s = 1 / (1 + e^(-10 × (t - 0.5)))           // Función sigmoidea

Factor_Madurez[mes] = Inicio + (s × (Madurez - Inicio))

Comportamiento:
- Meses 1-3: Crecimiento lento
- Meses 4-8: Crecimiento acelerado
- Meses 9-12: Crecimiento desacelerado hasta madurez
```

#### 3.2.3 Aplicación a Ingresos

```typescript
// Líneas 87-93
const ocupacionMes = ocupacionBase * (factorMadurez / 100);
const ingresosMes = ingresosMesBase * (ocupacionMes / ocupacionBase);
```

**Fórmula:**
```
Ocupación_Mes = Ocupación_Base × (Factor_Madurez / 100)
Ingresos_Mes = Ingresos_Base × (Ocupación_Mes / Ocupación_Base)

Simplificado:
Ingresos_Mes = Ingresos_Base × (Factor_Madurez / 100)
```

---

## 4. OPEX Global y Consolidado

### 4.1 Estructura OPEX Global

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Función:** `calculateOpexMensual()` (Líneas 311-424)

#### 4.1.1 Nómina Total

```typescript
// Líneas 314-337
const nominaActividades = activities.reduce((sum, act) => {
  const config: ActivityConfig = act.config;
  const personal = config.personal || [];
  return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
}, 0);

const nominaAdmin = (opex?.nomina_administrativa || []).reduce(
  (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
);
const nominaOperativo = (opex?.nomina_operativa || []).reduce(
  (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
);

const nominaBase = nominaAdmin + nominaOperativo + nominaActividades;
const prestaciones = nominaBase * ((opex?.prestaciones_porcentaje || 53.94) / 100);
const totalNomina = nominaBase + prestaciones;
```

**Fórmula:**
```
Nómina_Actividades = Σ (cantidad × salario) [de cada actividad]
Nómina_Admin = Σ (cantidad × salario)
Nómina_Operativo = Σ (cantidad × salario)

Nómina_Base = Nómina_Actividades + Nómina_Admin + Nómina_Operativo
Prestaciones = Nómina_Base × (% prestaciones / 100)

Default % prestaciones = 53.94% (Colombia)

Total_Nómina = Nómina_Base + Prestaciones
```

#### 4.1.2 Categorías de Gasto

```typescript
// Líneas 340-347
const serviciosPublicos = calculateCategoryTotal(opex?.servicios_publicos || [], ingresosBrutos);
const marketing = calculateCategoryTotal(opex?.marketing || [], ingresosBrutos);
const tecnologia = calculateCategoryTotal(opex?.tecnologia || [], ingresosBrutos);
const seguridad = calculateCategoryTotal(opex?.seguridad || [], ingresosBrutos);
const seguros = calculateCategoryTotal(opex?.seguros || [], ingresosBrutos);
const mantenimientoGeneral = calculateCategoryTotal(opex?.mantenimiento_general || [], ingresosBrutos);
const administrativos = calculateCategoryTotal(opex?.administrativos || [], ingresosBrutos);
const otrosGastos = calculateCategoryTotal(opex?.otros_gastos || [], ingresosBrutos);
```

**Función `calculateCategoryTotal()`:** (Líneas 293-308)

```typescript
const calculateCategoryTotal = (items: ServiceItem[], ingresos: number) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const tipo = item.tipo || 'fijo';
    if (tipo === 'fijo') {
      return sum + (item.costoMensual || 0);
    } else if (tipo === 'porcentaje-facturacion') {
      return sum + (ingresos * ((item.porcentaje || 0) / 100));
    } else if (tipo === 'por-reserva') {
      const reservasAplicables = calculateReservasForActivities(item.actividadesIncluidas);
      const reservasConPorcentaje = reservasAplicables * ((item.porcentajeReservas || 100) / 100);
      return sum + ((item.costoPorReserva || 0) * reservasConPorcentaje);
    }
    return sum;
  }, 0);
};
```

**Fórmulas por Tipo de Gasto:**

```
FIJO:
  Gasto = costo_mensual

PORCENTAJE_FACTURACIÓN:
  Gasto = ingresos_brutos × (porcentaje / 100)

POR_RESERVA:
  Reservas_Aplicables = calcular_reservas(actividades_incluidas)
  Reservas_Efectivas = Reservas_Aplicables × (% reservas / 100)
  Gasto = Reservas_Efectivas × costo_por_reserva
```

---

### 4.2 Arriendo

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 389-410

```typescript
const calculateRentBase = (base: RentCalculationBase): number => {
  switch (base) {
    case 'ingresos-brutos': return ingresosBrutos;
    case 'ingresos-netos': return ingresosNetos;
    case 'utilidades': return ingresosBrutos - opexSinArriendoNiComisiones;
    case 'ingresos-operacionales': return ingresosOperacionales;
    default: return ingresosBrutos;
  }
};

let arrendamiento = 0;
const modelo = opex?.arrendamiento_modelo || 'propio';
if (modelo === 'fijo') {
  arrendamiento = opex?.arrendamiento_fijo || 0;
} else if (modelo === 'variable') {
  const base = calculateRentBase(opex?.arrendamiento_variable_base || 'ingresos-brutos');
  arrendamiento = base * ((opex?.arrendamiento_variable_porcentaje || 0) / 100);
} else if (modelo === 'mixto') {
  const base = calculateRentBase(opex?.arrendamiento_mixto_base || 'ingresos-brutos');
  arrendamiento = (opex?.arrendamiento_mixto_fijo || 0) + 
                  base * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100);
}
```

**Fórmulas:**

```
PROPIO:
  Arriendo = 0

FIJO:
  Arriendo = monto_fijo_mensual

VARIABLE:
  Base = seleccionar_base(tipo_base)
  Arriendo = Base × (porcentaje / 100)

MIXTO:
  Base = seleccionar_base(tipo_base)
  Arriendo = Monto_Fijo + (Base × porcentaje / 100)
```

**Bases de Cálculo:**
```
ingresos-brutos: Total facturado
ingresos-netos: ingresos_brutos × 0.85 (estimación)
utilidades: ingresos_brutos - OPEX_sin_arriendo
ingresos-operacionales: Solo ingresos de actividades deportivas (sin tráfico)
```

---

### 4.3 Gastos Financieros

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 350-361

```typescript
let gastosFinancieros = 0;

// 4x1000
if (opex?.incluir_4x1000) {
  gastosFinancieros += ingresosBrutos * 0.004;
}

// Comisiones bancarias fijas
gastosFinancieros += (opex?.comisiones_bancarias || []).reduce(
  (s, i) => s + (i.costoMensual || 0), 0
);

// Comisión datáfono
if (opex?.incluir_comision_datafono !== false) {
  gastosFinancieros += ingresosBrutos * 
                      ((opex?.porcentaje_ventas_datafono ?? 70) / 100) * 
                      ((opex?.comision_datafono_porcentaje ?? 2.5) / 100);
}
```

**Fórmulas:**
```
4x1000 = Ingresos_Brutos × 0.004

Comisiones_Bancarias = Σ (costo_mensual)

Datáfono = Ingresos_Brutos × (% ventas_datáfono / 100) × (% comisión / 100)
         = Ingresos × 0.70 × 0.025 (default)
         = Ingresos × 0.0175

Gastos_Financieros = 4x1000 + Comisiones_Bancarias + Datáfono
```

---

### 4.4 Impuestos Operativos

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 364-376

```typescript
let impuestos = 0;

// IVA neto
if (opex?.incluir_iva) {
  const ivaCobrado = ingresosBrutos * 
                     ((opex?.porcentaje_ingresos_iva ?? 0) / 100) * 
                     ((opex?.tarifa_iva ?? 19) / 100);
  impuestos += Math.max(0, ivaCobrado - (opex?.iva_pagado_estimado ?? 0));
}

// Retenciones
if (opex?.incluir_retenciones) {
  impuestos += (opex?.retenciones || []).reduce((s, i) => {
    const base = i.base === 'ingresos' ? ingresosBrutos : ingresosBrutos * 0.3;
    return s + (base * ((i.porcentaje || 0) / 100));
  }, 0);
}
```

**Fórmulas:**
```
IVA_Cobrado = Ingresos_Brutos × (% ingresos_con_IVA / 100) × (tarifa_IVA / 100)
IVA_Neto = max(0, IVA_Cobrado - IVA_Pagado_Estimado)

Retenciones = Σ [ Base × (porcentaje / 100) ]
  Donde Base = Ingresos (si base='ingresos') o Ingresos × 0.30 (si base='compras')

Impuestos_Totales = IVA_Neto + Retenciones
```

---

### 4.5 Depreciación

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 378-381

```typescript
const depreciacionAnos = opex?.depreciacion_anos || 10;
const incluirDepreciacion = opex?.incluir_depreciacion !== false;
const depreciacion = incluirDepreciacion ? (capexParaDepreciacion / depreciacionAnos / 12) : 0;
```

**Fórmula:**
```
Depreciación_Mensual = CAPEX_Activos / Años_Vida_Útil / 12

⚠️ CRÍTICO: capexParaDepreciacion = CAPEX SIN Working Capital
   El capital de trabajo NO se deprecia (no es activo fijo)

Default Años_Vida_Útil = 10
```

---

### 4.6 Comisiones Variables

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 416-421

```typescript
const comisiones = (opex?.comisiones || []).reduce((sum, com) => {
  let base = ingresosBrutos;
  if (com.base === 'ingresos-netos') base = ingresosNetos;
  if (com.base === 'utilidades') base = utilidadesAntesComisiones;
  return sum + (base * ((com.porcentaje || 0) / 100));
}, 0);
```

**Fórmula:**
```
Por cada comisión:
  Base = seleccionar(ingresos-brutos | ingresos-netos | utilidades)
  Comisión = Base × (porcentaje / 100)

Comisiones_Totales = Σ (comisión_i)
```

---

### 4.7 OPEX Total Consolidado

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 383-423

```typescript
const opexSinArriendoNiComisiones = totalNomina + serviciosPublicos + marketing +
  tecnologia + seguridad + seguros + mantenimientoGeneral + mantenimientoActividades +
  administrativos + gastosFinancieros + impuestos + otrosGastos + depreciacion;

const opexSinComisiones = opexSinArriendoNiComisiones + arrendamiento;

// Comisiones calculadas sobre utilidades antes de comisiones
const utilidadesAntesComisiones = Math.max(0, ingresosBrutos - opexSinComisiones);
const comisiones = /* ... */;

return opexSinComisiones + comisiones;
```

**Fórmula Completa:**
```
OPEX_Base = Nómina_Total + Servicios_Públicos + Marketing + Tecnología +
            Seguridad + Seguros + Mantenimiento_General + Mantenimiento_Actividades +
            Administrativos + Gastos_Financieros + Impuestos + Otros + Depreciación

OPEX_con_Arriendo = OPEX_Base + Arriendo

Utilidades_Antes_Comisiones = max(0, Ingresos - OPEX_con_Arriendo)

Comisiones = Σ (Base_i × %_i)

OPEX_TOTAL = OPEX_con_Arriendo + Comisiones
```

---

## 5. Agregación y Consolidación

### 5.1 Ingresos Totales del Proyecto

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 95-119

```typescript
let ingresosMadurez = 0;     // At 100% target occupancy
let ingresosBrutosAno1 = 0;  // Year 1 average with maturity ramp

activityFinancials.forEach(({ activity, financials, year1Income }, idx) => {
  // MATURITY income (at target occupancy)
  ingresosMadurez += financials.ingresosMensuales;
  
  // Year 1 monthly average (considers maturity curve)
  const ingresoYear1Promedio = year1Income.monthlyAverage;
  ingresosBrutosAno1 += ingresoYear1Promedio;
});
```

**Fórmulas:**
```
Ingresos_Madurez = Σ (Ingresos_Actividad_i) @ ocupación objetivo

Ingresos_Año1_Promedio = Σ (Promedio_Mensual_Año1_Actividad_i)
  Donde Promedio_Mensual_Año1 = Σ(12 meses con curva) / 12
```

### 5.2 Ingreso Mensual Año 1 (Curva de Maduración)

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 108-149

```typescript
// Aggregate the 12-month Year 1 income curve across ALL activities
const year1IncomeMonths = Array(12).fill(0) as number[];

activityFinancials.forEach(({ activity, financials, year1Income }, idx) => {
  year1Income.months.forEach((m, monthIdx) => {
    year1IncomeMonths[monthIdx] += m || 0;
  });
});

const year1IncomeTotal = year1IncomeMonths.reduce((sum, v) => sum + v, 0);
const year1IncomeAvg = year1IncomeTotal / 12;
```

**Fórmula:**
```
Ingresos_Mes[m] = Σ (Ingreso_Actividad_i_Mes[m])

Total_Año1 = Σ (Ingresos_Mes[1..12])
Promedio_Año1 = Total_Año1 / 12
```

---

### 5.3 EBITDA Consolidado

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 435-438

```typescript
// EBITDA at maturity (for Payback Simple, TIR, VAN)
const opexMensualMadurezFinal = calculateOpexMensual(ingresosMadurez, capexTotal);
const ebitdaMensualMadurez = ingresosMadurez - opexMensualMadurezFinal;
```

**Fórmula:**
```
EBITDA_Mensual_Madurez = Ingresos_Madurez - OPEX_Total

⚠️ Este es el EBITDA del Dashboard (consolidado)
   Incluye TODOS los gastos: nómina, arriendo, admin, depreciación, impuestos, etc.
   
   DIFERENTE del "EBITDA" del Constructor que solo resta OPEX directo de actividad
```

---

## 6. CAPEX Total y Capital de Trabajo

### 6.1 CAPEX por Componente

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 220-268

```typescript
// CAPEX Actividades (líneas 221-243)
const capexActividades = activities.reduce((sum, activity) => {
  const config: ActivityConfig = activity.config;
  const cantidad = config.cantidad || 1;
  const tipoCubierta = config.tipoCubierta || 'cubierta';
  
  let capexConstruccion = 0;
  if (tipoCubierta === 'cubierta') {
    capexConstruccion = (config.capexCubierta || 0) * cantidad;
  } else if (tipoCubierta === 'semicubierta') {
    capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
  } else {
    capexConstruccion = (config.capexAireLibre || 0) * cantidad;
  }
  
  const equipamientoTotal = /* suma de equipamiento */;
  const consumiblesTotal = /* suma de consumibles */;
  const mobiliarioTotal = /* suma de mobiliario */;
  
  return sum + capexConstruccion + equipamientoTotal + consumiblesTotal + mobiliarioTotal;
}, 0);

// CAPEX Espacios (líneas 245-256)
const capexEspacios = spaces.reduce((sum, space) => {
  const areaCapex = (space.area || 0) * ((space as any).capex_por_m2 || 0);
  const breakdownTotal = /* suma de items breakdown */;
  return sum + areaCapex + breakdownTotal;
}, 0);

// CAPEX Obra Civil (línea 258)
const capexObraCivil = obraCivil?.capex_obra_civil_total || 0;
```

**Fórmula:**
```
CAPEX_Actividades = Σ (Construcción + Equipamiento + Consumibles + Mobiliario)

CAPEX_Espacios = Σ (Área × Costo_m² + Breakdown_Items)

CAPEX_Obra_Civil = valor_de_tabla_obra_civil

CAPEX_Subtotal = CAPEX_Actividades + CAPEX_Espacios + CAPEX_Obra_Civil
```

### 6.2 Imprevistos (Contingencias)

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 261-268

```typescript
const capexSubtotalSinImprevistos = capexActividades + capexEspacios + capexObraCivil;

const imprevistosPorcentaje = obraCivil?.imprevistos_porcentaje ?? 10;
const imprevistosValor = capexSubtotalSinImprevistos * (imprevistosPorcentaje / 100);

const capexSinWorkingCapital = capexSubtotalSinImprevistos + imprevistosValor;
```

**Fórmula:**
```
Imprevistos = CAPEX_Subtotal × (% imprevistos / 100)

Default % = 10%

CAPEX_Activos = CAPEX_Subtotal + Imprevistos
```

### 6.3 Capital de Trabajo

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 426-433

```typescript
const workingCapitalMonths = currentProject?.working_capital_months ?? 3;

// CRITICAL: Use MATURITY income (not Year 1 average) for OPEX/Working Capital
const opexMensualMadurez = calculateOpexMensual(ingresosMadurez, capexSinWorkingCapital);
const workingCapitalValue = opexMensualMadurez * workingCapitalMonths;

// TOTAL CAPEX = CAPEX sin working capital + Working Capital
const capexTotal = capexSinWorkingCapital + workingCapitalValue;
```

**Fórmula:**
```
Capital_Trabajo = OPEX_Mensual_Madurez × Meses_Cobertura

Default Meses_Cobertura = 3

⚠️ IMPORTANTE: 
   - Usa OPEX calculado con ingresos de MADUREZ (no Año 1)
   - Usa CAPEX SIN working capital para calcular depreciación en el OPEX

CAPEX_TOTAL = CAPEX_Activos + Capital_Trabajo
```

### 6.4 Resumen CAPEX

```
CAPEX_TOTAL = CAPEX_Actividades 
            + CAPEX_Espacios 
            + CAPEX_Obra_Civil 
            + Imprevistos 
            + Capital_Trabajo
```

---

## 7. Proyecciones Temporales

### 7.1 Proyección Mensual Año 1

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 507-515

```typescript
const opexYear1Promedio = proyeccion[0]?.opexMensual || 0;

const year1Monthly: DashboardMetrics['year1Monthly'] = MONTH_NAMES.map((mes, idx) => {
  const ingresos = year1IncomeMonths[idx] || 0;
  const factor = year1IncomeAvg > 0 ? ingresos / year1IncomeAvg : 1;
  const opex = opexYear1Promedio * factor;  // OPEX escala con ingresos
  const ebitda = ingresos - opex;
  return { mes, ingresos, opex, ebitda };
});
```

**Fórmula:**
```
Factor_Mes[m] = Ingresos_Mes[m] / Promedio_Anual

OPEX_Mes[m] = OPEX_Promedio × Factor_Mes[m]

EBITDA_Mes[m] = Ingresos_Mes[m] - OPEX_Mes[m]

⚠️ NOTA: OPEX escala proporcionalmente con ingresos
   Esto mantiene el margen EBITDA constante
```

### 7.2 Proyección Trimestral

**Archivo:** `src/lib/projectionCalculations.ts`  
**Función:** `calculateQuarterlyFromMonths()` (Líneas 246-287)

```typescript
export function calculateQuarterlyFromMonths(
  year1Monthly: MonthlyFinancialData[]
): QuarterlyProjectionItem[] {
  const quarters: QuarterlyProjectionItem[] = [];

  for (let qIdx = 0; qIdx < 4; qIdx++) {
    const startMonth = qIdx * 3;
    const endMonth = startMonth + 3;
    
    let ingresos = 0;
    let opex = 0;
    
    for (let m = startMonth; m < endMonth; m++) {
      ingresos += year1Monthly[m]?.ingresos || 0;
      opex += year1Monthly[m]?.opex || 0;
    }
    
    // CRITICAL: Calculate EBITDA to preserve accounting identity
    const ebitda = ingresos - opex;
    
    quarters.push({ q: `Q${qIdx + 1}`, ingresos, opex, ebitda });
  }

  return quarters;
}
```

**Fórmula:**
```
Q1 = Σ (Mes 1, 2, 3)
Q2 = Σ (Mes 4, 5, 6)
Q3 = Σ (Mes 7, 8, 9)
Q4 = Σ (Mes 10, 11, 12)

Para cada Qi:
  Ingresos_Qi = Σ (Ingresos_mes)
  OPEX_Qi = Σ (OPEX_mes)
  EBITDA_Qi = Ingresos_Qi - OPEX_Qi  ← IDENTIDAD CONTABLE

⚠️ AÑOS 2-5: Distribución uniforme (25% cada trimestre)
```

### 7.3 Proyección Anual (Años 2-5)

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 451-501

```typescript
for (let year = 1; year <= projectionYears; year++) {
  let ingresosMensuales: number;
  
  if (year === 1) {
    // Year 1 uses the average from maturity curve
    ingresosMensuales = ingresosBrutosAno1;
  } else {
    // Years 2+: Use maturity income with inflation from Year 1
    const growthFactor = Math.pow(1 + inflationRate / 100, year - 1);
    ingresosMensuales = ingresosMadurez * growthFactor;
  }
  
  const ingresosAnuales = ingresosMensuales * 12;
  const opexMensual = calculateOpexMensual(ingresosMensuales, capexTotal);
  const opexAnual = opexMensual * 12;
  const ebitdaMensual = ingresosMensuales - opexMensual;
  const ebitdaAnual = ebitdaMensual * 12;
}
```

**Fórmulas:**
```
AÑO 1:
  Ingresos_Mensual = Promedio_Año1 (con curva de maduración)

AÑOS 2+:
  Factor_Crecimiento = (1 + % inflación / 100)^(año - 1)
  Ingresos_Mensual = Ingresos_Madurez × Factor_Crecimiento

Para cada año:
  Ingresos_Anual = Ingresos_Mensual × 12
  OPEX_Mensual = calcular_OPEX(Ingresos_Mensual, CAPEX_Total)
  OPEX_Anual = OPEX_Mensual × 12
  EBITDA_Mensual = Ingresos_Mensual - OPEX_Mensual
  EBITDA_Anual = EBITDA_Mensual × 12
```

---

## 8. Indicadores Financieros

### 8.1 Payback Simple

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 441-443

```typescript
// Uses MATURITY EBITDA (not Year 1 average)
const paybackSimple = ebitdaMensualMadurez > 0 ? capexTotal / ebitdaMensualMadurez : 999;
```

**Fórmula:**
```
Payback_Simple = CAPEX_Total / EBITDA_Mensual_Madurez

⚠️ IMPORTANTE: Usa EBITDA de MADUREZ, no promedio Año 1
   Representa cuánto toma recuperar inversión una vez estabilizado
```

### 8.2 Payback Real (Considerando Rampa)

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 447-505

```typescript
let flujoAcumulado = -capexTotal;
let paybackMesesReal = 0;
let paybackAlcanzado = false;

for (let year = 1; year <= projectionYears; year++) {
  // Calculate income/EBITDA for the year...
  const flujoCaja = ebitdaAnual - capex;
  flujoAcumulado += flujoCaja;
  
  if (!paybackAlcanzado && flujoAcumulado >= 0) {
    paybackAlcanzado = true;
    const flujoAnterior = flujoAcumulado - flujoCaja;
    const mesesEnAno = Math.ceil((-flujoAnterior / flujoCaja) * 12);
    paybackMesesReal = (year - 1) * 12 + Math.min(mesesEnAno, 12);
  }
}
```

**Fórmula:**
```
Flujo_Acumulado[0] = -CAPEX_Total

Para cada año:
  Flujo_Año = EBITDA_Anual - CAPEX_Año (CAPEX solo en año 1)
  Flujo_Acumulado[año] = Flujo_Acumulado[año-1] + Flujo_Año

Payback_Real = mes cuando Flujo_Acumulado >= 0

Si Flujo_Acumulado cruza 0 en año Y:
  Meses_En_Año = ⌈ (-Flujo_Anterior / Flujo_Año) × 12 ⌉
  Payback_Real = (Y - 1) × 12 + Meses_En_Año
```

### 8.3 TIR (Tasa Interna de Retorno)

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 517-538

```typescript
const calculateTIR = () => {
  const cashFlows = proyeccion.map(p => p.flujoCaja);
  cashFlows.unshift(-capexTotal); // Initial investment
  
  // Newton-Raphson iteration
  let irr = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let npvDerivative = 0;
    cashFlows.forEach((cf, year) => {
      npv += cf / Math.pow(1 + irr, year);
      npvDerivative -= year * cf / Math.pow(1 + irr, year + 1);
    });
    if (Math.abs(npv) < 0.01) break;
    irr = irr - npv / npvDerivative;
    if (irr < -1 || irr > 10) irr = 0.1; // Reset if out of bounds
  }
  return Math.max(0, Math.min(irr * 100, 100));
};
```

**Fórmula:**
```
Flujos = [-CAPEX, Flujo_Año1, Flujo_Año2, ..., Flujo_Año5]

TIR es la tasa r que hace:
  Σ (Flujo_t / (1 + r)^t) = 0

Método Newton-Raphson:
  NPV(r) = Σ (CF_t / (1 + r)^t)
  NPV'(r) = Σ (-t × CF_t / (1 + r)^(t+1))
  
  r_nuevo = r - NPV(r) / NPV'(r)

⚠️ La TIR se expresa como % anual
```

### 8.4 VAN (Valor Actual Neto)

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 540-547

```typescript
const calculateVAN = () => {
  const cashFlows = proyeccion.map(p => p.flujoCaja);
  cashFlows.unshift(-capexTotal);
  return cashFlows.reduce((npv, cf, year) => {
    return npv + cf / Math.pow(1 + discountRate / 100, year);
  }, 0);
};
```

**Fórmula:**
```
VAN = Σ (Flujo_t / (1 + tasa_descuento)^t)

VAN = -CAPEX + Flujo_1/(1+r) + Flujo_2/(1+r)² + ... + Flujo_5/(1+r)⁵

Donde r = tasa_descuento / 100 (default 12%)
```

### 8.5 ROI Acumulado

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Línea:** 484

```typescript
const roiAcumulado = capexTotal > 0 ? (flujoAcumulado / capexTotal) * 100 : 0;
```

**Fórmula:**
```
ROI_Acumulado[año] = (Flujo_Acumulado[año] / CAPEX_Total) × 100

Ejemplo:
  Si CAPEX = $1,000M y Flujo_Acumulado_Año5 = $500M
  ROI_Año5 = (500 / 1000) × 100 = 50%
```

### 8.6 Punto de Equilibrio

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 552-564

```typescript
let puntoEquilibrioMes = 0;
let flujoParcial = -capexTotal;
for (let mes = 1; mes <= projectionYears * 12; mes++) {
  const yearIdx = Math.floor((mes - 1) / 12);
  const ebitdaMes = proyeccion[yearIdx]?.ebitdaMensual || 0;
  flujoParcial += ebitdaMes;
  if (flujoParcial >= 0 && puntoEquilibrioMes === 0) {
    puntoEquilibrioMes = mes;
    break;
  }
}
```

**Fórmula:**
```
Flujo[0] = -CAPEX

Para mes = 1 hasta 60:
  Flujo[mes] = Flujo[mes-1] + EBITDA_Mensual[año_correspondiente]
  
  Si Flujo[mes] >= 0:
    Punto_Equilibrio = mes
    break
```

### 8.7 Métricas por m²

**Archivo:** `src/hooks/useDashboardMetrics.ts`  
**Líneas:** 826-827

```typescript
ingresosPorM2Anual: areaTotal > 0 ? (ingresosMadurez * 12 / areaTotal) : 0,
ebitdaPorM2Anual: areaTotal > 0 ? (ebitdaMensualBase * 12 / areaTotal) : 0,
```

**Fórmulas:**
```
Ingresos_por_m²_Anual = (Ingresos_Mensuales × 12) / Área_Total

EBITDA_por_m²_Anual = (EBITDA_Mensual × 12) / Área_Total
```

---

## 9. Lógicas Especiales y Edge Cases

### 9.1 Ocupación = 0

```typescript
// projectionCalculations.ts líneas 59-71
if (ocupacionBase <= 0) {
  return {
    meses: Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      factorMadurez: 0,
      ocupacionPromedio: 0,
      ingresosMensuales: 0
    })),
    ingresoAnual: 0,
    ingresoMensualPromedio: 0,
    ocupacionPromedioAnual: 0
  };
}
```

**Comportamiento:** Retorna 0 para todos los ingresos.

### 9.2 EBITDA < 0

```typescript
// activityCalculations.ts línea 307
const paybackMeses = ebitdaMensual > 0 ? Math.ceil(capexTotal / ebitdaMensual) : 999;

// useDashboardMetrics.ts línea 443
const paybackSimple = ebitdaMensualMadurez > 0 ? capexTotal / ebitdaMensualMadurez : 999;
```

**Comportamiento:** Payback = 999 meses (indica no recuperación).

### 9.3 División por Cero

Protecciones implementadas:

```typescript
// Duración de reserva
const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;

// Ingresos para porcentajes
const margenEbitda = ingresosMensuales > 0 ? (ebitdaMensual / ingresosMensuales) * 100 : 0;

// CAPEX para ROI
const roiAnual = capexTotal > 0 ? ((ebitdaMensual * 12) / capexTotal) * 100 : 0;

// Área para métricas por m²
const ingresosPorM2Anual = areaTotal > 0 ? (ingresosMadurez * 12 / areaTotal) : 0;
```

### 9.4 Modelo Mixto - Posibles Conflictos

⚠️ **Limitación Identificada:**

El modelo MIXTO suma ingresos de RESERVAS + MEMBRESÍA + PASES sin validar:
- Conflictos de capacidad (misma cancha no puede tener 100% reservas + 100% membresías)
- Doble conteo de usuarios
- Incoherencia en ocupación

**Recomendación:** Documentar esta limitación o implementar validación.

---

## 10. Flujo de Datos

### 10.1 Diagrama de Flujo Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUTS DEL USUARIO                          │
├─────────────────────────────────────────────────────────────────────┤
│ • Actividades (horarios, tarifas, ocupación)                        │
│ • Espacios (área, equipamiento)                                     │
│ • Obra Civil (construcción, imprevistos)                           │
│ • OPEX Global (nómina, servicios, arriendo)                        │
│ • Configuración (inflación, descuento, años proyección)            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            PASO 1: CÁLCULOS BASE POR ACTIVIDAD                      │
│            Archivo: src/lib/activityCalculations.ts                  │
├─────────────────────────────────────────────────────────────────────┤
│ calculateActivityFinancials() → ActivityFinancials                   │
│   • ingresosHorarios, ingresosClases, ingresosMembresías...        │
│   • capexTotal (construcción + equipamiento)                        │
│   • opexMensual (personal + mantenimiento + reposición)            │
│   • ebitdaMensual, margenEbitda, payback, roi                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            PASO 2: PROYECCIÓN AÑO 1 CON CURVA                       │
│            Archivo: src/lib/monthlyFinancials.ts                    │
├─────────────────────────────────────────────────────────────────────┤
│ monthlyFinancialsWithOccupancy() → MonthlyFinancialsResult          │
│   • 12 meses con ocupación variable (curva lineal o S-curve)       │
│   • Ingresos escalados por factor de madurez                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            PASO 3: CONSOLIDACIÓN DASHBOARD                          │
│            Archivo: src/hooks/useDashboardMetrics.ts                │
├─────────────────────────────────────────────────────────────────────┤
│ 3.1: Sumar ingresos de todas las actividades                       │
│      ingresosMadurez = Σ(financials.ingresosMensuales)            │
│      ingresosBrutosAno1 = Σ(year1Income.monthlyAverage)           │
│                                                                     │
│ 3.2: Calcular CAPEX Total                                          │
│      CAPEX = Actividades + Espacios + ObraCivil + Imprevistos     │
│            + Capital de Trabajo                                     │
│                                                                     │
│ 3.3: Calcular OPEX Global                                          │
│      OPEX = Nómina + Categorías + Arriendo + Financieros          │
│           + Impuestos + Depreciación + Comisiones                  │
│                                                                     │
│ 3.4: Calcular EBITDA Consolidado                                   │
│      EBITDA = Ingresos - OPEX Total                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            PASO 4: INDICADORES FINANCIEROS                          │
├─────────────────────────────────────────────────────────────────────┤
│ • Payback Simple = CAPEX / EBITDA_Madurez                          │
│ • Payback Real = simulación mes a mes                              │
│ • TIR = Newton-Raphson sobre flujos                                │
│ • VAN = descuento de flujos con tasa configurada                   │
│ • ROI Acumulado = Flujo_Acumulado / CAPEX                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OUTPUTS AL DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────┤
│ DashboardMetrics:                                                   │
│ • ingresosMensualesBase, ingresosAnualesBase                       │
│ • ebitdaMensualBase, margenEbitdaBase                              │
│ • capexTotal, tir, van, paybackMeses, paybackMesesReal             │
│ • proyeccion (5 años), year1Monthly (12 meses)                     │
│ • insights, activityInsights, spaceInsights                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Dependencias Entre Cálculos

```
Orden de ejecución (evita dependencias circulares):

1. Total Usuarios Club → para cálculo de tráfico
2. Ingresos por Actividad → suma para total
3. CAPEX Actividades → suma para CAPEX preliminar
4. CAPEX Espacios + Obra Civil → CAPEX subtotal
5. Imprevistos → CAPEX sin Working Capital
6. OPEX con depreciación (usa CAPEX sin WC) → OPEX base
7. Working Capital (usa OPEX base) → suma a CAPEX Total
8. OPEX final (puede usar CAPEX Total para recálculo)
9. EBITDA = Ingresos - OPEX
10. Métricas financieras (Payback, TIR, VAN)
```

⚠️ **Posible Circularidad Identificada:**

```
OPEX incluye Depreciación → Depreciación usa CAPEX
CAPEX incluye Working Capital → Working Capital usa OPEX
```

**Solución Implementada:** Se usa `capexSinWorkingCapital` para depreciación, evitando la circularidad.

---

## 11. Ejemplo Numérico Completo

### 11.1 Datos de Entrada

```
ACTIVIDAD: Club de Pádel
- Cantidad: 4 canchas
- Tipo cubierta: Cubierta
- CAPEX construcción: $80,000,000/cancha
- Duración reserva: 1.5 horas
- Jugadores por reserva: 4

HORARIOS L-V (5 días/semana):
- Pico (17:00-22:00): 5 horas, tarifa $35,000, ocupación 75%
- Valle (08:00-17:00): 9 horas, tarifa $25,000, ocupación 45%

HORARIOS S-D (2 días/semana):
- Pico (09:00-20:00): 11 horas, tarifa $40,000, ocupación 80%

OPEX ACTIVIDAD:
- Personal: 2 personas × $2,500,000 = $5,000,000/mes
- Mantenimiento: $12,000,000/año

OPEX GLOBAL:
- Nómina admin: $8,000,000/mes
- Prestaciones: 53.94%
- Arriendo fijo: $15,000,000/mes
- Servicios públicos: $3,000,000/mes
- Depreciación: 10 años

CONFIGURACIÓN:
- Días/mes: 30
- Semanas/mes: 30/7 = 4.2857
- Inflación: 5%
- Tasa descuento: 12%
- Working Capital: 3 meses
```

### 11.2 Cálculo Paso a Paso

#### PASO 1: Turnos e Ingresos L-V

```
PICO L-V:
  Turnos/cancha = 5 horas / 1.5 = 3.33 turnos
  Turnos disponibles = 3.33 × 4 canchas = 13.33
  Turnos ocupados = 13.33 × 0.75 = 10 turnos/día
  Ingresos/día = 10 × $35,000 = $350,000

VALLE L-V:
  Turnos/cancha = 9 horas / 1.5 = 6 turnos
  Turnos disponibles = 6 × 4 = 24
  Turnos ocupados = 24 × 0.45 = 10.8 turnos/día
  Ingresos/día = 10.8 × $25,000 = $270,000

TOTAL L-V/día: $620,000
TOTAL L-V/semana: $620,000 × 5 = $3,100,000
```

#### PASO 2: Turnos e Ingresos S-D

```
PICO S-D:
  Turnos/cancha = 11 horas / 1.5 = 7.33 turnos
  Turnos disponibles = 7.33 × 4 = 29.33
  Turnos ocupados = 29.33 × 0.80 = 23.47 turnos/día
  Ingresos/día = 23.47 × $40,000 = $938,667

TOTAL S-D/semana: $938,667 × 2 = $1,877,333
```

#### PASO 3: Ingresos Mensuales

```
Ingresos/semana = $3,100,000 + $1,877,333 = $4,977,333
Ingresos/mes = $4,977,333 × 4.2857 = $21,331,429
```

#### PASO 4: Usuarios Mensuales

```
Turnos L-V/día = 10 + 10.8 = 20.8
Turnos S-D/día = 23.47
Turnos/semana = (20.8 × 5) + (23.47 × 2) = 104 + 46.93 = 150.93
Turnos/mes = 150.93 × 4.2857 = 646.86
Usuarios/mes = 646.86 × 4 jugadores = 2,587 usuarios
```

#### PASO 5: CAPEX Actividad

```
Construcción = $80,000,000 × 4 = $320,000,000
Equipamiento = $0 (no configurado en ejemplo)
Total CAPEX Actividad = $320,000,000
```

#### PASO 6: OPEX Actividad

```
Personal = $5,000,000
Mantenimiento = $12,000,000 / 12 = $1,000,000
Reposición = $0 (sin consumibles)
Total OPEX Actividad = $6,000,000/mes
```

#### PASO 7: EBITDA Actividad (Margen de Contribución)

```
EBITDA Actividad = $21,331,429 - $6,000,000 = $15,331,429/mes
Margen = $15,331,429 / $21,331,429 × 100 = 71.9%
```

#### PASO 8: CAPEX Total del Proyecto

```
CAPEX Actividades = $320,000,000
CAPEX Espacios = $0
CAPEX Obra Civil = $0
Subtotal = $320,000,000
Imprevistos (10%) = $32,000,000
CAPEX sin WC = $352,000,000
```

#### PASO 9: OPEX Global

```
Nómina admin = $8,000,000
Prestaciones = $8,000,000 × 0.5394 = $4,315,200
Total nómina = $12,315,200 + $5,000,000 (actividad) = $17,315,200

Con prestaciones sobre todo:
Nómina base = $8,000,000 + $5,000,000 = $13,000,000
Prestaciones = $13,000,000 × 0.5394 = $7,012,200
Total nómina = $20,012,200

Servicios públicos = $3,000,000
Arriendo = $15,000,000
Mantenimiento actividad = $1,000,000
Depreciación = $352,000,000 / 10 / 12 = $2,933,333

OPEX Total = $20,012,200 + $3,000,000 + $15,000,000 + $1,000,000 + $2,933,333
           = $41,945,533/mes
```

#### PASO 10: Working Capital

```
Working Capital = $41,945,533 × 3 = $125,836,600
CAPEX Total = $352,000,000 + $125,836,600 = $477,836,600
```

#### PASO 11: EBITDA Proyecto

```
EBITDA = Ingresos - OPEX
       = $21,331,429 - $41,945,533
       = -$20,614,104/mes

⚠️ EBITDA NEGATIVO - Proyecto no viable con estos parámetros
```

#### PASO 12: Ajuste - Agregar más actividades o revisar OPEX

Para un proyecto viable, necesitaríamos:
- Más actividades generando ingresos
- O reducir OPEX global significativamente

---

## 12. Glosario de Variables

| Variable | Descripción | Unidad |
|----------|-------------|--------|
| `cantidad` | Número de unidades (canchas, salas) | unidades |
| `duracionReserva` | Duración de cada reserva | horas |
| `jugadoresPorReserva` | Personas por reserva | personas |
| `ocupacion` | Porcentaje de ocupación | % (0-100) |
| `tarifa` | Precio por reserva/turno | $/reserva |
| `daysPerMonth` | Días del mes | días |
| `weeksPerMonth` | Semanas del mes (daysPerMonth/7) | semanas |
| `WEEKDAYS_LV` | Días laborables por semana | 5 |
| `WEEKDAYS_SD` | Días fin de semana por semana | 2 |
| `ingresosMadurez` | Ingresos al 100% ocupación objetivo | $/mes |
| `ingresosBrutosAno1` | Promedio mensual Año 1 con curva | $/mes |
| `opexMensual` | Gastos operativos mensuales | $/mes |
| `ebitdaMensual` | EBITDA mensual | $/mes |
| `capexTotal` | Inversión total con WC | $ |
| `workingCapitalMonths` | Meses de cobertura WC | meses |
| `inflationRate` | Tasa de inflación anual | % |
| `discountRate` | Tasa de descuento para VAN | % |
| `paybackMeses` | Meses para recuperar inversión | meses |
| `tir` | Tasa Interna de Retorno | % anual |
| `van` | Valor Actual Neto | $ |

---

## Notas Finales

### Inconsistencias Documentadas

1. **EBITDA Constructor vs Dashboard:**
   - Constructor: Margen de Contribución (solo OPEX directo)
   - Dashboard: EBITDA Total (incluye todo OPEX)
   - **Recomendación:** Renombrar en Constructor a "Margen Bruto"

2. **Modelo Mixto sin validación de capacidad:**
   - Los modelos se suman sin verificar conflictos
   - **Recomendación:** Implementar validación o advertencia

3. **Costo de Ventas (Tráfico):**
   - Se descuenta del ingreso, no se suma al OPEX
   - Esto es correcto contablemente (reduce ingreso neto)

### Actualizaciones Pendientes

- [ ] Validar identidad contable trimestral
- [ ] Implementar TIR después de impuestos (35%)
- [ ] Agregar validación modelo mixto

---

*Documento generado: 2026-02-06*  
*Versión del sistema: 1.0*
