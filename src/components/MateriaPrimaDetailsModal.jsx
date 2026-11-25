import { useEffect, useRef } from 'react'
import { formatMateriaPrimaCOP } from '../utils/materiaPrimaDetalles.js'
import ModalCloseButton from './ModalCloseButton.jsx'
import './MateriaPrimaDetailsModal.css'

export default function MateriaPrimaDetailsModal({ isOpen, rows = [], total = 0, onClose }) {
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="mp-details-overlay">
      <section
        className="mp-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp-details-title"
      >
        <header className="mp-details-modal__header">
          <div>
            <span>Desglose del costo</span>
            <h2 id="mp-details-title">Consumo de Materia Prima</h2>
          </div>
          <ModalCloseButton
            className="modal-close-button--header"
            onClose={onClose}
            scrollContainerRef={bodyRef}
          />
        </header>

        <div ref={bodyRef} className="mp-details-modal__body">
          <p>
            Este costo corresponde a las cantidades utilizadas de las siguientes salidas de inventario.
          </p>
          <div className="mp-details-modal__table-wrap">
            <table className="mp-details-modal__table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Salida / referencia</th>
                  <th>Cantidad usada</th>
                  <th>Costo por unidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((row, index) => (
                  <tr key={`${row.id ?? 'salida'}-${index}`}>
                    <td data-label="Producto">{row.producto}</td>
                    <td data-label="Salida / referencia">{row.referencia}</td>
                    <td data-label="Cantidad usada">{row.cantidad} {row.unidad}</td>
                    <td data-label="Costo por unidad">{row.costoUnitarioFmt}</td>
                    <td data-label="Subtotal">{row.subtotalFmt}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="mp-details-modal__empty" colSpan={5}>
                      No hay detalles de Kardex registrados para este costo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="mp-details-modal__total">
            <span>Total registrado en el costo</span>
            <strong>{rows.length ? formatMateriaPrimaCOP(total) : '--'}</strong>
          </footer>
        </div>
      </section>
    </div>
  )
}
