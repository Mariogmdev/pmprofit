/**
 * Formatea hora como string HH:MM AM/PM
 */
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Calcula las horas de operación por día
 */
export function calculateHoursPerDay(
  openingHour: number,
  openingMinute: number,
  closingHour: number,
  closingMinute: number
): number {
  const openingDecimal = openingHour + openingMinute / 60;
  const closingDecimal = closingHour + closingMinute / 60;
  
  // Si el cierre es menor que la apertura, asumimos que cruza la medianoche
  if (closingDecimal <= openingDecimal) {
    return 24 - openingDecimal + closingDecimal;
  }
  
  return closingDecimal - openingDecimal;
}

/**
 * Calcula las horas de operación por mes
 */
export function calculateHoursPerMonth(hoursPerDay: number, daysPerMonth: number): number {
  return hoursPerDay * daysPerMonth;
}

/**
 * Calcula los días de operación por año
 */
export function calculateDaysPerYear(daysPerMonth: number): number {
  return daysPerMonth * 12;
}

/**
 * Formatea una fecha relativa (hace X días/horas/minutos)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }
  
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Genera opciones de hora para select (0-23)
 */
export function generateHourOptions(): { value: number; label: string }[] {
  return Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: formatTime(i, 0).replace(':00', ''),
  }));
}

/**
 * Genera opciones de minutos para select
 */
export function generateMinuteOptions(): { value: number; label: string }[] {
  return [
    { value: 0, label: '00' },
    { value: 30, label: '30' },
  ];
}
