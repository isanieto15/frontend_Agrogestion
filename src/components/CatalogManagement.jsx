import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createCatalogoItem,
  deleteCatalogoItem,
  fetchCatalogos,
  updateCatalogoItem,
} from '../services/catalogoService.js';

const CATALOGS = [
  { key: 'etapas', dataKey: 'etapas', label: 'Etapas de cultivo', hasDescription: true },
  { key: 'tipos-cultivo', dataKey: 'tiposCultivo', label: 'Tipos de cultivo' },
  { key: 'categorias-costo', dataKey: 'categoriasCosto', label: 'Categorías de costos' },
  { key: 'subcategorias-costo', dataKey: 'subcategoriasCosto', label: 'Subcategorías de costos', hasParent: true },
  { key: 'estados-cultivo', dataKey: 'estadosCultivo', label: 'Estados de cultivo' },
  { key: 'estados-pago', dataKey: 'estadosPago', label: 'Estados de pago' },
  { key: 'unidades-medida', dataKey: 'unidadesMedida', label: 'Unidades de medida' },
  { key: 'tipos-precio', dataKey: 'tiposPrecio', label: 'Tipos de precio' },
];

const EMPTY_FORM = { nombre: '', descripcion: '', categoriaId: '' };

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function isProtectedCultivationStatus(catalogKey, item) {
  const name = String(item.nombre || '').trim().toLowerCase();
  return catalogKey === 'estados-cultivo'
    && (Number(item.id) === 1 || name.startsWith('finaliz'));
}

export default function CatalogManagement() {
  const [catalogos, setCatalogos] = useState({});
  const [selectedCatalog, setSelectedCatalog] = useState(CATALOGS[0].key);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const definition = useMemo(
    () => CATALOGS.find((catalog) => catalog.key === selectedCatalog) || CATALOGS[0],
    [selectedCatalog]
  );
  const items = catalogos[definition.dataKey] || [];
  const categories = catalogos.categoriasCosto || [];

  const loadCatalogos = useCallback(async () => {
    try {
      setCatalogos(await fetchCatalogos());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'No se pudieron cargar las opciones.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchCatalogos()
      .then((data) => {
        if (active) setCatalogos(data);
      })
      .catch((error) => {
        if (active) setErrorMessage(getErrorMessage(error, 'No se pudieron cargar las opciones.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const changeCatalog = (event) => {
    setSelectedCatalog(event.target.value);
    resetForm();
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    const payload = {
      nombre: form.nombre.trim(),
      ...(definition.hasDescription ? { descripcion: form.descripcion.trim() } : {}),
      ...(definition.hasParent ? { categoriaId: Number(form.categoriaId) } : {}),
    };
    try {
      if (editingId === null) {
        await createCatalogoItem(definition.key, payload);
        setSuccessMessage('Opción agregada.');
      } else {
        await updateCatalogoItem(definition.key, editingId, payload);
        setSuccessMessage('Opción actualizada.');
      }
      resetForm();
      await loadCatalogos();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'No se pudo guardar la opción.'));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      categoriaId: item.categoriaId ? String(item.categoriaId) : '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}"? Si tiene registros asociados, no se podrá eliminar.`)) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteCatalogoItem(definition.key, item.id);
      setSuccessMessage('Opción eliminada.');
      if (editingId === item.id) resetForm();
      await loadCatalogos();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'No se pudo eliminar la opción.'));
    }
  };

  const columnCount = 2
    + Number(definition.hasDescription)
    + Number(definition.hasParent);

  return (
    <div className="catalog-management">
      <div className="catalog-management__intro">
        <h3>Opciones del sistema</h3>
        <p>Administra las opciones que aparecen en los formularios. Las opciones con registros asociados no se pueden eliminar.</p>
      </div>

      <label className="catalog-management__selector">
        Catálogo
        <select value={selectedCatalog} onChange={changeCatalog}>
          {CATALOGS.map((catalog) => (
            <option key={catalog.key} value={catalog.key}>{catalog.label}</option>
          ))}
        </select>
      </label>

      {errorMessage && <div className="catalog-management__message catalog-management__message--error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="catalog-management__message catalog-management__message--success" role="status">{successMessage}</div>}

      <form className="catalog-management__form" onSubmit={handleSubmit}>
        <div className="catalog-management__fields">
          <label>
            Nombre
            <input
              value={form.nombre}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              maxLength={100}
              required
            />
          </label>
          {definition.hasDescription && (
            <label>
              Descripción (opcional)
              <input
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                maxLength={2000}
              />
            </label>
          )}
          {definition.hasParent && (
            <label>
              Categoría
              <select
                value={form.categoriaId}
                onChange={(event) => setForm((current) => ({ ...current, categoriaId: event.target.value }))}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.nombre}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="catalog-management__form-actions">
          <button className="catalog-management__button catalog-management__button--primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : editingId === null ? 'Agregar opción' : 'Guardar cambios'}
          </button>
          {editingId !== null && (
            <button className="catalog-management__button" type="button" onClick={resetForm} disabled={saving}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="catalog-management__table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              {definition.hasDescription && <th>Descripción</th>}
              {definition.hasParent && <th>Categoría</th>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columnCount}>Cargando opciones...</td></tr>
            ) : items.length ? items.map((item) => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                {definition.hasDescription && <td>{item.descripcion || '—'}</td>}
                {definition.hasParent && <td>{item.categoriaNombre}</td>}
                <td className="catalog-management__row-actions">
                  {isProtectedCultivationStatus(definition.key, item) ? (
                    <span>Requerido por el sistema</span>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEditing(item)}>Editar</button>
                      <button type="button" className="catalog-management__delete" onClick={() => handleDelete(item)}>Eliminar</button>
                    </>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={columnCount}>Aún no hay opciones en este catálogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
