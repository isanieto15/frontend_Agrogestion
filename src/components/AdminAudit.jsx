import { useEffect, useState } from 'react';
import { fetchAuditEvent, fetchAuditEvents } from '../services/auditoriaService';
import ModalCloseButton from './ModalCloseButton.jsx';

const MODULE_LABELS = {
  CULTIVOS: 'Cultivos y etapas',
  COSTOS: 'Costos',
  COSECHAS: 'Cosechas',
  COSTEO: 'Configuración de costeo',
  USUARIOS: 'Usuarios y asignaciones',
  REPORTES: 'Reportes',
};

const ACTION_LABELS = {
  CREACION: 'Creación',
  ACTUALIZACION: 'Modificación',
  ELIMINACION_FISICA: 'Eliminación',
  DESACTIVACION: 'Anulación o desactivación',
  REACTIVACION: 'Reactivación',
  CAMBIO_ESTADO_REGISTRO: 'Cambio de estado',
  CAMBIO_CREDENCIAL: 'Cambio de dato sensible',
  RESTABLECIMIENTO_SOLICITADO: 'Restablecimiento solicitado',
  CONSULTA_REPORTE: 'Consulta de reporte',
  EXPORTACION: 'Exportación',
};

const ENTITY_LABELS = {
  usuario: 'Usuario',
  usuario_cultivo: 'Asignación de usuario a cultivo',
  usuario_finca: 'Asignación de usuario a finca',
  usuario_modulos: 'Acceso de usuario a módulo',
  cultivo: 'Cultivo',
  etapa_cultivo: 'Etapa de cultivo',
  etapas: 'Catálogo de etapas',
  tipos_cultivo: 'Tipo de cultivo',
  estado_cultivo: 'Estado de cultivo',
  costo: 'Costo',
  categoria_costo: 'Categoría de costo',
  subcategoria_costo: 'Subcategoría de costo',
  estado_pago: 'Estado de pago',
  cosecha: 'Cosecha',
  tipo_precio: 'Tipo de precio',
  unidades_medidas: 'Unidad de medida',
  etapas_tipo_cultivo: 'Etapa por tipo de cultivo',
  prorrateo_costos_generales: 'Distribución de costos generales',
  conversion_unidades_cultivo: 'Conversión de unidades',
  pago_mano_obra: 'Pago de mano de obra',
  costo_insumo_detalle: 'Consumo asociado a costo',
  reportes: 'Reporte',
};

const FIELD_LABELS = {
  id_usuario: 'Usuario',
  usuario_id: 'Usuario',
  id_trabajador: 'Trabajador',
  idcultivo: 'Cultivo',
  idfinca: 'Finca',
  idtipocultivo: 'Tipo de cultivo',
  idetapa: 'Etapa',
  idetapacultivo: 'Etapa del cultivo',
  idetapa_cultivo: 'Etapa del cultivo',
  idcategoria: 'Categoría',
  idsubcategoria: 'Subcategoría',
  idestadocultivo: 'Estado del cultivo',
  idestado_pago: 'Estado de pago',
  idunidadmedida: 'Unidad de medida',
  idtipoprecio: 'Tipo de precio',
  nombre: 'Nombre',
  nombre_etapa: 'Etapa',
  descripcion: 'Descripción',
  valor: 'Valor',
  fecha: 'Fecha',
  fecha_inicio: 'Fecha de inicio',
  fecha_final: 'Fecha final',
  fecha_cosecha: 'Fecha de cosecha',
  cantidad_cosechada: 'Cantidad cosechada',
  precio_unitario: 'Precio unitario',
  estado_registro: 'Estado',
  porcentaje: 'Porcentaje',
  orden: 'Orden',
  factor_a_unidad_base: 'Factor a unidad base',
  es_unidad_base: 'Unidad base',
  cantidad_utilizada: 'Cantidad utilizada',
  unidad_medida: 'Unidad',
  costo_unitario_aplicado: 'Costo unitario aplicado',
  subtotal: 'Subtotal',
  id_kardex: 'Movimiento relacionado',
  correo: 'Correo',
  telefono: 'Teléfono',
  identificacion: 'Identificación',
  id_roles: 'Rol',
  id_modulo: 'Módulo asignado',
  codigo_contable: 'Código contable',
  incluir_costo_unitario: 'Incluir en costo unitario',
  fincaId: 'Finca',
  cultivoId: 'Cultivo',
  categoriaId: 'Categoría',
  subcategoriaId: 'Subcategoría',
  usuarioId: 'Usuario',
  estadoId: 'Estado',
  tipoCultivoId: 'Tipo de cultivo',
  etapaId: 'Etapa',
  tipoReporte: 'Tipo de reporte',
  formato: 'Formato',
  filtros: 'Filtros aplicados',
  numeroFilas: 'Registros exportados',
  usuarioObjetivo: 'Usuario al que se envió',
  medio: 'Medio de restablecimiento',
  fechaInicio: 'Fecha inicial',
  fechaFin: 'Fecha final',
};

const RELATED_FIELD_MAP = {
  id_usuario: 'usuarios',
  usuario_id: 'usuarios',
  idusuario: 'usuarios',
  id_trabajador: 'usuarios',
  idcultivo: 'cultivos',
  idfinca: 'fincas',
  idtipocultivo: 'tiposCultivo',
  idetapa: 'etapas',
  idetapacultivo: 'etapasCultivo',
  idetapa_cultivo: 'etapasCultivo',
  idcategoria: 'categorias',
  idsubcategoria: 'subcategorias',
  idestadocultivo: 'estadosCultivo',
  idestado_pago: 'estadosPago',
  idunidadmedida: 'unidades',
  idtipoprecio: 'tiposPrecio',
  id_roles: 'roles',
  id_modulo: 'modulos',
  usuarioId: 'usuarios',
  fincaId: 'fincas',
  cultivoId: 'cultivos',
  categoriaId: 'categorias',
  subcategoriaId: 'subcategorias',
  tipoCultivoId: 'tiposCultivo',
  etapaId: 'etapas',
};

const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'contraseña',
  'contrasena',
  'refresh_token',
  'refresh_token_hash',
  'token_hash',
  'token',
  'access_token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'code',
]);

const INITIAL_FILTERS = {
  fechaDesde: '',
  fechaHasta: '',
  usuarioId: '',
  modulo: '',
  accion: '',
  entidad: '',
  registroId: '',
  busqueda: '',
};

function formatDateTime(value) {
  if (!value) return 'Fecha no disponible';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{6})$/);
    if (match) {
      const [, year, month, day, hour, minute, second, fraction] = match;
      const date = new Date(
        Date.UTC(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
          Number(fraction.slice(0, 3))
        )
      );
      const formatted = new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'UTC',
      }).format(date);
      return `${formatted}.${fraction}`;
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function getValueLabel(field, value, related) {
  if (value === null || value === undefined || value === '') return 'Sin valor';
  const relatedTable = RELATED_FIELD_MAP[field];
  if (relatedTable && related?.[relatedTable]?.[String(value)]) {
    return `${related[relatedTable][String(value)]} (ID ${value})`;
  }
  if (field === 'estado_registro') {
    return Number(value) === 1 ? 'Activo' : 'Inactivo';
  }
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') {
    return JSON.stringify(value, (key, nestedValue) => {
      const relatedTable = RELATED_FIELD_MAP[key];
      if (relatedTable && related?.[relatedTable]?.[String(nestedValue)]) {
        return `${related[relatedTable][String(nestedValue)]} (ID ${nestedValue})`;
      }
      return nestedValue;
    });
  }
  return String(value);
}

function getChangedFields(event) {
  const before = event.valoresAnteriores || {};
  const after = event.valoresNuevos || {};
  const fields = event.columnasModificadas?.length
    ? event.columnasModificadas
    : [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return fields.filter((field) => !SENSITIVE_FIELDS.has(field.toLowerCase()));
}

export default function AdminAudit() {
  const [draft, setDraft] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [events, setEvents] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    usuarios: [],
    modulos: [],
    acciones: [],
    entidades: [],
  });
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageInfo, setPageInfo] = useState({ total: 0, totalPages: 0, pageSize: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAuditEvents({ ...filters, page, pageSize: 25 })
      .then((data) => {
        if (!active) return;
        setEvents(data.eventos);
        setFilterOptions(data.filtros);
        setPageInfo({
          total: data.total,
          totalPages: data.totalPages,
          pageSize: data.pageSize,
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar la auditoría.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, page, refreshKey]);

  const updateDraft = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const submitFilters = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setPage(1);
    setRefreshKey((current) => current + 1);
    setFilters(Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    ));
  };

  const clearFilters = () => {
    setLoading(true);
    setError('');
    setDraft(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setRefreshKey((current) => current + 1);
  };

  const changePage = (nextPage) => {
    setLoading(true);
    setError('');
    setPage(nextPage);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      setSelected(await fetchAuditEvent(id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar el detalle.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="audit-page">
      <header className="audit-header">
        <div>
          <h2>Auditoría del módulo de Costos</h2>
          <p>Consulta quién realizó cada operación, cuándo y qué información cambió. La zona horaria no se almacena en la base de datos.</p>
        </div>
        <span className="audit-total">{pageInfo.total.toLocaleString('es-CO')} eventos</span>
      </header>

      <form className="audit-filters" onSubmit={submitFilters}>
        <label>
          Desde
          <input type="date" value={draft.fechaDesde} onChange={updateDraft('fechaDesde')} />
        </label>
        <label>
          Hasta
          <input type="date" value={draft.fechaHasta} onChange={updateDraft('fechaHasta')} />
        </label>
        <label>
          Usuario
          <select value={draft.usuarioId} onChange={updateDraft('usuarioId')}>
            <option value="">Todos</option>
            {filterOptions.usuarios.map((user) => (
              <option key={user.id} value={user.id}>{user.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Funcionalidad
          <select value={draft.modulo} onChange={updateDraft('modulo')}>
            <option value="">Todas</option>
            {filterOptions.modulos.map((module) => (
              <option key={module} value={module}>{MODULE_LABELS[module] || module}</option>
            ))}
          </select>
        </label>
        <label>
          Operación
          <select value={draft.accion} onChange={updateDraft('accion')}>
            <option value="">Todas</option>
            {filterOptions.acciones.map((action) => (
              <option key={action} value={action}>{ACTION_LABELS[action] || action}</option>
            ))}
          </select>
        </label>
        <label>
          Entidad
          <select value={draft.entidad} onChange={updateDraft('entidad')}>
            <option value="">Todas</option>
            {filterOptions.entidades.map((entity) => (
              <option key={entity} value={entity}>{ENTITY_LABELS[entity] || entity}</option>
            ))}
          </select>
        </label>
        <label>
          ID del registro
          <input
            type="number"
            min="1"
            value={draft.registroId}
            onChange={updateDraft('registroId')}
            placeholder="Ej. 42"
          />
        </label>
        <label className="audit-search">
          Buscar texto
          <input
            type="search"
            maxLength="200"
            value={draft.busqueda}
            onChange={updateDraft('busqueda')}
            placeholder="Nombre, descripción o dato relacionado"
          />
        </label>
        <div className="audit-filter-actions">
          <button type="submit" className="audit-button audit-button-primary">Aplicar filtros</button>
          <button type="button" className="audit-button" onClick={clearFilters}>Limpiar</button>
        </div>
      </form>

      {error && <div className="audit-error" role="alert">{error}</div>}

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Funcionalidad</th>
              <th>Operación</th>
              <th>Registro afectado</th>
              <th>Resultado / motivo</th>
              <th aria-label="Detalle" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="audit-empty">Cargando eventos…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan="7" className="audit-empty">No se encontraron eventos con esos filtros.</td></tr>
            ) : events.map((event) => (
              <tr key={event.id}>
                <td>{formatDateTime(event.fecha)}</td>
                <td>
                  <strong>{event.usuario}</strong>
                  <small>{event.usuarioId ? `ID ${event.usuarioId}` : 'Sin usuario asociado'}</small>
                </td>
                <td>{MODULE_LABELS[event.modulo] || event.modulo}</td>
                <td>
                  <span className={`audit-action audit-action-${event.accion.toLowerCase()}`}>
                    {ACTION_LABELS[event.accion] || event.accion}
                  </span>
                </td>
                <td>
                  <strong>{ENTITY_LABELS[event.entidad] || event.entidad}</strong>
                  {event.cultivo && <small>Cultivo: {event.cultivo}</small>}
                  <small>{event.registroId ? `Registro #${event.registroId}` : 'Sin identificador único'}</small>
                </td>
                <td className="audit-summary">{event.descripcion || 'Operación registrada correctamente.'}</td>
                <td>
                  <button type="button" className="audit-link" onClick={() => openDetail(event.id)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="audit-pagination">
        <span>
          {pageInfo.total === 0 ? 'Sin resultados' : `Página ${page} de ${pageInfo.totalPages}`}
        </span>
        <div>
          <button
            type="button"
            className="audit-button"
            disabled={page <= 1 || loading}
            onClick={() => changePage(page - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="audit-button"
            disabled={page >= pageInfo.totalPages || loading}
            onClick={() => changePage(page + 1)}
          >
            Siguiente
          </button>
        </div>
      </footer>

      {detailLoading && <div className="audit-detail-loading" role="status">Cargando detalle del evento…</div>}
      {selected && (
        <div className="audit-modal-backdrop" role="presentation">
          <section className="audit-detail" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title">
            <ModalCloseButton onClose={() => setSelected(null)} />
            <header>
              <div>
                <span className="audit-detail-kicker">Evento #{selected.id}</span>
                <h3 id="audit-detail-title">{ACTION_LABELS[selected.accion] || selected.accion}</h3>
              </div>
            </header>
            <dl className="audit-detail-meta">
              <div><dt>Realizado por</dt><dd>{selected.usuario}{selected.usuarioId ? ` (ID ${selected.usuarioId})` : ''}</dd></div>
              <div><dt>Fecha y hora</dt><dd>{formatDateTime(selected.fecha)}</dd></div>
              <div><dt>Funcionalidad</dt><dd>{MODULE_LABELS[selected.modulo] || selected.modulo}</dd></div>
              <div><dt>Registro afectado</dt><dd>{ENTITY_LABELS[selected.entidad] || selected.entidad}{selected.registroId ? ` #${selected.registroId}` : ''}</dd></div>
              {selected.cultivo && <div><dt>Cultivo afectado</dt><dd>{selected.cultivo}</dd></div>}
              {selected.ipUsuario && <div><dt>Origen de la solicitud</dt><dd>{selected.ipUsuario}</dd></div>}
            </dl>
            <div className="audit-detail-reason">
              <strong>Motivo o contexto</strong>
              <p>{selected.descripcion || 'No se registró un motivo adicional para esta operación.'}</p>
            </div>
            {selected.accion === 'CAMBIO_CREDENCIAL' && (
              <p className="audit-sensitive-note">Se detectó un cambio en un dato sensible. Su valor no se almacena en la auditoría.</p>
            )}
            <div className="audit-changes-wrap">
              <h4>Valores del registro</h4>
              <table className="audit-changes">
                <thead><tr><th>Campo</th><th>Valor anterior</th><th>Valor nuevo</th></tr></thead>
                <tbody>
                  {getChangedFields(selected).map((field) => (
                    <tr key={field}>
                      <th>{getFieldLabel(field)}</th>
                      <td>{getValueLabel(field, selected.valoresAnteriores?.[field], selected.relacionados)}</td>
                      <td>{getValueLabel(field, selected.valoresNuevos?.[field], selected.relacionados)}</td>
                    </tr>
                  ))}
                  {getChangedFields(selected).length === 0 && (
                    <tr><td colSpan="3" className="audit-empty">Este evento no tiene valores de fila para mostrar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
