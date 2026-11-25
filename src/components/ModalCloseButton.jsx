import { useEffect, useRef, useState } from 'react'
import './ModalCloseButton.css'

function findScrollableAncestor(element) {
  let ancestor = element?.parentElement

  while (ancestor && ancestor !== document.body) {
    const overflowY = window.getComputedStyle(ancestor).overflowY
    if (['auto', 'scroll', 'overlay'].includes(overflowY)) return ancestor
    ancestor = ancestor.parentElement
  }

  return null
}

export default function ModalCloseButton({
  onClose,
  scrollContainerRef,
  className = 'modal-close-button--floating',
}) {
  const buttonRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current || findScrollableAncestor(buttonRef.current)
    if (!scrollContainer) return undefined

    let previousScrollTop = scrollContainer.scrollTop
    let buttonVisible = true
    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop
      const nextVisibility = currentScrollTop <= 0
        ? true
        : currentScrollTop < previousScrollTop - 1
          ? true
          : currentScrollTop > previousScrollTop + 1
            ? false
            : buttonVisible

      if (nextVisibility !== buttonVisible) {
        buttonVisible = nextVisibility
        setIsVisible(nextVisibility)
      }
      previousScrollTop = currentScrollTop
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  const classes = ['modal-close-button', className, isVisible ? '' : 'modal-close-button--hidden']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={buttonRef}
      type="button"
      className={classes}
      aria-label="Cerrar modal"
      title="Cerrar"
      onClick={onClose}
    >
      ×
    </button>
  )
}
