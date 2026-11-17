import { useEffect, useState } from 'react'

export function ProductImage({
  src,
  alt = '',
  className = '',
  loading,
  fallback = null,
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) return fallback

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
