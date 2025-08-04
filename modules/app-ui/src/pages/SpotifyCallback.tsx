import { Box, CircularProgress, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useLogger } from '../context/LoggerProvider'

const SpotifyCallback: React.FC = () => {
  const navigate = useNavigate()
  const logger = useLogger()

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')

        if (error) {
          logger.error(`Spotify auth error: ${error}`, new Error(error))
          navigate('/mux', { replace: true })
          return
        }

        if (!code) {
          logger.info('No code provided in callback, redirecting to /mux')
          navigate('/mux', { replace: true })
          return
        }

        // Clear any existing auth code before storing the new one
        sessionStorage.removeItem('spotify_auth_code')

        // Store the fresh code in sessionStorage
        sessionStorage.setItem('spotify_auth_code', code)
        logger.info('Spotify auth code received and stored temporarily')

        // Navigate to the Mux page
        navigate('/mux', { replace: true })
      } catch (err) {
        logger.error('Error processing callback:', err)
        navigate('/mux', { replace: true })
      }
    }

    processCallback()
  }, [navigate, logger])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh',
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 4 }}>
        Connecting to Spotify...
      </Typography>
    </Box>
  )
}

export default SpotifyCallback
