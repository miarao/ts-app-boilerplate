import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import type { HelloMemberRequest, HelloMemberResponse } from 'hello-api'
import React, { useEffect, useState } from 'react'

import { useEndpointClient } from '../context/EndpointClientProvider'

const SamplePage: React.FC = () => {
  const endpointClient = useEndpointClient()

  // State management for async data
  const [helloMemberResponse, setHelloMemberResponse] = useState<HelloMemberResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        setLoading(true)
        setError(null)

        const helloMemberRequest: HelloMemberRequest = { name: 'Bob' }

        const response = await endpointClient.callEndpoint<HelloMemberRequest, HelloMemberResponse>(
          'hello',
          'helloMember',
          helloMemberRequest,
        )

        setHelloMemberResponse(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGreeting()
  }, [endpointClient])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginY: 4, marginX: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Simple page</Typography>
      </Box>

      <Typography variant="h6" sx={{ mt: 4, justifyContent: 'flex-start' }}>
        Your Experience
      </Typography>

      {/* Display greeting response */}
      <Box sx={{ mt: 2 }}>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {helloMemberResponse && (
          <Typography variant="body1">Greeting: {JSON.stringify(helloMemberResponse)}</Typography>
        )}
      </Box>
    </Box>
  )
}

export default SamplePage
