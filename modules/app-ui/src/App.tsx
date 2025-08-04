import { Box } from '@mui/material'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

import CustomRouter from './routes/CustomRouter'

const App: React.FC = () => (
  <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
    <BrowserRouter>
      <CustomRouter />
    </BrowserRouter>
  </Box>
)

export default App
