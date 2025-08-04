import { Paper } from '@mui/material'
import React from 'react'

import useWindowSize from '../../hooks/use-window-size'

interface HomeLayoutProps {
  children: React.ReactNode
}

export const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  const { width } = useWindowSize()

  return (
    <Paper
      aria-label="home-page"
      sx={{
        height: '100vh',
        width: '100vw',
        backgroundPosition: 'center',
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat',
        padding: width < 600 ? 2 : 4,
      }}
    >
      {children}
    </Paper>
  )
}
export default HomeLayout
