import { useEffect, useState } from 'react'
import { fetchUnidadesMedida } from '../services/cultivoService.js'
import { fetchAvailableKardexOutputs } from '../services/costeoService.js'
import {
  formatMateriaPrimaCOP,
  formatMateriaPrimaQuantity,
} from '../utils/materiaPrimaDetalles.js'
import { getCompatibleMateriaPrimaUnits } from '../utils/materiaPrimaUnits.js'
import './MateriaPrimaConsumptionFields.css'

const EMPTY_LINE = { idKardex: '', cantidad: '', unidadId: '' }
const roundCOP = (value) => Math.round((value + Number.EPSILON) * 100) / 100

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'No se pudieron consultar los datos de inventario.'
}

export default function MateriaPrimaConsumptionFields({
  fincaId,
  cultivoId,
  onChange,
  error,
}) {
  const [outputs, setOutputs] = useState([])
  const [units, setUnits] = useState([])
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([
      fetchAvailableKardexOutputs(fincaId, cultivoId),
      fetchUnidadesMedida(),
    ])
      .then(([outputRows, unitRows]) => {
        if (!Array.isArray(outputRows) || !Array.isArray(unitRows)) {
          throw new Error('La respuesta de inventario o unidades de medida no tiene el formato esperado.')
        }
        if (active) {
          setOutputs(outputRows)
          setUnits(unitRows)
        }
      })
      .catch((fetchError) => {
        if (active) setLoadError(errorMessage(fetchError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [fincaId, cultivoId])

  const getOutput = (idKardex) => outputs.find((item) => String(item.idKardex) === String(idKardex))

  const isLineValid = (line, selectedIds) => {
    const idKardex = Number(line.idKardex)
    const amount = Number(line.cantidad)
    const output = getOutput(line.idKardex)
    const compatibleUnits = getCompatibleMateriaPrimaUnits(output?.unidad, units)
    const compatibleUnitSelected = compatibleUnits.some(
      (unit) => String(unit.id) === String(line.unidadId)
    )

    if (!output || !compatibleUnitSelected || !Number.isFinite(amount) ||
        amount <= 0 || amount > Number(output.cantidadDisponible) || selectedIds.has(idKardex)) {
      return false
    }

    selectedIds.add(idKardex)
    return true
  }

  const linesAreValid = (candidateLines) => {
    if (loading || loadError || !candidateLines.length) return false
    const selectedIds = new Set()
    return candidateLines.every((line) => isLineValid(line, selectedIds))
  }

  const calculateTotal = (candidateLines) => candidateLines.reduce((sum, line) => {
    const output = getOutput(line.idKardex)
    const subtotal = (Number(line.cantidad) || 0) * (Number(output?.costoUnitario) || 0)
    return sum + roundCOP(subtotal)
  }, 0)

  const publishLines = (nextLines) => {
    setLines(nextLines)
    onChange(nextLines, calculateTotal(nextLines), linesAreValid(nextLines))
  }

  const updateLine = (index, field, value) => {
    const nextLines = lines.map((line, lineIndex) => {
      if (lineIndex !== index) return line
      if (field === 'idKardex') {
        const output = getOutput(value)
        const compatibleUnit = getCompatibleMateriaPrimaUnits(output?.unidad, units)[0]
        return {
          ...line,
          idKardex: value,
          cantidad: '',
          unidadId: compatibleUnit ? String(compatibleUnit.id) : '',
        }
      }
      return { ...line, [field]: value }
    })
    publishLines(nextLines)
  }

  const addLine = () => {
    if (lines.length < 100 && linesAreValid(lines)) {
      publishLines([...lines, { ...EMPTY_LINE }])
    }
  }

  const removeLine = (index) => {
    publishLines(lines.filter((_, lineIndex) => lineIndex !== index))
  }

  const total = calculateTotal(lines)
  const canAddLine = linesAreValid(lines) && lines.length < 100 && outputs.length > 0

  return (
    <section className="mp-consumption" aria-label="Detalle del consumo de Materia Prima">
      <div className="mp-consumption__intro">
        <span className="mp-consumption__eyebrow">Consumo asociado al cultivo</span>
        <h3>¿Qué productos se utilizaron?</h3>
        <p>
          Selecciona una salida de inventario, indica cuánto utilizaste y el subtotal
          se calculará automáticamente con el costo registrado en Kardex.
        </p>
      </div>

      {loading ? <p className="mp-consumption__notice">Cargando salidas y unidades de medida...</p> : null}
      {loadError ? <p className="mp-consumption__error" role="alert">{loadError}</p> : null}
      {!loading && !loadError && outputs.length === 0 ? (
        <p className="mp-consumption__notice">
          Este cultivo no tiene salidas de inventario disponibles para consumir.
        </p>
      ) : null}

      {lines.map((line, index) => {
        const output = getOutput(line.idKardex)
        const compatibleUnits = getCompatibleMateriaPrimaUnits(output?.unidad, units)
        const selectedUnit = units.find((unit) => String(unit.id) === String(line.unidadId))
        const usedIds = new Set(
          lines.filter((_, lineIndex) => lineIndex !== index).map((item) => String(item.idKardex))
        )
        const subtotal = roundCOP(
          (Number(line.cantidad) || 0) * (Number(output?.costoUnitario) || 0)
        )

        return (
          <fieldset className="mp-consumption__line" key={index}>
            <legend>Producto {index + 1}</legend>

            <label className="mp-consumption__field">
              <span>Salida de inventario</span>
              <select
                required
                value={line.idKardex}
                disabled={loading || loadError || outputs.length === 0}
                onChange={(event) => updateLine(index, 'idKardex', event.target.value)}
              >
                <option value="">Selecciona el producto y su salida</option>
                {outputs.map((item) => (
                  <option
                    key={item.idKardex}
                    value={item.idKardex}
                    disabled={usedIds.has(String(item.idKardex))}
                  >
                    {item.producto} · Salida #{item.idKardex} · Disponible:{' '}
                    {formatMateriaPrimaQuantity(item.cantidadDisponible)} {item.unidad}
                  </option>
                ))}
              </select>
            </label>

            {output ? (
              <div className="mp-consumption__product">
                <div className="mp-consumption__product-heading">
                  <h4>{output.producto}</h4>
                  <span>Salida #{output.idKardex}</span>
                </div>
                <p className="mp-consumption__reference">{output.referencia || 'Salida de inventario'}</p>
                <div className="mp-consumption__facts">
                  <div>
                    <span>Disponible de esta salida</span>
                    <strong>
                      {formatMateriaPrimaQuantity(output.cantidadDisponible)} {output.unidad}
                    </strong>
                  </div>
                  <div>
                    <span>Costo por {output.unidad}</span>
                    <strong>{formatMateriaPrimaCOP(output.costoUnitario)}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mp-consumption__inputs">
              <label className="mp-consumption__field">
                <span>Cantidad utilizada</span>
                <input
                  type="number"
                  min="0.000001"
                  max={output?.cantidadDisponible}
                  step="0.000001"
                  required
                  disabled={!output || compatibleUnits.length === 0}
                  value={line.cantidad}
                  placeholder="Ej. 20"
                  onChange={(event) => updateLine(index, 'cantidad', event.target.value)}
                />
              </label>
              <label className="mp-consumption__field">
                <span>Unidad de medida</span>
                <select
                  required
                  value={line.unidadId}
                  disabled={!output || loading || units.length === 0}
                  onChange={(event) => updateLine(index, 'unidadId', event.target.value)}
                >
                  <option value="">Selecciona una unidad</option>
                  {units.map((unit) => {
                    const compatible = compatibleUnits.some(
                      (compatibleUnit) => String(compatibleUnit.id) === String(unit.id)
                    )
                    return (
                      <option key={unit.id} value={unit.id} disabled={!compatible}>
                        {unit.nombre}{compatible ? '' : ' (no compatible con esta salida)'}
                      </option>
                    )
                  })}
                </select>
              </label>
            </div>

            {output && compatibleUnits.length === 0 ? (
              <p className="mp-consumption__error" role="alert">
                La unidad “{output.unidad}” de esta salida no está en el catálogo de unidades
                de medida. No se puede registrar el consumo hasta agregarla al catálogo.
              </p>
            ) : null}
            {output && compatibleUnits.length > 0 ? (
              <p className="mp-consumption__unit-note">
                Para cuidar el saldo y el cálculo, solo se permite la unidad compatible con la salida.
                {selectedUnit ? ` Unidad aplicada: ${selectedUnit.nombre}.` : ''}
              </p>
            ) : null}

            <div className="mp-consumption__subtotal">
              <span>
                {formatMateriaPrimaQuantity(line.cantidad || 0)}{' '}
                {selectedUnit?.nombre || output?.unidad || 'unidades'}
                {output ? ` × ${formatMateriaPrimaCOP(output.costoUnitario)} / ${output.unidad}` : ''}
              </span>
              <strong>
                <small>Subtotal</small>
                {formatMateriaPrimaCOP(subtotal)}
              </strong>
            </div>

            {lines.length > 1 ? (
              <button
                className="mp-consumption__remove"
                type="button"
                onClick={() => removeLine(index)}
              >
                Quitar producto
              </button>
            ) : null}
          </fieldset>
        )
      })}

      <div className="mp-consumption__actions">
        <button
          className="mp-consumption__add"
          type="button"
          disabled={!canAddLine}
          onClick={addLine}
        >
          <span aria-hidden="true">+</span> Agregar producto
        </button>
        <span className="mp-consumption__action-hint">
          {lines.length === 1 ? 'Puedes asociar varias salidas a este costo.' : `${lines.length} productos agregados.`}
        </span>
      </div>

      <div className="mp-consumption__total" aria-live="polite">
        <div>
          <span>Total del costo de Materia Prima</span>
          <small>Es la suma de los subtotales de los productos utilizados.</small>
        </div>
        <strong>{formatMateriaPrimaCOP(total)}</strong>
      </div>

      {error ? <p className="mp-consumption__error" role="alert">{error}</p> : null}
    </section>
  )
}
