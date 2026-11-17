import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getClientRects().length > 0,
  )
}

export function useFocusTrap(
  isActive,
  containerRef,
  { onEscape, fallbackFocusRef } = {},
) {
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape
  const fallbackFocusRefValue = useRef(fallbackFocusRef)
  fallbackFocusRefValue.current = fallbackFocusRef

  useEffect(() => {
    if (!isActive) return undefined
    const container = containerRef.current
    if (!container) return undefined

    const previouslyFocused = document.activeElement
    const focusables = getFocusable(container)
    const initialTarget =
      focusables.find((element) => element.dataset.autofocus === 'true') ||
      focusables[0]

    if (initialTarget) {
      initialTarget.focus()
    } else if (container.hasAttribute('tabindex')) {
      container.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (onEscapeRef.current) {
          event.preventDefault()
          onEscapeRef.current()
        }
        return
      }

      if (event.key !== 'Tab') return

      const items = getFocusable(container)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const fallbackTarget = fallbackFocusRefValue.current?.current
      const restoreTarget =
        previouslyFocused &&
        previouslyFocused !== document.body &&
        previouslyFocused !== document.documentElement
          ? previouslyFocused
          : fallbackTarget
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        restoreTarget.focus()
      }
    }
  }, [isActive, containerRef])
}
