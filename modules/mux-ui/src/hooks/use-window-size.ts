import debounce from 'lodash/debounce'
import { useEffect, useState } from 'react'

function useWindowSize() {
  const isClient = typeof window === 'object'

  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    if (!isClient) {
      return
    }

    const handleResize = debounce(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, 250)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient])

  return size
}

export default useWindowSize
