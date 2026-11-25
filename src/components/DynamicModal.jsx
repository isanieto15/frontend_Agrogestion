import { useCallback, useState, useEffect } from 'react'
import { getModalConfig, validateForm, validateField, normalizeModalTextFields } from '../utils/modalConfig'
import MateriaPrimaConsumptionFields from './MateriaPrimaConsumptionFields.jsx'
import ModalCloseButton from './ModalCloseButton.jsx'

/**
 * Componente de modal dinámico que cambia su contenido según el tipo
 */
export function DynamicModal({ isOpen, modalType, onClose, onSubmit, title, submitButtonText, fieldOptions = {}, initialData = undefined, onFieldChange, isEditing = false, materiaPrimaContext = {} }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [focusedField, setFocusedField] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [filterQueries, setFilterQueries] = useState({})

  const config = getModalConfig(modalType)
  const selectedCategory = (fieldOptions.categoria || []).find(
    (option) => String(option.value) === String(formData.categoria)
  )
  const isMateriaPrima = modalType === 'costo'
    && String(selectedCategory?.label || '').trim().toLowerCase() === 'materia prima'
  const hasMateriaPrimaContext = Boolean(materiaPrimaContext.fincaId && materiaPrimaContext.cultivoId)
  const materiaPrimaUnavailable = isMateriaPrima && (isEditing || !hasMateriaPrimaContext)

  const parseCurrencyInput = (value) => {
    if (value == null) return NaN
    const str = String(value).trim()
    if (!str) return NaN
    let cleaned = str.replace(/\s+/g, '').replace(/[^0-9,\.]/g, '')
    if (!cleaned) return NaN

    const decimalMatch = cleaned.match(/([.,])(\d{1,2})$/)
    if (decimalMatch) {
      cleaned = cleaned.slice(0, decimalMatch.index)
    }

    const normalized = cleaned.replace(/[.,]/g, '').replace(/^0+(?=\d)/, '') || '0'
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  const formatCurrencyInput = (value) => {
    if (value == null) return ''
    let str = String(value).trim()
    if (!str) return ''
    str = str.replace(/\s+/g, '').replace(/[^0-9,\.]/g, '')
    if (!str) return ''

    const decimalMatch = str.match(/([.,])(\d{1,2})$/)
    if (decimalMatch) {
      str = str.slice(0, decimalMatch.index)
    }

    let integerPart = str.replace(/[.,]/g, '').replace(/^0+(?=\d)/, '')
    if (integerPart === '') integerPart = '0'
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return integerPart
  }

  // Inicializar formData cuando cambia el tipo de modal
  useEffect(() => {
    if (isOpen && modalType) {
      const init = {}
      config.fields.forEach((field) => {
        init[field.name] = field.multiple ? field.defaultValue || [] : field.defaultValue || ''
      })
      // merge provided initialData (from parent) on top of defaults
      setFormData({ ...init, ...(initialData || {}) })
      setErrors({})
      setFocusedField(null)
      setFilterQueries({})
    }
  }, [isOpen, modalType, initialData])

  const handleInputChange = (e) => {
    const { name, value, multiple, options } = e.target
    const field = config.fields.find((f) => f.name === name)
    let nextValue = multiple
      ? Array.from(options).filter((option) => option.selected).map((option) => option.value)
      : value

    if (field?.isCurrency) {
      nextValue = formatCurrencyInput(nextValue)
    }

    setFormData((prev) => {
      const nextFormData = {
        ...prev,
        [name]: nextValue,
      }

      if (name === 'departamento') {
        nextFormData.municipio = ''
      }
      if (name === 'categoria') {
        nextFormData.subcategoria = ''
        nextFormData.valor = ''
        nextFormData.detalles = []
        nextFormData.detallesValid = false
      }

      return nextFormData
    })

    if (typeof onFieldChange === 'function') onFieldChange(name, nextValue)
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleMateriaPrimaChange = useCallback((detalles, total, detallesValid) => {
    setFormData((prev) => ({
      ...prev,
      detalles,
      detallesValid,
      valor: String(total),
    }))
    setErrors((prev) => ({ ...prev, detalles: '' }))
  }, [])

  const handleCheckboxChange = (fieldName, optionValue, checked) => {
    setFormData((prev) => {
      const currentValue = Array.isArray(prev[fieldName]) ? prev[fieldName] : []
      const nextValue = checked
        ? [...currentValue, optionValue]
        : currentValue.filter((value) => value !== optionValue)

      if (typeof onFieldChange === 'function') {
        onFieldChange(fieldName, nextValue)
      }

      if (errors[fieldName]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: '',
        }))
      }

      return {
        ...prev,
        [fieldName]: nextValue,
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar el formulario
    const validationErrors = validateForm(modalType, formData, isEditing)
    if (isMateriaPrima) {
      delete validationErrors.valor
      if (isEditing) {
        validationErrors.detalles = 'Los costos de Materia Prima vinculados a inventario no se pueden editar.'
      } else if (!hasMateriaPrimaContext) {
        validationErrors.detalles = 'Materia Prima debe asociarse a un cultivo desde su sección de costos.'
      } else if (formData.detallesValid !== true) {
        validationErrors.detalles = 'Selecciona salidas de Kardex y cantidades válidas.'
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Enviar los datos
    try {
      const normalizedData = normalizeModalTextFields(formData)
      const submitResult = await onSubmit(normalizedData)
      if (submitResult === true) {
        setFormData({})
        setErrors({})
      }
    } catch (submitError) {
      console.error('Error submitting modal form:', submitError)
    }
  }

  const handleCancel = () => {
    setFormData({})
    setErrors({})
    setFilterQueries({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
    <div
      className="modal-overlay dynamic-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="modal-content dynamic-modal-content"
        style={{
          backgroundColor: 'var(--bg-white)',
          color: 'var(--text-dark)',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: isMateriaPrima ? '800px' : '500px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ModalCloseButton onClose={handleCancel} />
        <h2
          style={{
            marginBottom: '30px',
            paddingRight: '52px',
            color: 'var(--text-dark)',
            fontFamily: "var(--font-titulo, 'Playfair Display')",
          }}
        >
          {isMateriaPrima ? 'Registrar consumo de Materia Prima' : title || config.title}
        </h2>

        <form autoComplete="off" onSubmit={handleSubmit}>
          {config.fields
            .filter((field) => {
              if (isMateriaPrima && field.name === 'valor') return false
              // hide fields meant only for editing when creating
              if (field.editOnly && !isEditing) return false
              // hide fields meant only for creating when editing
              if (field.createOnly && isEditing) return false
              return true
            })
            .map((field) => (
                <div key={field.name} style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: 'var(--text-dark)',
                    }}
                  >
                    {field.label}
                    {field.required && <span style={{ color: '#e74c3c' }}> *</span>}
                  </label>

                  {field.type === 'checkbox-group' ? (
                    <div
                      role="group"
                      aria-label={field.label}
                      style={{
                        border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                        borderRadius: '8px',
                        padding: '10px',
                        backgroundColor: 'var(--bg-white)',
                      }}
                    >
                      {field.description && (
                        <p style={{ margin: '0 0 8px', color: 'var(--text-light)', fontSize: '13px' }}>
                          {field.description}
                        </p>
                      )}
                      {(fieldOptions[field.name] || field.options || []).map((option) => {
                        const selectedValues = Array.isArray(formData[field.name]) ? formData[field.name] : []
                        const isChecked = selectedValues.includes(option.value)
                        return (
                          <label
                            key={option.value}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              marginBottom: '8px',
                              padding: '10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: isChecked ? 'var(--selected-surface)' : 'transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(field.name, option.value, e.target.checked)}
                              style={{ marginTop: '3px' }}
                            />
                            <span>
                              <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{option.label}</strong>
                              {option.description && (
                                <span style={{ display: 'block', marginTop: '3px', color: 'var(--text-light)', fontSize: '12px' }}>
                                  {option.description}
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  ) : field.type === 'multiselect-search' ? (
                <>
                  <input
                    className="dynamic-modal-input"
                    type="text"
                    value={filterQueries[field.name] || ''}
                    placeholder={field.searchPlaceholder || `Buscar ${field.label}`}
                    onChange={(e) =>
                      setFilterQueries((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      marginBottom: '10px',
                      border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: "var(--font-cuerpo, 'Poppins')",
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    style={{
                      height: '240px',
                      overflowY: 'auto',
                      padding: '10px',
                      border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                      borderRadius: '8px',
                              backgroundColor: 'var(--bg-white)',
                    }}
                  >
                    {(fieldOptions[field.name] || field.options || [])
                      .filter((option) => {
                        const query = (filterQueries[field.name] || '').trim().toLowerCase()
                        if (!query) return true
                        return (
                          (option.label || '')
                            .toString()
                            .toLowerCase()
                            .includes(query) ||
                          (option.description || '')
                            .toString()
                            .toLowerCase()
                            .includes(query)
                        )
                      })
                      .map((option) => {
                        const optionValue = option.value || option
                        const selectedValues = Array.isArray(formData[field.name]) ? formData[field.name] : []
                        const isChecked = selectedValues.includes(optionValue)
                        return (
                          <label
                            key={optionValue}
                            style={{
                              display: 'block',
                              marginBottom: '10px',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '8px',
                              backgroundColor: isChecked ? 'var(--selected-surface)' : 'transparent',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(field.name, optionValue, e.target.checked)}
                                style={{ marginTop: '3px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{option.label || optionValue}</div>
                                {option.description && (
                                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                                    {option.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    {(fieldOptions[field.name] || field.options || []).filter((option) => {
                      const query = (filterQueries[field.name] || '').trim().toLowerCase()
                      if (!query) return true
                      return (
                        (option.label || '')
                          .toString()
                          .toLowerCase()
                          .includes(query) ||
                        (option.description || '')
                          .toString()
                          .toLowerCase()
                          .includes(query)
                      )
                    }).length === 0 && (
                      <p style={{ color: 'var(--text-light)', margin: '0' }}>No se encontraron opciones.</p>
                    )}
                  </div>
                </>
              ) : field.type === 'select' ? (
                <select
                  name={field.name}
                  value={field.multiple ? formData[field.name] || [] : formData[field.name] ?? ''}
                  multiple={field.multiple}
                  size={field.multiple ? Math.min(6, (fieldOptions[field.name] || field.options || []).length || 3) : undefined}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: "var(--font-cuerpo, 'Poppins')",
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    color: '#333333',
                    cursor: 'pointer',
                    minHeight: field.multiple ? '120px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = 'var(--color-verde-oscuro)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = '#e8e8e8'
                    }
                  }}
                >
                  {!field.multiple && <option value="">Seleccionar {field.label}</option>}
                  {(fieldOptions[field.name] || field.options || []).map((option) => {
                    const optionValue = String(option.value ?? option)
                    return (
                      <option key={optionValue} value={optionValue} style={{ backgroundColor: '#ffffff', color: '#333333' }}>
                        {option.label || optionValue}
                      </option>
                    )
                  })}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="dynamic-modal-textarea"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.placeholder}
                  rows="4"
                  maxLength={field.maxLength || undefined}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: "var(--font-cuerpo, 'Poppins')",
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    resize: 'vertical',
                    backgroundColor: 'var(--bg-white)',
                    color: 'var(--text-dark)',
                  }}
                  onMouseEnter={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = 'var(--color-verde-oscuro)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = '#e8e8e8'
                    }
                  }}
                />
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    className="dynamic-modal-input"
                    type={field.type === 'password' && showPassword[field.name] ? 'text' : field.isCurrency ? 'text' : field.type}
                    inputMode={field.inputMode || (field.isCurrency ? 'decimal' : field.type === 'number' ? 'decimal' : undefined)}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField(field.name)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength || undefined}
                    readOnly={field.readOnly}
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                    style={{
                      width: '100%',
                      padding: field.type === 'password' ? '12px 45px 12px 16px' : '12px 16px',
                      border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: "var(--font-cuerpo, 'Poppins')",
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundColor: field.readOnly ? '#f8f8f8' : 'white',
                      outline: 'none',
                      boxShadow: 'none',
                      WebkitBoxShadow: 'none',
                      color: 'var(--text-dark)',
                      WebkitTextFillColor: 'var(--text-dark)',
                      cursor: field.readOnly ? 'default' : 'text',
                    }}
                    onMouseEnter={(e) => {
                      if (!errors[field.name] && focusedField !== field.name) {
                        e.target.style.borderColor = 'var(--color-verde-oscuro)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!errors[field.name] && focusedField !== field.name) {
                        e.target.style.borderColor = '#e8e8e8'
                      }
                    }}
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          [field.name]: !prev[field.name],
                        }))
                      }
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dark)',
                      }}
                      title={showPassword[field.name] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword[field.name] ? '👁️' : '👁️‍🗨️'}
                    </button>
                  )}
                </div>
              )}

              {errors[field.name] && (
                <p
                  style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '6px',
                    margin: '6px 0 0 0',
                  }}
                >
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {isMateriaPrima && (
            materiaPrimaUnavailable ? (
              <p role="alert" style={{ color: '#b42318' }}>
                {isEditing
                  ? 'Los costos de Materia Prima vinculados a inventario no se pueden editar.'
                  : 'Materia Prima requiere un cultivo seleccionado. Regístrala desde la sección de costos del cultivo, no como costo general.'}
              </p>
            ) : (
              <MateriaPrimaConsumptionFields
                key={`${materiaPrimaContext.fincaId}-${materiaPrimaContext.cultivoId}`}
                fincaId={materiaPrimaContext.fincaId}
                cultivoId={materiaPrimaContext.cultivoId}
                onChange={handleMateriaPrimaChange}
                error={errors.detalles}
              />
            )
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '30px',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              className="dynamic-modal-cancel"
              style={{
                padding: '10px 24px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "var(--font-cuerpo, 'Poppins')",
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e0e0e0'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f5f5f5'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="dynamic-modal-submit"
              disabled={materiaPrimaUnavailable}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'var(--color-verde-oscuro, #47663c)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "var(--font-cuerpo, 'Poppins')",
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#3d5231'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--color-verde-oscuro, #47663c)'
              }}
            >
              {submitButtonText || config.submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default DynamicModal
