const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
})

function formatCOP(value) {
  return copFormatter.format(Number(value) || 0)
}

export function AdminReportTable({ reportType, reportData, reportModel }) {
  const data = Array.isArray(reportData) ? reportData : []
  const cropRows = [...new Map(data.map((row) => [row.id, row])).values()]
  const resumen = {
    produccionKg: data.reduce((total, row) => total + (Number(row.total_produccion) || 0), 0),
    ingresos: data.reduce((total, row) => total + (Number(row.total_ingresos) || 0), 0),
  }
  const productionUnits = new Set(data.map((row) => row.unidad_base).filter(Boolean))
  const productionRows = data.filter((row) => row.total_produccion != null)
  const productionComparable = productionRows.length > 0 &&
    productionRows.every((row) => row.unidad_base) &&
    productionUnits.size === 1

  if (reportType === 'por-cultivo') {
    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Cultivo</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Cultivos</label>
              <div className="valor">{cropRows.length}</div>
          </div>
          <div className="resumen-item">
            <label>Cultivos Activos</label>
              <div className="valor">{cropRows.filter((crop) => String(crop.estado || '').toLowerCase() !== 'finalizado').length}</div>
          </div>
          <div className="resumen-item">
            <label>Producción Total</label>
            <div className="valor">
              {productionComparable
                ? `${resumen.produccionKg.toLocaleString('es-CO')} ${[...productionUnits][0]}`
                : 'No comparable (configure conversiones)'}
            </div>
          </div>
          <div className="resumen-item">
            <label>Ingresos Totales</label>
            <div className="valor">{formatCOP(resumen.ingresos)}</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Tipo de cultivo</th>
              <th>Etapa</th>
              <th>Estado</th>
              <th>Producción</th>
              <th>Costos</th>
              <th>Ingresos</th>
              <th>Ganancia</th>
              <th>Costo unitario del cultivo</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>
                  Sin resultados para los filtros seleccionados
                </td>
              </tr>
            ) : (
              data.map((crop) => (
                <tr key={`${crop.id}-${crop.etapaId ?? 'sin-etapa'}`}>
                  <td>{crop.cultivo}</td>
                  <td>{crop.tipo_cultivo || '--'}</td>
                  <td>{crop.etapa || 'Sin etapa asociada'}</td>
                  <td>{crop.estado || '--'}</td>
                  <td>{crop.total_produccion == null ? (crop.etapa ? 'Sin conversión' : '--') : `${Number(crop.total_produccion).toLocaleString('es-CO')} ${crop.unidad_base || ''}`}</td>
                  <td>{formatCOP(crop.total_costos)}</td>
                  <td>{formatCOP(crop.total_ingresos)}</td>
                  <td>{formatCOP(crop.ganancia ?? (Number(crop.total_ingresos || 0) - Number(crop.total_costos || 0)))}</td>
                  <td>{crop.costo_unitario == null ? '--' : `${formatCOP(crop.costo_unitario)} / ${crop.unidad_base || 'unidad base'}`}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'costos') {
    const totals = reportModel?.totals || { ingresos: '0.00', costos: '0.00', ganancia: '0.00', margen: 0 }

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte de Costos</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Ingresos</label>
            <div className="valor">{formatCOP(totals.ingresos)}</div>
          </div>
          <div className="resumen-item">
            <label>Total Costos</label>
            <div className="valor">{formatCOP(totals.costos)}</div>
          </div>
          <div className="resumen-item">
            <label>Ganancia total</label>
            <div className="valor">{formatCOP(totals.ganancia)}</div>
          </div>
          <div className="resumen-item">
            <label>Margen</label>
            <div className="valor">{(Number(totals.margen) * 100).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cultivo</th>
              <th>Etapa</th>
              <th>Categoría</th>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Valor unitario</th>
              <th>Costo COP</th>
              <th>Ingreso COP</th>
              <th>Ganancia COP</th>
              <th>Margen</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : data.map((row) => (
              <tr key={row.rowId}>
                <td>{row.fecha ? row.fecha.split('-').reverse().join('/') : ''}</td>
                <td>{row.cultivo}</td>
                <td>{row.etapa}</td>
                <td>{row.categoria}</td>
                <td>{row.concepto}</td>
                <td>{row.cantidad == null ? '' : Number(row.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 3 })}</td>
                <td>{row.unidad || ''}</td>
                <td>{row.valor_unitario == null ? '' : formatCOP(row.valor_unitario)}</td>
                <td>{formatCOP(row.costo)}</td>
                <td>{formatCOP(row.ingreso)}</td>
                <td>{formatCOP(row.ganancia)}</td>
                <td>{(Number(row.margen || 0) * 100).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'produccion') {
    const cosechas = data.map((row) => ({
      cultivo: row.cultivo,
      tipoCultivo: row.tipo_cultivo,
      etapa: row.etapa,
      cantidad: row.cantidad,
      cantidadBase: row.cantidad_unidad_base,
      unidadBase: row.unidad_base,
      unidad: row.unidad || 'kg',
      fecha: row.fecha,
      precio: row.precio_unitario || 0,
      ingreso: (Number(row.cantidad) || 0) * (Number(row.precio_unitario) || 0),
    }))
    const converted = cosechas.length > 0 && cosechas.every((x) => x.cantidadBase != null)
    const unitGroups = new Map()
    for (const harvest of cosechas) {
      if (harvest.cantidadBase == null || !harvest.unidadBase) continue
      unitGroups.set(
        harvest.unidadBase,
        (unitGroups.get(harvest.unidadBase) || 0) + Number(harvest.cantidadBase)
      )
    }

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte de Producción</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Producción Total</label>
            <div className="valor">
              {converted && unitGroups.size === 1
                ? `${[...unitGroups.values()][0].toLocaleString('es-CO')} ${[...unitGroups.keys()][0]}`
                : 'No comparable (configure conversiones)'}
            </div>
          </div>
          <div className="resumen-item">
            <label>Cosechas Realizadas</label>
            <div className="valor">{cosechas.length}</div>
          </div>
          <div className="resumen-item">
            <label>Promedio por Cosecha</label>
            <div className="valor">
              {converted && unitGroups.size === 1
                ? `${([ ...unitGroups.values()][0] / cosechas.length).toLocaleString('es-CO')} ${[...unitGroups.keys()][0]}`
                : '--'}
            </div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Tipo</th>
              <th>Etapa</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Unidad base</th>
              <th>Fecha Cosecha</th>
              <th>Precio Unitario</th>
              <th>Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {cosechas.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : cosechas.map((c, i) => (
              <tr key={i}>
                <td>{c.cultivo}</td>
                <td>{c.tipoCultivo || '--'}</td>
                <td>{c.etapa || '--'}</td>
                <td>{(Number(c.cantidad) || 0).toLocaleString('es-CO')}</td>
                <td>{c.unidad || 'kg'}</td>
                <td>{c.cantidadBase == null ? '--' : `${Number(c.cantidadBase).toLocaleString('es-CO')} ${c.unidadBase}`}</td>
                <td>{c.fecha}</td>
                <td>{formatCOP(c.precio)}</td>
                <td>{formatCOP(Number(c.ingreso) || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'rentabilidad') {
    const rows = data.map((row) => ({
      id: row.id,
      cultivo: row.cultivo,
      tipoCultivo: row.tipo_cultivo,
      etapa: row.etapa,
      ingresos: Number(row.total_ingresos || 0),
      costos: Number(row.total_costos || 0),
      ganancia: Number(row.ganancia || 0),
      costoUnitario: row.costo_unitario,
      unidadBase: row.unidad_base,
      margen: row.total_ingresos ? ((Number(row.ganancia || 0) / Number(row.total_ingresos || 1)) * 100) : 0,
    }))
    const gananciaTotal = rows.reduce((a, x) => a + x.ganancia, 0)
    const ingresosTotal = rows.reduce((a, x) => a + x.ingresos, 0)
    const margenProm = ingresosTotal > 0 ? (gananciaTotal / ingresosTotal) * 100 : 0
    const cropProfitability = [...rows.reduce((grouped, row) => {
      const key = row.id ?? row.cultivo
      const current = grouped.get(key) || { cultivo: row.cultivo, ingresos: 0, ganancia: 0 }
      current.ingresos += row.ingresos
      current.ganancia += row.ganancia
      grouped.set(key, current)
      return grouped
    }, new Map()).values()]
      .map((crop) => ({
        ...crop,
        margen: crop.ingresos > 0 ? (crop.ganancia / crop.ingresos) * 100 : 0,
      }))
    const top = cropProfitability.sort((a, b) => b.margen - a.margen)[0]

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte de Rentabilidad</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Ganancia Total</label>
            <div className="valor">{formatCOP(gananciaTotal)}</div>
          </div>
          <div className="resumen-item">
            <label>Margen Promedio</label>
            <div className="valor">{Number(margenProm || 0).toFixed(1)}%</div>
          </div>
          <div className="resumen-item">
            <label>Cultivo Más Rentable</label>
            <div className="valor">{top ? top.cultivo : '--'}</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Tipo de cultivo</th>
              <th>Etapa</th>
              <th>Ingresos</th>
              <th>Costos</th>
              <th>Ganancia</th>
              <th>Costo unitario del cultivo</th>
              <th>Margen %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i}>
                <td>{r.cultivo}</td>
                <td>{r.tipoCultivo || '--'}</td>
                <td>{r.etapa || 'Sin etapa asociada'}</td>
                <td>{formatCOP(r.ingresos)}</td>
                <td>{formatCOP(r.costos)}</td>
                <td>{formatCOP(r.ganancia)}</td>
                <td>{r.costoUnitario == null ? '--' : `${formatCOP(r.costoUnitario)} / ${r.unidadBase || 'unidad base'}`}</td>
                <td>{Number(r.margen || 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'trabajador') {
    const displayRows = data.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      tipo_cultivo: row.tipo_cultivo,
      etapa: row.etapa,
      total_costos: Number(row.total_costos) > 0 ? Number(row.total_costos) : null,
      cultivos_asignados: row.cultivos_asignados || 0,
    }))

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Trabajador</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Trabajadores</label>
              <div className="valor">{new Set(displayRows.map((row) => row.id)).size}</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Tipo de cultivo</th>
              <th>Etapa</th>
              <th>Pagos de mano de obra</th>
              <th>Cultivos Asignados</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : displayRows.map((r, i) => (
              <tr key={i}>
                <td>{r.nombre}</td>
                <td>{r.tipo_cultivo || '--'}</td>
                <td>{r.etapa || '--'}</td>
                <td>{r.total_costos == null ? '--' : formatCOP(r.total_costos)}</td>
                <td>{r.cultivos ?? r.cultivos_asignados ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}
