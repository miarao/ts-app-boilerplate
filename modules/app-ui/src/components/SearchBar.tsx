import { Box, TextField, useTheme } from '@mui/material'
import React from 'react'

const SearchBar: React.FC = () => {
  const theme = useTheme()

  return (
    <Box sx={{ my: 4, mx: 'auto', maxWidth: 600, backgroundColor: 'transparent' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Enter topic here..."
        sx={{
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.lg,
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
      />
    </Box>
  )
}

export default SearchBar
