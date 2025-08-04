import { Box, Typography } from '@mui/material'
import React from 'react'

const Mux: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginY: 4, marginX: 8 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h4">Simple page</Typography>
    </Box>

    <Typography variant="h6" sx={{ mt: 4, justifyContent: 'flex-start' }}>
      Your Experience
    </Typography>
  </Box>
)

export default Mux
