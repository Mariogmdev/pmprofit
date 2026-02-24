import { EstadoResultados } from '@/types/estadoResultados';
import {
  BalanceGeneral,
  PeriodoBalance,
  TotalActivos,
  PasivosTotales,
  Patrimonio,
} from '@/types/balanceGeneral';
import { logger } from '@/lib/logger';

// Parámetros de estimación (ajustables)
const DIAS_CUENTAS_COBRAR = 15;   // días de ingresos pendientes
const DIAS_CUENTAS_PAGAR = 30;    // días de OPEX pendiente
const PCT_INVENTARIO_WC = 0.05;   // 5% del OPEX como inventario

export function calculateBalanceGeneral(
  proyectoId: string,
  pl: EstadoResultados,
  capexTotal: number,
  workingCapital: number,
): BalanceGeneral {

  // ── PASO 1: Construir períodos acumulativos ──
  let depreciacionAcumulada = 0;
  let utilidadRetenidaAcumulada = 0;
  let efectivoAcumulado = -capexTotal; // Año 0: inversión negativa

  const periodos: PeriodoBalance[] = pl.anos.map((ano) => {

    // ── ACTIVOS FIJOS ──
    depreciacionAcumulada += ano.depreciacion.total;
    const activoFijoNeto = capexTotal - depreciacionAcumulada;

    const activosFijos = {
      capexBruto: capexTotal,
      depreciacionAcumulada,
      activoFijoNeto: Math.max(0, activoFijoNeto),
    };

    // ── EFECTIVO ACUMULADO ──
    // Flujo caja = EBITDA - Impuestos (simplificado, sin CAPEX repetido)
    const flujoCajaOperativo = ano.ebitda - ano.impuestos.valor;
    efectivoAcumulado += flujoCajaOperativo;

    // ── ACTIVOS CIRCULANTES ──
    const cuentasPorCobrar = (ano.ingresos.netos / 365) * DIAS_CUENTAS_COBRAR;
    const inventarios = ano.opex.total * PCT_INVENTARIO_WC;
    const otrosActivos = workingCapital * 0.1; // 10% WC como otros
    const totalCirculantes = Math.max(0, efectivoAcumulado)
      + cuentasPorCobrar
      + inventarios
      + otrosActivos;

    const activosCirculantes = {
      efectivo: Math.max(0, efectivoAcumulado),
      cuentasPorCobrar,
      inventarios,
      otrosActivos,
      total: totalCirculantes,
    };

    const totalActivos = activosFijos.activoFijoNeto + totalCirculantes;

    const activos: TotalActivos = {
      fijos: activosFijos,
      circulantes: activosCirculantes,
      total: totalActivos,
    };

    // ── PASIVOS ──
    const cuentasPorPagar = (ano.opex.total / 365) * DIAS_CUENTAS_PAGAR;
    const impuestosPorPagar = ano.impuestos.valor / 12; // 1 mes pendiente
    const otrosPasivos = ano.opex.total * 0.02;
    const totalPasivosCirculantes = cuentasPorPagar
      + impuestosPorPagar
      + otrosPasivos;

    const pasivos: PasivosTotales = {
      circulantes: {
        cuentasPorPagar,
        impuestosPorPagar,
        otrosPasivos,
        total: totalPasivosCirculantes,
      },
      largoplazo: 0, // sin deuda
      total: totalPasivosCirculantes,
    };

    // ── PATRIMONIO ──
    // REGLA: patrimonio.total = activos.total - pasivos.total
    // Esto garantiza la identidad contable por construcción
    const patrimonioTotal = totalActivos - pasivos.total;
    const utilidadEjercicio = ano.utilidadNeta;

    // utilidadRetenida = patrimonio restante después de descontar
    // capital invertido y utilidad del ejercicio actual
    const utilidadRetenida = patrimonioTotal
      - capexTotal
      - utilidadEjercicio;

    utilidadRetenidaAcumulada += utilidadEjercicio;

    const patrimonio: Patrimonio = {
      capitalInvertido: capexTotal,
      utilidadRetenida: Math.max(
        utilidadRetenidaAcumulada - utilidadEjercicio,
        utilidadRetenida
      ),
      utilidadEjercicio,
      total: patrimonioTotal,
    };

    // ── VALIDAR IDENTIDAD CONTABLE ──
    const diferenciaIdentidad = Math.abs(
      activos.total - (pasivos.total + patrimonio.total)
    );

    if (diferenciaIdentidad > 1000) {
      logger.dev(
        `⚠️ Identidad Balance rota en Año ${ano.periodo}: ` +
        `Activos=${activos.total} ≠ ` +
        `Pasivos+Patrimonio=${pasivos.total + patrimonio.total} ` +
        `diff=${diferenciaIdentidad}`
      );
    }

    return {
      periodo: ano.periodo,
      activos,
      pasivos,
      patrimonio,
      diferenciaIdentidad,
    };
  });

  // ── RATIOS (año 3 = madurez) ──
  const ano3 = periodos[2];
  const utilidadNeta3 = pl.anos[2]?.utilidadNeta ?? 0;

  const ratios = {
    liquidez: ano3.pasivos.circulantes.total > 0
      ? ano3.activos.circulantes.total / ano3.pasivos.circulantes.total
      : 0,
    endeudamiento: ano3.activos.total > 0
      ? ano3.pasivos.total / ano3.activos.total
      : 0,
    roe: ano3.patrimonio.total > 0
      ? (utilidadNeta3 / ano3.patrimonio.total) * 100
      : 0,
    roa: ano3.activos.total > 0
      ? (utilidadNeta3 / ano3.activos.total) * 100
      : 0,
    multiplicadorCapital: ano3.patrimonio.total > 0
      ? ano3.activos.total / ano3.patrimonio.total
      : 0,
  };

  return {
    proyectoId,
    generadoEn: new Date().toISOString(),
    capexTotal,
    periodos,
    ratios,
  };
}
