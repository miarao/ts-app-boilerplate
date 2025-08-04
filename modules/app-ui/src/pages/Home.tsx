import { Box, Grid2 } from '@mui/material'
import React from 'react'

import FlippableCard from '../components/FlippableCard'
import SearchBar from '../components/SearchBar'

const text: string[] = ['Simple flippable card']
const Home = () => (
  <>
    <SearchBar />
    <Box
      sx={{
        display: 'flex',
        textAlign: 'end',
        flexDirection: 'column',
        zIndex: 1,
        width: '100%',
        height: '70%',
        justifyContent: 'space-between',
      }}
    >
      {/* Grid with 4 flippable cards (2 rows x 2 columns) */}
      <Grid2 container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 2 }}>
        {Array.from(Array(4)).map((item, index) => (
          // Add component="div" to satisfy the required prop
          <Grid2 key={index} size={6} component="div">
            <FlippableCard text={text[0]} />
          </Grid2>
        ))}
      </Grid2>
    </Box>
  </>
)

export default Home
