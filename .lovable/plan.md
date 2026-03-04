
# Plan: Unificar weeksPerMonth en todo el sistema

## Resumen del Problema

Actualmente el sistema tiene una **inconsistencia crítica**:

| Modelo de Ingresos | Cálculo Actual | Problema |
|-------------------|----------------|----------|
| **Reservas** | `ingresosSemana * 4.33` (fijo) | Ignora `daysPerMonth` del proyecto |
| **Membresías** | `pasesProyectadosDia * daysPerMonth` | Usa configuración del proyecto |
| **Pases Diarios** | `pasesDia * daysPerMonth` | Usa configuración del proyecto |

**Resultado:** Cambiar `daysPerMonth` de 28 a 31 **NO afecta** los ingresos por reservas, pero **SÍ afecta** membresías y pases. Esto genera inconsistencias financieras.

## Archivos Afectados

Encontré **3 archivos** con el valor hardcodeado `4.33` o `WEEKS_PER_MONTH`:

1. `src/lib/activityCalculations.ts` (línea 20) - **Fuente principal**
2. `src/components/constructor/ActivityCard.tsx` (línea 152) - **Duplicado local**
3. `src/lib/projectionCalculations.ts` (línea 10) - **Solo en comentario**

## Plan de Implementación

### Paso 1: Crear helper centralizado

**Nuevo archivo:** `src/lib/timeHelpers.ts`

```typescript
/**
 * Time-related calculations centralized
 * Ensures consistency between reservation and membership models
 */

/**
 * Calcula semanas por mes basado en días configurados
 * 
 * @param daysPerMonth - Días del mes (28, 30, 31)
 * @returns Semanas por mes (ej: 30/7 = 4.2857)
 * 
 * Antes usábamos 4.33 fijo (30/7 ≈ 4.33)
 * Ahora es dinámico basado en configuración del proyecto
 */
export function getWeeksPerMonth(daysPerMonth: number = 30): number {
  return daysPerMonth / 7;
}

/**
 * Días por semana (constante)
 */
export const DAYS_PER_WEEK = 7;

/**
 * Días laborales por semana
 */
export const WEEKDAYS_LV = 5; // Lunes - Viernes
export const WEEKDAYS_SD = 2; // Sábado - Domingo
```

### Paso 2: Modificar `src/lib/activityCalculations.ts`

**Cambios:**

```typescript
// ELIMINAR (línea 20):
const WEEKS_PER_MONTH = 4.33;

// AGREGAR import:
import { getWeeksPerMonth, WEEKDAYS_LV, WEEKDAYS_SD } from '@/lib/timeHelpers';

// MODIFICAR función calculateActivityFinancials (línea 105):
export function calculateActivityFinancials(
  config: ActivityConfig,
  daysPerMonth: number = 30,
  totalClubUsersFromOtherActivities: number = 0
): ActivityFinancials {
  // NUEVO: Calcular WEEKS_PER_MONTH dinámicamente
  const weeksPerMonth = getWeeksPerMonth(daysPerMonth);
  
  // ... resto del código ...
  
  // Línea 176 - CAMBIAR:
  // ANTES: ingresosHorarios = ingresosSemana * WEEKS_PER_MONTH;
  // DESPUÉS:
  ingresosHorarios = ingresosSemana * weeksPerMonth;
  
  // Línea 196 - CAMBIAR:
  // ANTES: const totalReservasMes = turnosSemana * WEEKS_PER_MONTH;
  // DESPUÉS:
  const totalReservasMes = turnosSemana * weeksPerMonth;
}

// MODIFICAR función calculateIncomeForOccupation (línea ~370):
export function calculateIncomeForOccupation(
  config: ActivityConfig,
  picoOcupacion: number,
  valleOcupacion: number,
  daysPerMonth: number = 30  // AGREGAR parámetro
): number {
  const weeksPerMonth = getWeeksPerMonth(daysPerMonth);
  
  // Líneas 393 y 404 - CAMBIAR:
  // ANTES: totalIncome += reservas * tarifa * WEEKDAYS_LV * WEEKS_PER_MONTH;
  // DESPUÉS:
  totalIncome += reservas * tarifa * WEEKDAYS_LV * weeksPerMonth;
  totalIncome += reservas * tarifa * WEEKDAYS_SD * weeksPerMonth;
}
```

### Paso 3: Modificar `src/components/constructor/ActivityCard.tsx`

**Cambios:**

```typescript
// ELIMINAR (línea 152):
const WEEKS_PER_MONTH = 4.33;

// AGREGAR import:
import { getWeeksPerMonth } from '@/lib/timeHelpers';

// MODIFICAR calculateMonthlyIncome (línea 148):
const calculateMonthlyIncome = useCallback((picoOcupacion: number, valleOcupacion: number): number => {
  const horarios = activity.config.horarios || [];
  const cantidad = activity.config.cantidad || 1;
  const duracion = activity.config.duracionReserva || 1.5;
  
  // NUEVO: Obtener daysPerMonth del proyecto
  const daysPerMonth = currentProject?.days_per_month || 30;
  const weeksPerMonth = getWeeksPerMonth(daysPerMonth);

  // ... resto del código ...
  
  // Línea 168 - CAMBIAR:
  // ANTES: totalIncome += reservas * tarifa * 5 * WEEKS_PER_MONTH;
  // DESPUÉS:
  totalIncome += reservas * tarifa * 5 * weeksPerMonth;
  
  // Línea 179 - CAMBIAR:
  totalIncome += reservas * tarifa * 2 * weeksPerMonth;
  
  return totalIncome;
}, [activity.config, currentProject?.days_per_month]); // Agregar dependencia
```

### Paso 4: Actualizar `src/hooks/useActivityCalculations.ts`

**Cambios:**

```typescript
// ELIMINAR líneas 10-11:
const WEEKDAYS_LV = 5;
const WEEKDAYS_SD = 2;

// AGREGAR import:
import { WEEKDAYS_LV, WEEKDAYS_SD } from '@/lib/timeHelpers';
```

### Paso 5: Actualizar comentarios en `src/lib/projectionCalculations.ts`

**Cambios (líneas 8-10):**

```typescript
// ANTES:
* - Uses 4.33 weeks/month for consistency

// DESPUÉS:
* - Uses dynamic weeks/month based on project configuration (daysPerMonth/7)
```

### Paso 6: Crear tests

**Nuevo archivo:** `src/lib/__tests__/timeHelpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getWeeksPerMonth, WEEKDAYS_LV, WEEKDAYS_SD, DAYS_PER_WEEK } from '../timeHelpers';

describe('timeHelpers', () => {
  describe('getWeeksPerMonth', () => {
    it('calcula semanas correctamente para 28 días', () => {
      expect(getWeeksPerMonth(28)).toBe(4.0);
    });
    
    it('calcula semanas correctamente para 30 días', () => {
      expect(getWeeksPerMonth(30)).toBeCloseTo(4.2857, 4);
    });
    
    it('calcula semanas correctamente para 31 días', () => {
      expect(getWeeksPerMonth(31)).toBeCloseTo(4.4286, 4);
    });
    
    it('usa 30 días por defecto', () => {
      expect(getWeeksPerMonth()).toBeCloseTo(4.2857, 4);
    });
  });
  
  describe('impacto en cálculos financieros', () => {
    it('ingresos escalan proporcionalmente con días del mes', () => {
      const weeklyIncome = 1000000; // $1M/semana
      
      const income28 = weeklyIncome * getWeeksPerMonth(28);
      const income30 = weeklyIncome * getWeeksPerMonth(30);
      const income31 = weeklyIncome * getWeeksPerMonth(31);
      
      // 28 días = $4M/mes
      expect(income28).toBe(4000000);
      
      // 30 días > 28 días (7.14% más)
      const diff30vs28 = (income30 - income28) / income28;
      expect(diff30vs28).toBeCloseTo(0.0714, 2);
      
      // 31 días > 28 días (10.71% más)
      const diff31vs28 = (income31 - income28) / income28;
      expect(diff31vs28).toBeCloseTo(0.1071, 2);
    });
  });
  
  describe('constantes de días', () => {
    it('weekdays L-V es 5', () => {
      expect(WEEKDAYS_LV).toBe(5);
    });
    
    it('weekdays S-D es 2', () => {
      expect(WEEKDAYS_SD).toBe(2);
    });
    
    it('total días por semana es 7', () => {
      expect(DAYS_PER_WEEK).toBe(7);
      expect(WEEKDAYS_LV + WEEKDAYS_SD).toBe(DAYS_PER_WEEK);
    });
  });
});
```

## Resumen de Cambios por Archivo

| Archivo | Acción | Líneas Afectadas |
|---------|--------|-----------------|
| `src/lib/timeHelpers.ts` | **CREAR** | Nuevo archivo (25 líneas) |
| `src/lib/__tests__/timeHelpers.test.ts` | **CREAR** | Nuevo archivo (60 líneas) |
| `src/lib/activityCalculations.ts` | **MODIFICAR** | Líneas 20, 105, 176, 196, 370, 393, 404 |
| `src/components/constructor/ActivityCard.tsx` | **MODIFICAR** | Líneas 1-5 (imports), 148-183 |
| `src/hooks/useActivityCalculations.ts` | **MODIFICAR** | Líneas 9-11 (imports) |
| `src/lib/projectionCalculations.ts` | **MODIFICAR** | Línea 10 (comentario) |

## Validación Final

1. **Búsqueda post-implementación:**
```bash
grep -r "4.33" src/ --exclude-dir=node_modules
# Debe retornar 0 resultados (excepto comentarios históricos si los hay)

grep -r "WEEKS_PER_MONTH = 4" src/
# Debe retornar 0 resultados
```

2. **Test manual:**
   - Crear proyecto con `daysPerMonth = 28`
   - Agregar actividad de reserva con ingresos conocidos
   - Anotar ingresos mensuales
   - Cambiar a `daysPerMonth = 31`
   - Verificar que ingresos aumentan ~10.7%

## Impacto Esperado

| Configuración | Antes (4.33 fijo) | Después (dinámico) |
|--------------|-------------------|-------------------|
| 28 días/mes | $1M × 4.33 = $4.33M | $1M × 4.00 = $4.00M |
| 30 días/mes | $1M × 4.33 = $4.33M | $1M × 4.29 = $4.29M |
| 31 días/mes | $1M × 4.33 = $4.33M | $1M × 4.43 = $4.43M |

**Beneficio:** Ahora los cálculos de reservas, membresías y pases diarios **escalan coherentemente** con la configuración de días del mes.
