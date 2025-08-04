import { Box, Button, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import ReactCardFlip from 'react-card-flip'

interface FlippableCardProps {
  text: string
}

const FlippableCard: React.FC<FlippableCardProps> = ({ text }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    // Clear any pending leave timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    // Start a timer to flip the card after 500ms
    timerRef.current = setTimeout(() => {
      setIsFlipped(true)
      timerRef.current = null
    }, 500)
  }

  const handleMouseLeave = () => {
    // Clear any pending enter timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    // Start a timer to flip the card back after 500ms
    timerRef.current = setTimeout(() => {
      setIsFlipped(false)
      timerRef.current = null
    }, 200)
  }

  // Clear timer on unmount to avoid memory leaks
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} sx={{ cursor: 'pointer' }}>
      <ReactCardFlip
        isFlipped={isFlipped}
        flipDirection="horizontal"
        flipSpeedBackToFront={0.9}
        flipSpeedFrontToBack={0.9}
      >
        {/* Front Side */}
        <Box
          key="front"
          sx={{
            p: 8,
            border: '1px solid',
            borderRadius: 2,
            backgroundColor: 'rgb(0 0 0 / 50%)',
          }}
        >
          <Typography
            variant="h4"
            fontFamily="monospace"
            sx={{
              textAlign: 'left',
              color: 'antiquewhite',
              textShadow: '1px 1px 1px #171717',
            }}
          >
            {text}
          </Typography>
        </Box>
        {/* Back Side */}
        <Box
          key="back"
          sx={{
            p: 8,
            border: '1px solid',
            borderRadius: 2,
            backgroundColor: 'rgb(0 0 0 / 50%)',
          }}
        >
          <Button variant="contained" color="primary">
            Back Button
          </Button>
        </Box>
      </ReactCardFlip>
    </Box>
  )
}

export default FlippableCard
