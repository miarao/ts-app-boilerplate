import { Paper } from '@mui/material'
import React from 'react'
import { useLocation } from 'react-router-dom'

import Navbar from '../../components/NavBar'
import useWindowSize from '../../hooks/use-window-size'
import { routes } from '../../routes/routes-config'

interface LayoutProps {
  Component: React.FC
}

const LayoutSelector: React.FC<LayoutProps> = ({ Component }) => {
  const location = useLocation()
  const { width } = useWindowSize()

  // Find the route configuration based on the current pathname.
  const routeConfig = Object.values(routes).find(r => r.path === location.pathname)
  const layoutConfig = routeConfig?.backgroundImageOrLayout || 'url(/abstract-blue-pink.jpg)'

  if (typeof layoutConfig === 'string') {
    return (
      <Paper
        aria-label={location.pathname}
        sx={{
          minHeight: '100vh',
          width: '100vw',
          backgroundImage: layoutConfig,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          overflow: 'auto',
          padding: width < 600 ? 2 : 4,
        }}
      >
        <Navbar />
        <Component />
      </Paper>
    )
  } else if (typeof layoutConfig === 'function') {
    // Treat layoutConfig as a React component and render it.
    const LayoutComponent = layoutConfig satisfies React.FC<{ children: React.ReactNode }>
    return (
      <LayoutComponent>
        <Component />
      </LayoutComponent>
    )
  }

  return <Component />
}

export default LayoutSelector
