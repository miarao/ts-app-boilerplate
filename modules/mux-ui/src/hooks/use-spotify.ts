import { useCallback, useEffect, useMemo, useState } from 'react'

import { useLogger } from '../context/LoggerProvider'

export interface SpotifyAccessToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

export interface SpotifyUserProfile {
  country: string
  display_name: string
  email: string
  explicit_content: {
    filter_enabled: boolean
    filter_locked: boolean
  }
  external_urls: {
    spotify: string
  }
  followers: {
    href: string | null
    total: number
  }
  href: string
  id: string
  images: Array<{
    url: string
    height: number
    width: number
  }>
  product: string
  type: string
  uri: string
}

interface SpotifyApi {
  getAccessToken: () => Promise<SpotifyAccessToken>
  getUserProfile: () => Promise<SpotifyUserProfile>
  getPlaylists: () => Promise<unknown>
  redirectToSpotifyAuthorize: () => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export interface SpotifyImage {
  height: number | null
  url: string
  width: number | null
}

export interface SpotifyUser {
  display_name: string
  external_urls: {
    spotify: string
  }
  href: string
  id: string
  type: string
  uri: string
}

export interface SpotifyTracks {
  href: string
  total: number
}

export interface SpotifyPlaylistItem {
  collaborative: boolean
  description: string
  external_urls: {
    spotify: string
  }
  href: string
  id: string
  images: SpotifyImage[]
  name: string
  owner: SpotifyUser
  primary_color: string | null
  public: boolean
  snapshot_id: string
  tracks: SpotifyTracks
  type: string
  uri: string
}

export interface SpotifyPlaylistsResponse {
  href: string
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
  items: SpotifyPlaylistItem[]
}

/**
 * Custom hook for Spotify authentication and API interaction
 * @param clientId The Spotify client ID
 * @param redirectUrl The redirect URL registered with Spotify
 * @param scopes Array of Spotify permission scopes
 * @returns A Spotify API object with authentication state and methods
 */
export function useSpotify(clientId: string, redirectUrl: string, scopes: string[]): SpotifyApi {
  const logger = useLogger()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [authResetCounter, setAuthResetCounter] = useState(0)

  // Convert array of scopes to space-separated string
  const scopeString = useMemo(() => scopes.join(' '), [scopes])

  // Token storage implementation in localStorage
  const tokenStorage = useMemo(
    () => ({
      get access_token() {
        return localStorage.getItem('spotify_access_token') || null
      },
      get refresh_token() {
        return localStorage.getItem('spotify_refresh_token') || null
      },
      get expires() {
        const expiresStr = localStorage.getItem('spotify_expires')
        return expiresStr ? new Date(expiresStr) : null
      },

      save(response: SpotifyAccessToken) {
        const { access_token, refresh_token, expires_in } = response
        localStorage.setItem('spotify_access_token', access_token)
        localStorage.setItem('spotify_refresh_token', refresh_token)

        const now = new Date()
        const expiry = new Date(now.getTime() + expires_in * 1000)
        localStorage.setItem('spotify_expires', expiry.toISOString())
      },

      clear() {
        localStorage.removeItem('spotify_access_token')
        localStorage.removeItem('spotify_refresh_token')
        localStorage.removeItem('spotify_expires')
        localStorage.removeItem('spotify_code_verifier')
        // Also clear the auth code from sessionStorage
        sessionStorage.removeItem('spotify_auth_code')
      },
    }),
    [],
  )

  // Authorization endpoints
  const authEndpoint = 'https://accounts.spotify.com/authorize'
  const tokenEndpoint = 'https://accounts.spotify.com/api/token'

  // Generate code verifier and challenge for PKCE
  const generateCodeChallenge = useCallback(async () => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomValues = crypto.getRandomValues(new Uint8Array(64))
    const codeVerifier = Array.from(randomValues)
      .map(x => possible[x % possible.length])
      .join('')
    const data = new TextEncoder().encode(codeVerifier)
    const hashed = await crypto.subtle.digest('SHA-256', data)

    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    return { codeVerifier, codeChallenge }
  }, [])

  const redirectToSpotifyAuthorize = useCallback(async () => {
    try {
      logger.info('Redirecting to Spotify authorization')

      // IMPORTANT: Clear any existing auth data before starting a new flow
      tokenStorage.clear()
      sessionStorage.removeItem('spotify_auth_code')

      // Generate a fresh code challenge for each authorization attempt
      const { codeVerifier, codeChallenge } = await generateCodeChallenge()

      // Store the code verifier in localStorage for later use
      localStorage.setItem('spotify_code_verifier', codeVerifier)

      // Build authorization URL
      const authUrl = new URL(authEndpoint)
      const params = {
        response_type: 'code',
        client_id: clientId,
        scope: scopeString,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectUrl,
        show_dialog: 'true', // Always show the auth dialog for testing
      }

      authUrl.search = new URLSearchParams(params).toString()
      window.location.href = authUrl.toString()
    } catch (error) {
      logger.error('Error redirecting to Spotify authorization', error)
    }
  }, [clientId, redirectUrl, scopeString, generateCodeChallenge, logger, tokenStorage])

  const logout = useCallback(() => {
    setIsLoggingOut(true)
    tokenStorage.clear()
    setIsAuthenticated(false)
    // Also clear the auth code from sessionStorage
    sessionStorage.removeItem('spotify_auth_code')
    // Increment the auth reset counter to trigger a fresh authentication cycle
    setAuthResetCounter(prev => prev + 1)

    // Wait before allowing auto-redirect again
    setTimeout(() => {
      setIsLoggingOut(false)
    }, 500)
  }, [tokenStorage])

  // Exchange authorization code for access token
  const getToken = useCallback(
    async (code: string): Promise<SpotifyAccessToken> => {
      const codeVerifier = localStorage.getItem('spotify_code_verifier')

      if (!codeVerifier) {
        throw new Error('No code verifier found')
      }

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUrl,
          code_verifier: codeVerifier,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Token exchange failed: ${errorData.error_description || 'Unknown error'}`)
      }

      return await response.json()
    },
    [clientId, redirectUrl],
  )

  // Refresh the access token
  const refreshToken = useCallback(async (): Promise<SpotifyAccessToken> => {
    const refresh_token = tokenStorage.refresh_token

    if (!refresh_token) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Token refresh failed: ${errorData.error_description || 'Unknown error'}`)
    }

    return await response.json()
  }, [clientId, tokenStorage.refresh_token])

  // Get fresh valid token, refreshing if necessary
  const getValidToken = useCallback(async (): Promise<string> => {
    const now = new Date()
    const expires = tokenStorage.expires

    // If token is expired or expiring soon (within 5 minutes), refresh it
    if (!expires || now > new Date(expires.getTime() - 5 * 60 * 1000)) {
      try {
        logger.info('Refreshing expired token')
        const newToken = await refreshToken()
        tokenStorage.save(newToken)
        return newToken.access_token
      } catch (error) {
        logger.error('Error refreshing token', error)
        tokenStorage.clear()
        setIsAuthenticated(false)
        throw error
      }
    }

    return tokenStorage.access_token as string
  }, [tokenStorage, refreshToken, logger])

  // Process authentication callback on component mount
  useEffect(() => {
    // Skip authentication check if we're in the process of logging out
    if (isLoggingOut) {
      return
    }

    const processAuthCallback = async () => {
      try {
        // First check if we have a code in sessionStorage (from callback page)
        const storedCode = sessionStorage.getItem('spotify_auth_code')

        // Check if we're handling a callback directly
        const args = new URLSearchParams(window.location.search)
        const urlCode = args.get('code')

        // Use either the stored code or the URL code
        const code = storedCode || urlCode

        if (code) {
          logger.info('Processing authentication code')

          // Exchange code for token
          const token = await getToken(code)
          tokenStorage.save(token)

          // Clean up
          if (storedCode) {
            sessionStorage.removeItem('spotify_auth_code')
          }

          if (urlCode) {
            // Clean up URL if code is in the URL
            const url = new URL(window.location.href)
            url.searchParams.delete('code')
            const updatedUrl = url.search ? url.href : url.href.replace('?', '')
            window.history.replaceState({}, document.title, updatedUrl)
          }

          setIsAuthenticated(true)
        } else if (tokenStorage.access_token) {
          // If we already have a token, check if it's valid
          logger.info('Found existing token, validating')
          try {
            await getValidToken()
            setIsAuthenticated(true)
          } catch (error) {
            logger.error('Existing token validation failed', error)
            setIsAuthenticated(false)
          }
        } else {
          // No token, not authenticated
          logger.info('No authentication token found')
          setIsAuthenticated(false)
        }
      } catch (error) {
        logger.error('Authentication process failed', error)
        setIsAuthenticated(false)
      }
    }

    processAuthCallback()
  }, [getToken, tokenStorage, getValidToken, logger, isLoggingOut, authResetCounter])

  // API implementation
  return useMemo(() => {
    // Define API methods for both authenticated and unauthenticated states
    return {
      isAuthenticated,

      getAccessToken: async (): Promise<SpotifyAccessToken> => {
        if (!isAuthenticated) {
          throw new Error('Not authenticated')
        }

        const accessToken = await getValidToken()
        const refreshToken = tokenStorage.refresh_token || ''
        const expires = tokenStorage.expires
        const expiresIn = expires ? Math.floor((new Date(expires).getTime() - new Date().getTime()) / 1000) : 0

        return {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: expiresIn,
          refresh_token: refreshToken,
          scope: scopeString,
        }
      },

      getUserProfile: async (): Promise<SpotifyUserProfile> => {
        if (!isAuthenticated) {
          throw new Error('Not authenticated')
        }

        const accessToken = await getValidToken()

        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to fetch user profile: ${errorData.error?.message || 'Unknown error'}`)
        }

        return await response.json()
      },

      getPlaylists: async (): Promise<unknown> => {
        if (!isAuthenticated) {
          throw new Error('Not authenticated')
        }

        const accessToken = await getValidToken()

        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to fetch playlists: ${errorData.error?.message || 'Unknown error'}`)
        }

        return await response.json()
      },

      redirectToSpotifyAuthorize,
      logout,
    }
  }, [isAuthenticated, getValidToken, tokenStorage, redirectToSpotifyAuthorize, logout, scopeString])
}
