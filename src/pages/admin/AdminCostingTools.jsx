import { useEffect, useMemo, useState } from 'react'
import * as costeoService from '../../services/costeoService'
import {
  fetchEtapaEnProcesoPorCultivo,
  fetchEstadosPago,
} from '../../services/cultivoService'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
const EMPTY_CROPS = Object.freeze([])
const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
}).format(Number(value) || 0)

function messageFrom(error) {
  return error?.response?.data?.message || error?.message || 'No se pudo completar la operación.'
}

export default function AdminCostingTools({ fincaId, filterOptions, onNotify, onSaved }) {
  const [configuration, setConfiguration] = useState(null)
  const [allocations, setAllocations] = useState([])
  const [availableOutputs, setAvailableOutputs] = useState([])
  const [inventoryLines, setInventoryLines] = useState([{ idKardex: '', cantidad: '' }])
  const [paymentStates, setPaymentStates] = useState([])
  const [inventoryActiveStage, setInventoryActiveStage] = useState(null)
  const [laborActiveStage, setLaborActiveStage] = useState(null)
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [typeName, setTypeName] = useState('')
  const [typeIsEditing, setTypeIsEditing] = useState(false)
  const [stageName, setStageName] = useState('')
  const [stageDescription, setStageDescription] = useState('')
  const [editingStageId, setEditingStageId] = useState(null)
  const [selectedTypeStages, setSelectedTypeStages] = useState([])
  const [conversions, setConversions] = useState([])
  const [laborForm, setLaborForm] = useState({
    cultivoId: '',
    trabajadorId: '',
    subcategoriaId: '',
    estadoPagoId: '',
    valor: '',
    fecha: today,
    descripcion: '',
  })
  const [inventoryForm, setInventoryForm] = useState({
    cultivoId: '',
    subcategoriaId: '',
    estadoPagoId: '',
    descripcion: '',
    fecha: today,
  })
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [outputsLoading, setOutputsLoading] = useState(false)
  const [outputsError, setOutputsError] = useState('')

  const activeCrops = filterOptions?.cultivos ?? EMPTY_CROPS
  const users = (filterOptions?.usuarios || []).filter((user) =>
    ['worker', 'trabajador', '2'].includes(String(user.rol || '').toLowerCase())
  )
  const typeOptions = configuration?.tiposCultivo || []
  const stageCatalog = configuration?.catalogoEtapas || []
  const unitOptions = configuration?.unidades || []

  const category7105 = useMemo(
    () => (filterOptions?.categorias || []).find((item) => String(item.codigoContable) === '7105'),
    [filterOptions]
  )
  const category7205 = useMemo(
    () => (filterOptions?.categorias || []).find((item) => String(item.codigoContable) === '7205'),
    [filterOptions]
  )
  const materialSubcategories = (filterOptions?.subcategorias || []).filter(
    (item) => String(item.categoriaId) === String(category7105?.id)
  )
  const laborSubcategories = (filterOptions?.subcategorias || []).filter(
    (item) => String(item.categoriaId) === String(category7205?.id)
  )
  const inventoryTotal = inventoryLines.reduce((sum, line) => {
    const output = availableOutputs.find((item) => String(item.idKardex) === String(line.idKardex))
    return sum + (Number(line.cantidad) || 0) * (Number(output?.costoUnitario) || 0)
  }, 0)
  const allocationTotal = allocations.reduce((sum, item) => sum + (Number(item.porcentaje) || 0), 0)
  const selectedType = typeOptions.find((item) => String(item.id) === String(selectedTypeId))

  const notify = (text, kind = 'info') => {
    if (typeof onNotify === 'function') onNotify(text, kind)
  }

  const refreshConfiguration = async () => {
    const data = await costeoService.fetchCostingConfiguration()
    setConfiguration(data)
    if (!data.tiposCultivo?.some((item) => String(item.id) === String(selectedTypeId)) && data.tiposCultivo?.length) {
      setSelectedTypeId(String(data.tiposCultivo[0].id))
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [config, estadosPago] = await Promise.all([
          costeoService.fetchCostingConfiguration(),
          fetchEstadosPago(),
        ])
        if (!active) return
        setConfiguration(config)
        setPaymentStates(Array.isArray(estadosPago) ? estadosPago : estadosPago?.data || [])
        if (config.tiposCultivo?.length) setSelectedTypeId(String(config.tiposCultivo[0].id))
        setLoadError('')
      } catch (error) {
        if (active) setLoadError(messageFrom(error))
      }
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadFincaOptions() {
      if (!fincaId) {
        setAllocations([])
        return
      }
      try {
        const allocationRows = await costeoService.fetchGeneralCostAllocations(fincaId)
        if (active) {
          setAllocations((activeCrops || []).map((crop) => {
            const existing = allocationRows.find((row) => Number(row.cultivoId) === Number(crop.id))
            return { cultivoId: Number(crop.id), porcentaje: existing?.porcentaje || '' }
          }))
        }
      } catch (error) {
        if (active) setLoadError(messageFrom(error))
      }
    }
    loadFincaOptions()
    return () => { active = false }
  }, [fincaId, activeCrops])

  useEffect(() => {
    let active = true
    async function loadAvailableOutputs() {
      if (!fincaId || !inventoryForm.cultivoId) {
        setAvailableOutputs([])
        setOutputsError('')
        setOutputsLoading(false)
        return
      }
      setOutputsLoading(true)
      setAvailableOutputs([])
      setOutputsError('')
      try {
        const rows = await costeoService.fetchAvailableKardexOutputs(fincaId, inventoryForm.cultivoId)
        if (active) setAvailableOutputs(rows)
      } catch (error) {
        if (active) {
          setAvailableOutputs([])
          setOutputsError(messageFrom(error))
        }
      } finally {
        if (active) setOutputsLoading(false)
      }
    }
    loadAvailableOutputs()
    return () => { active = false }
  }, [fincaId, inventoryForm.cultivoId])

  useEffect(() => {
    let active = true
    async function loadSelectedTypeConfig() {
      if (!selectedTypeId || !configuration) return
      try {
        const [unitRows] = await Promise.all([
          costeoService.fetchUnitConversions(selectedTypeId),
        ])
        if (!active) return
        setSelectedTypeStages(
          configuration.etapasPorTipo
            .filter((item) => Number(item.tipoCultivoId) === Number(selectedTypeId) && item.activo)
            .map((item) => Number(item.etapaId))
        )
        setConversions(unitRows)
      } catch (error) {
        if (active) setLoadError(messageFrom(error))
      }
    }
    loadSelectedTypeConfig()
    return () => { active = false }
  }, [selectedTypeId, configuration])

  useEffect(() => {
    let isMounted = true
    async function loadInventoryStage() {
      if (!inventoryForm.cultivoId) {
        setInventoryActiveStage(null)
        return
      }
      setInventoryActiveStage(null)
      try {
        const etapa = await fetchEtapaEnProcesoPorCultivo(inventoryForm.cultivoId)
        if (isMounted) setInventoryActiveStage(etapa?.data || etapa)
      } catch (error) {
        if (isMounted) setLoadError(messageFrom(error))
      }
    }
    loadInventoryStage()
    return () => { isMounted = false }
  }, [inventoryForm.cultivoId])

  useEffect(() => {
    let isMounted = true
    async function loadLaborStage() {
      if (!laborForm.cultivoId) {
        setLaborActiveStage(null)
        return
      }
      try {
        const etapa = await fetchEtapaEnProcesoPorCultivo(laborForm.cultivoId)
        if (isMounted) setLaborActiveStage(etapa?.data || etapa)
      } catch (error) {
        if (isMounted) setLoadError(messageFrom(error))
      }
    }
    loadLaborStage()
    return () => { isMounted = false }
  }, [laborForm.cultivoId])

  const updateAllocation = (cultivoId, porcentaje) => {
    setAllocations((current) => current.map((item) =>
      Number(item.cultivoId) === Number(cultivoId) ? { ...item, porcentaje } : item
    ))
  }

  const updateInventoryLine = (index, key, value) => {
    setInventoryLines((current) => current.map((line, lineIndex) =>
      lineIndex === index
        ? { ...line, [key]: value, ...(key === 'idKardex' ? { cantidad: '' } : {}) }
        : line
    ))
  }

  const addInventoryLine = () => {
    setInventoryLines((current) => current.length >= 100
      ? current
      : [...current, { idKardex: '', cantidad: '' }])
  }

  const removeInventoryLine = (index) => {
    setInventoryLines((current) => current.length <= 1
      ? current
      : current.filter((_, lineIndex) => lineIndex !== index))
  }

  const saveAllocations = async () => {
    const rows = allocations
      .filter((item) => item.porcentaje !== '' && Number(item.porcentaje) > 0)
      .map((item) => ({ cultivoId: Number(item.cultivoId), porcentaje: Number(item.porcentaje) }))
    setBusy(true)
    try {
      await costeoService.saveGeneralCostAllocations(fincaId, rows)
      notify(rows.length ? 'Prorrateo guardado. Los porcentajes suman 100%.' : 'Prorrateo eliminado; los costos generales quedarán sin asignar.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveStages = async () => {
    if (!selectedTypeId) return
    setBusy(true)
    try {
      await costeoService.saveCropTypeStages(Number(selectedTypeId), selectedTypeStages)
      await refreshConfiguration()
      notify('Etapas del tipo de cultivo guardadas.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveConversions = async () => {
    if (!selectedTypeId) return
    setBusy(true)
    try {
      await costeoService.saveUnitConversions(Number(selectedTypeId), conversions.map((item) => ({
        unidadId: Number(item.unidadId),
        factor: Number(item.factor),
        esUnidadBase: item.esUnidadBase === true,
      })))
      notify('Conversiones de unidades guardadas.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveType = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (typeIsEditing && selectedType) {
        await costeoService.updateCropType(selectedType.id, typeName.trim())
      } else {
        const created = await costeoService.createCropType(typeName.trim())
        setSelectedTypeId(String(created.id))
      }
      setTypeName('')
      setTypeIsEditing(false)
      await refreshConfiguration()
      notify('Tipo de cultivo guardado.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveStage = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (editingStageId) {
        await costeoService.updateStage(editingStageId, stageName.trim(), stageDescription.trim())
      } else {
        await costeoService.createStage(stageName.trim(), stageDescription.trim())
      }
      setStageName('')
      setStageDescription('')
      setEditingStageId(null)
      await refreshConfiguration()
      notify('Etapa guardada.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitInventoryConsumption = async (event) => {
    event.preventDefault()
    if (!fincaId || !inventoryActiveStage?.idetapacultivo) {
      notify('El cultivo debe tener una etapa activa En Proceso.', 'error')
      return
    }
    const details = inventoryLines.map((line) => ({
      idKardex: Number(line.idKardex),
      cantidad: Number(line.cantidad),
    }))
    const selectedOutputs = new Set()
    const invalidLine = inventoryLines.some((line, index) => {
      const output = availableOutputs.find((item) => String(item.idKardex) === String(line.idKardex))
      const amount = Number(line.cantidad)
      if (!output || !Number.isFinite(amount) || amount <= 0 ||
          amount > Number(output.cantidadDisponible) || selectedOutputs.has(details[index].idKardex)) {
        return true
      }
      selectedOutputs.add(details[index].idKardex)
      return false
    })
    if (outputsLoading || invalidLine) {
      notify('Selecciona salidas disponibles y cantidades válidas, sin repetirlas.', 'error')
      return
    }
    setBusy(true)
    try {
      await costeoService.registerInventoryConsumption({
        fincaId: Number(fincaId),
        cultivoId: Number(inventoryForm.cultivoId),
        subcategoriaId: Number(inventoryForm.subcategoriaId),
        estadoPagoId: Number(inventoryForm.estadoPagoId),
        detalles: details,
        descripcion: inventoryForm.descripcion,
        fecha: inventoryForm.fecha,
      })
      setInventoryForm((current) => ({ ...current, descripcion: '' }))
      setInventoryLines([{ idKardex: '', cantidad: '' }])
      notify('Costo de Materia Prima registrado; no se modificó el Kardex ni las existencias.', 'success')
      if (typeof onSaved === 'function') {
        try {
          await onSaved(Number(inventoryForm.cultivoId))
        } catch (error) {
          notify(`El costo se guardó, pero no se pudo actualizar la tabla de costos: ${messageFrom(error)}`, 'error')
        }
      }
      try {
        const outputs = await costeoService.fetchAvailableKardexOutputs(fincaId, inventoryForm.cultivoId)
        setAvailableOutputs(outputs)
      } catch (error) {
        setOutputsError(messageFrom(error))
        notify('El costo se guardó, pero no se pudo actualizar la lista de salidas disponibles.', 'error')
      }
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitLaborPayment = async (event) => {
    event.preventDefault()
    if (!fincaId || !laborActiveStage?.idetapacultivo) {
      notify('El cultivo debe tener una etapa activa En Proceso.', 'error')
      return
    }
    setBusy(true)
    try {
      await costeoService.registerLaborPayment({
        fincaId: Number(fincaId),
        cultivoId: Number(laborForm.cultivoId),
        etapaId: Number(laborActiveStage.idetapacultivo),
        trabajadorId: Number(laborForm.trabajadorId),
        subcategoriaId: Number(laborForm.subcategoriaId),
        estadoPagoId: Number(laborForm.estadoPagoId),
        valor: laborForm.valor,
        fecha: laborForm.fecha,
        descripcion: laborForm.descripcion,
      })
      setLaborForm((current) => ({ ...current, valor: '', descripcion: '' }))
      notify('Pago de mano de obra registrado como costo y asociado al trabajador.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveAccountConfig = async (item, event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await costeoService.saveSubcategoryConfig(
        item.subcategoriaId,
        form.get('codigo') || null,
        form.get('incluir') === 'on'
      )
      await refreshConfiguration()
      notify('Configuración de cuenta guardada.', 'success')
    } catch (error) {
      notify(messageFrom(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loadError && !configuration) {
    return <p role="alert">No se cargó la configuración de costeo: {loadError}</p>
  }

  return (
    <details className="costeo-tools">
      <summary>Costeo agrícola: configuración, mano de obra e inventario</summary>
      {loadError ? <p role="alert">{loadError}</p> : null}
      {!fincaId ? <p>Selecciona una finca para habilitar las operaciones de costeo.</p> : null}
      <div className="costeo-tools-grid">
        <section>
          <h3>Tipos de cultivo</h3>
          <form onSubmit={saveType}>
            <label>
              Tipo
              <select value={selectedTypeId} onChange={(event) => setSelectedTypeId(event.target.value)}>
                {typeOptions.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.activo ? '' : ' (inactivo)'}</option>)}
              </select>
            </label>
            <label>
              Nombre de tipo nuevo o edición
              <input value={typeName} maxLength={100} onChange={(event) => setTypeName(event.target.value)} />
            </label>
            <button type="submit" disabled={busy || !typeName.trim()}>
              {typeIsEditing ? 'Guardar tipo' : 'Agregar tipo'}
            </button>
            {selectedType?.activo ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setTypeName(selectedType.nombre)
                  setTypeIsEditing(true)
                }}
              >
                Editar tipo seleccionado
              </button>
            ) : null}
            {selectedType ? (
              <button
                type="button"
                disabled={busy || (selectedType.activo && Boolean(activeCrops.some((crop) => Number(crop.idtipocultivo) === Number(selectedType.id))))}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await costeoService.changeCropTypeState(selectedType.id, !selectedType.activo)
                    await refreshConfiguration()
                    notify(selectedType.activo ? 'Tipo desactivado.' : 'Tipo reactivado.', 'success')
                  } catch (error) {
                    notify(messageFrom(error), 'error')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {selectedType.activo ? 'Desactivar tipo' : 'Reactivar tipo'}
              </button>
            ) : null}
          </form>

          <form onSubmit={saveStage}>
            <h4>{editingStageId ? 'Editar etapa' : 'Agregar etapa al catálogo'}</h4>
            <label>
              Nombre
              <input required value={stageName} maxLength={100} onChange={(event) => setStageName(event.target.value)} />
            </label>
            <label>
              Descripción
              <input value={stageDescription} maxLength={2000} onChange={(event) => setStageDescription(event.target.value)} />
            </label>
            <button type="submit" disabled={busy || !stageName.trim()}>{editingStageId ? 'Guardar etapa' : 'Agregar etapa'}</button>
            {editingStageId ? (
              <button type="button" onClick={() => { setEditingStageId(null); setStageName(''); setStageDescription('') }}>
                Cancelar edición
              </button>
            ) : null}
          </form>
          {stageCatalog.map((stage) => (
            <div key={stage.id} className="costeo-account-row">
              <span>{stage.nombre}{stage.activo ? '' : ' (inactiva)'}</span>
              <button type="button" disabled={busy || !stage.activo} onClick={() => {
                setEditingStageId(stage.id)
                setStageName(stage.nombre)
                setStageDescription(stage.descripcion || '')
              }}>Editar</button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await costeoService.changeStageState(stage.id, !stage.activo)
                    await refreshConfiguration()
                    notify(stage.activo ? 'Etapa desactivada.' : 'Etapa reactivada.', 'success')
                  } catch (error) {
                    notify(messageFrom(error), 'error')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {stage.activo ? 'Desactivar' : 'Reactivar'}
              </button>
            </div>
          ))}
          <fieldset>
            <legend>Etapas habilitadas para este tipo</legend>
            <p>Si no se asigna ninguna etapa, se conserva la compatibilidad y se permiten todas las etapas activas.</p>
            {stageCatalog.filter((stage) => stage.activo).map((stage) => (
              <label key={stage.id} className="costeo-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTypeStages.includes(Number(stage.id))}
                  onChange={(event) => setSelectedTypeStages((current) =>
                    event.target.checked
                      ? [...current, Number(stage.id)]
                      : current.filter((id) => id !== Number(stage.id))
                  )}
                />
                {stage.nombre}
              </label>
            ))}
            <button type="button" disabled={busy || !selectedTypeId || !selectedType?.activo} onClick={saveStages}>Guardar etapas</button>
          </fieldset>
        </section>

        <section id="conversiones-unidades-costeo">
          <h3>Conversión de unidades</h3>
          <p>Factor = cantidad en la unidad base por cada unidad indicada.</p>
          <label>
            Tipo de cultivo
            <select value={selectedTypeId} onChange={(event) => setSelectedTypeId(event.target.value)}>
              {typeOptions.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>
          {unitOptions.map((unit) => {
            const conversion = conversions.find((item) => Number(item.unidadId) === Number(unit.id))
            return (
              <label key={unit.id} className="costeo-conversion">
                <input
                  type="checkbox"
                  checked={Boolean(conversion)}
                  onChange={(event) => setConversions((current) => event.target.checked
                    ? [...current, { unidadId: Number(unit.id), factor: 1, esUnidadBase: false }]
                    : current.filter((item) => Number(item.unidadId) !== Number(unit.id)))}
                />
                {unit.nombre}
                {conversion ? (
                  <>
                    <input
                      type="number"
                      min="0.00000001"
                      step="any"
                      value={conversion.factor}
                      disabled={conversion.esUnidadBase}
                      onChange={(event) => setConversions((current) => current.map((item) =>
                        Number(item.unidadId) === Number(unit.id)
                          ? { ...item, factor: event.target.value }
                          : item
                      ))}
                    />
                    <input
                      type="radio"
                      name="unidadBase"
                      checked={conversion.esUnidadBase}
                      onChange={() => setConversions((current) => current.map((item) => ({
                        ...item,
                        esUnidadBase: Number(item.unidadId) === Number(unit.id),
                        factor: Number(item.unidadId) === Number(unit.id) ? 1 : item.factor,
                      })))}
                    />
                    Base
                  </>
                ) : null}
              </label>
            )
          })}
          <button type="button" disabled={busy || !selectedTypeId || !selectedType?.activo} onClick={saveConversions}>Guardar conversiones</button>
        </section>

        <section>
          <h3>Prorrateo de costos generales</h3>
          <p>El porcentaje debe sumar 100%. Sin configuración, el costo queda visible como general sin prorratear.</p>
          {activeCrops.map((crop) => {
            const item = allocations.find((allocation) => Number(allocation.cultivoId) === Number(crop.id))
            return (
              <label key={crop.id}>
                {crop.nombre}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.0001"
                  value={item?.porcentaje ?? ''}
                  onChange={(event) => updateAllocation(crop.id, event.target.value)}
                />
                %
              </label>
            )
          })}
          <p>Total: {allocationTotal.toFixed(4)}%</p>
          <button type="button" disabled={busy || !fincaId} onClick={saveAllocations}>Guardar prorrateo</button>
        </section>

        <section>
          <h3>Registrar costo de Materia Prima (7105)</h3>
          <form onSubmit={submitInventoryConsumption}>
            <label>
              Cultivo
              <select
                required
                value={inventoryForm.cultivoId}
                onChange={(event) => {
                  setInventoryForm((current) => ({ ...current, cultivoId: event.target.value }))
                  setInventoryLines([{ idKardex: '', cantidad: '' }])
                }}
              >
                <option value="">Selecciona un cultivo</option>
                {activeCrops.map((crop) => <option key={crop.id} value={crop.id}>{crop.nombre}</option>)}
              </select>
            </label>
            <label>
              Subcategoría de materia prima
              <select required value={inventoryForm.subcategoriaId} onChange={(event) => setInventoryForm((current) => ({ ...current, subcategoriaId: event.target.value }))}>
                <option value="">Selecciona</option>
                {materialSubcategories.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <label>
              Estado de pago
              <select required value={inventoryForm.estadoPagoId} onChange={(event) => setInventoryForm((current) => ({ ...current, estadoPagoId: event.target.value }))}>
                <option value="">Selecciona</option>
                {paymentStates.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <p>
              Etapa activa: {inventoryActiveStage?.nombre_etapa || inventoryActiveStage?.nombre || 'Sin etapa activa'}
            </p>
            {outputsLoading ? <p>Consultando salidas destinadas al cultivo...</p> : null}
            {outputsError ? <p role="alert">{outputsError}</p> : null}
            {!outputsLoading && !outputsError && inventoryForm.cultivoId && availableOutputs.length === 0
              ? <p>No hay salidas de Kardex disponibles para este cultivo.</p>
              : null}
            {inventoryLines.map((line, index) => {
              const output = availableOutputs.find((item) => String(item.idKardex) === String(line.idKardex))
              const usedOutputIds = new Set(inventoryLines
                .filter((_, lineIndex) => lineIndex !== index)
                .map((item) => String(item.idKardex)))
              return (
                <fieldset key={index}>
                  <legend>Producto {index + 1}</legend>
                  <label>
                    Salida de Kardex
                    <select
                      required
                      value={line.idKardex}
                      disabled={!inventoryForm.cultivoId || outputsLoading}
                      onChange={(event) => updateInventoryLine(index, 'idKardex', event.target.value)}
                    >
                      <option value="">Selecciona una salida</option>
                      {availableOutputs.map((item) => (
                        <option
                          key={item.idKardex}
                          value={item.idKardex}
                          disabled={usedOutputIds.has(String(item.idKardex))}
                        >
                          {item.producto} — Salida #{item.idKardex} ({item.referencia}) — disponible: {item.cantidadDisponible} {item.unidad}
                        </option>
                      ))}
                    </select>
                  </label>
                  {output ? (
                    <p>
                      Salida #{output.idKardex} · {output.producto} · Costo unitario: {formatCurrency(output.costoUnitario)} / {output.unidad}
                    </p>
                  ) : null}
                  <label>
                    Cantidad utilizada ({output?.unidad || 'unidad'})
                    <input
                      type="number"
                      min="0.000001"
                      max={output?.cantidadDisponible}
                      step="0.000001"
                      required
                      disabled={!output}
                      value={line.cantidad}
                      onChange={(event) => updateInventoryLine(index, 'cantidad', event.target.value)}
                    />
                  </label>
                  <p>
                    Disponible: {output ? `${output.cantidadDisponible} ${output.unidad}` : '--'}
                    {' · '}Subtotal: {formatCurrency((Number(line.cantidad) || 0) * (Number(output?.costoUnitario) || 0))}
                  </p>
                  {inventoryLines.length > 1 ? (
                    <button type="button" disabled={busy} onClick={() => removeInventoryLine(index)}>
                      Retirar línea
                    </button>
                  ) : null}
                </fieldset>
              )
            })}
            <button type="button" disabled={busy || inventoryLines.length >= 100 || !availableOutputs.length} onClick={addInventoryLine}>
              Agregar producto
            </button>
            <p><strong>Total de Materia Prima: {formatCurrency(inventoryTotal)}</strong></p>
            <label>Fecha <input type="date" required value={inventoryForm.fecha} onChange={(event) => setInventoryForm((current) => ({ ...current, fecha: event.target.value }))} /></label>
            <label>Descripción <input maxLength={255} value={inventoryForm.descripcion} onChange={(event) => setInventoryForm((current) => ({ ...current, descripcion: event.target.value }))} /></label>
            <button type="submit" disabled={busy || !fincaId || !inventoryForm.cultivoId || !inventoryActiveStage?.idetapacultivo || outputsLoading || !availableOutputs.length}>
              Registrar costo
            </button>
          </form>
        </section>

        <section>
          <h3>Pago real de mano de obra (7205)</h3>
          <form onSubmit={submitLaborPayment}>
            <label>
              Cultivo
              <select required value={laborForm.cultivoId} onChange={(event) => setLaborForm((current) => ({ ...current, cultivoId: event.target.value }))}>
                <option value="">Selecciona un cultivo</option>
                {activeCrops.map((crop) => <option key={crop.id} value={crop.id}>{crop.nombre}</option>)}
              </select>
            </label>
            <label>
              Trabajador
              <select required value={laborForm.trabajadorId} onChange={(event) => setLaborForm((current) => ({ ...current, trabajadorId: event.target.value }))}>
                <option value="">Selecciona un trabajador</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.nombre} {user.apellidos}</option>)}
              </select>
            </label>
            <label>
              Tipo de pago
              <select required value={laborForm.subcategoriaId} onChange={(event) => setLaborForm((current) => ({ ...current, subcategoriaId: event.target.value }))}>
                <option value="">Selecciona</option>
                {laborSubcategories.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <label>
              Estado de pago
              <select required value={laborForm.estadoPagoId} onChange={(event) => setLaborForm((current) => ({ ...current, estadoPagoId: event.target.value }))}>
                <option value="">Selecciona</option>
                {paymentStates.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <label>Valor COP <input type="number" min="0.01" step="0.01" required value={laborForm.valor} onChange={(event) => setLaborForm((current) => ({ ...current, valor: event.target.value }))} /></label>
            <label>Fecha <input type="date" required value={laborForm.fecha} onChange={(event) => setLaborForm((current) => ({ ...current, fecha: event.target.value }))} /></label>
            <label>Descripción <input value={laborForm.descripcion} onChange={(event) => setLaborForm((current) => ({ ...current, descripcion: event.target.value }))} /></label>
            <button type="submit" disabled={busy || !fincaId || !laborActiveStage?.idetapacultivo}>Registrar pago</button>
          </form>
          {users.length === 0 ? <p>No se encontraron usuarios con rol trabajador activo.</p> : null}
        </section>

        <section>
          <h3>Configuración de cuentas por subcategoría</h3>
          {(configuration?.cuentas || []).filter((item) => item.subcategoriaId).map((item) => (
            <form key={`${item.subcategoriaId}-${item.codigoSubcategoria}-${item.incluirCostoUnitario}`} onSubmit={(event) => saveAccountConfig(item, event)} className="costeo-account-row">
              <span>{item.codigoContable || '--'} · {item.nombre} / {item.subcategoria}</span>
              <input name="codigo" defaultValue={item.codigoSubcategoria || ''} maxLength={20} aria-label={`Código para ${item.subcategoria}`} />
              <label>
                <input name="incluir" type="checkbox" defaultChecked={item.incluirCostoUnitario} />
                Incluir en costo unitario
              </label>
              <button type="submit" disabled={busy}>Guardar</button>
            </form>
          ))}
        </section>
      </div>
    </details>
  )
}
