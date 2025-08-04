import { Box, Button, CircularProgress, Grid, Paper, Typography } from '@mui/material'
import { maskEmail } from 'misc'
import React, { useState } from 'react'

import { useEnvVars } from '../context/EnvironmentProvider'
import { useComponentLogger } from '../context/LoggerProvider'
import type { SpotifyPlaylistsResponse, SpotifyUserProfile } from '../hooks/use-spotify'
import { useSpotify } from '../hooks/use-spotify'

const Mux: React.FC = () => {
  const logger = useComponentLogger('mux')
  const env = useEnvVars()
  const [profile, setProfile] = useState<SpotifyUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [playlists, setPlaylists] = useState<SpotifyPlaylistsResponse | null>(null)

  // Initialize the Spotify hook with required scopes
  const spotifyApi = useSpotify(env.spotifyClientId, env.spotifyRedirectTarget, [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
  ])

  // Load user profile
  const loadProfile = async () => {
    if (!spotifyApi.isAuthenticated) {
      return
    }

    try {
      setIsLoading(true)
      const userData = await spotifyApi.getUserProfile()
      setProfile(userData)
    } catch (error) {
      logger.error('Error fetching user profile:', error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle login
  const handleLogin = async () => {
    await spotifyApi.redirectToSpotifyAuthorize()
  }

  // Handle logout
  const handleLogout = () => {
    spotifyApi.logout()
    setProfile(null)
    setPlaylists(null)
  }

  // Load playlists
  const loadPlaylists = async () => {
    if (!spotifyApi.isAuthenticated) {
      return
    }

    try {
      setIsLoading(true)
      const playlistData = (await spotifyApi.getPlaylists()) as SpotifyPlaylistsResponse
      setPlaylists(playlistData)
      logger.info('User playlists loaded successfully')
    } catch (error) {
      logger.error('Error fetching playlists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Try to load profile if authenticated and no profile is loaded
  if (spotifyApi.isAuthenticated && !profile && !isLoading) {
    loadProfile()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginY: 4, marginX: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Mux - Music Experience</Typography>

        {spotifyApi.isAuthenticated && (
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout from Spotify
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {profile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <Typography variant="h5">Welcome, {profile.display_name}!</Typography>

          {profile.images && profile.images.length > 0 && (
            <Box
              component="img"
              src={profile.images[0].url}
              alt="Profile"
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                objectFit: 'cover',
                mb: 2,
              }}
            />
          )}

          <Typography variant="body1">Email: {maskEmail(profile.email)}</Typography>
          <Typography variant="body1">Account Type: {profile.product}</Typography>
          <Typography variant="body1">Country: {profile.country}</Typography>

          <Typography variant="h6" sx={{ mt: 4 }}>
            Your Spotify Experience
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" color="primary" onClick={loadPlaylists} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load My Playlists'}
            </Button>
          </Box>

          {playlists && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Your Playlists ({playlists.total})</Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {playlists.items.slice(0, 10).map(playlist => (
                  <Grid item xs={12} sm={6} md={4} key={playlist.id}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        '&:hover': { boxShadow: 6 },
                      }}
                    >
                      {playlist.images && playlist.images.length > 0 && (
                        <Box
                          component="img"
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        />
                      )}
                      <Typography variant="subtitle1" fontWeight="bold" noWrap title={playlist.name}>
                        {playlist.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {playlist.tracks.total} tracks
                      </Typography>
                      {playlist.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                          }}
                        >
                          {playlist.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 'auto', pt: 1 }}>
                        <Button size="small" href={playlist.external_urls.spotify} target="_blank" sx={{ mt: 1 }}>
                          Open in Spotify
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {playlists.items.length > 10 && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                  Showing 10 of {playlists.total} playlists
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ) : (
        !isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Connect with your Spotify account to get started
            </Typography>
            <Button variant="contained" color="success" size="large" onClick={handleLogin} sx={{ px: 4, py: 1.5 }}>
              Login with Spotify
            </Button>
          </Box>
        )
      )}
    </Box>
  )
}

export default Mux
