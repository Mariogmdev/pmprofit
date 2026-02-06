import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para manejar inputs con debounce.
 * - Actualiza el valor local inmediatamente (UI responsiva)
 * - Propaga el cambio al padre después de un delay (evita re-renders excesivos)
 */
export function useDebouncedValue<T>(
  externalValue: T,
  onChange: (value: T) => void,
  delay: number = 300
): [T, (value: T) => void, () => void] {
  const [localValue, setLocalValue] = useState<T>(externalValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);

  // Mantener referencia actualizada de onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sincronizar con valor externo cuando cambia
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((value: T) => {
    // Actualizar inmediatamente en UI (sin lag)
    setLocalValue(value);

    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Propagar cambio con delay
    timeoutRef.current = setTimeout(() => {
      onChangeRef.current(value);
    }, delay);
  }, [delay]);

  // Función para forzar propagación inmediata (útil para onBlur)
  const flushNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onChangeRef.current(localValue);
  }, [localValue]);

  return [localValue, handleChange, flushNow];
}

/**
 * Hook simplificado para inputs de texto
 */
export function useDebouncedInput(
  externalValue: string,
  onChange: (value: string) => void,
  delay: number = 300
) {
  return useDebouncedValue(externalValue, onChange, delay);
}

/**
 * Hook simplificado para inputs numéricos
 */
export function useDebouncedNumber(
  externalValue: number,
  onChange: (value: number) => void,
  delay: number = 300
) {
  return useDebouncedValue(externalValue, onChange, delay);
}
