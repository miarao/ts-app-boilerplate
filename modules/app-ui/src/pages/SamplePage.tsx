import { Alert, Box, Card, CardContent, Chip, CircularProgress, Divider, Grid, Typography } from '@mui/material'
import type {
  GetEntityGraphRequest,
  GetEntityGraphResponse,
  HelloMemberRequest,
  HelloMemberResponse,
  NormalizedEvent,
} from 'hello-api'
import React, { useEffect, useState } from 'react'

import { useEndpointClient } from '../context/EndpointClientProvider'

const SamplePage: React.FC = () => {
  const endpointClient = useEndpointClient()

  // State management for async data
  const [helloMemberResponse, setHelloMemberResponse] = useState<HelloMemberResponse | null>(null)
  const [entityGraphResponse, setEntityGraphResponse] = useState<GetEntityGraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch greeting
        const helloMemberRequest: HelloMemberRequest = { name: 'Bob' }
        const helloResponse = await endpointClient.callEndpoint<HelloMemberRequest, HelloMemberResponse>(
          'hello',
          'helloMember',
          helloMemberRequest,
        )
        setHelloMemberResponse(helloResponse)

        // Fetch entity graph
        const entityGraphRequest: GetEntityGraphRequest = {}
        const graphResponse = await endpointClient.callEndpoint<GetEntityGraphRequest, GetEntityGraphResponse>(
          'hello',
          'getEntityGraph',
          entityGraphRequest,
        )
        setEntityGraphResponse(graphResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpointClient])

  const renderEntityEvent = (event: NormalizedEvent, index: number) => (
    <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          {event.action}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Source Entity:
          </Typography>
          <Chip label={event.ipEntityName} color="secondary" variant="outlined" size="small" />
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Target Resources:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {event.namedArn.map((arn, arnIndex) => (
              <Chip key={arnIndex} label={arn} color="primary" variant="outlined" size="small" />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginY: 4, marginX: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Entity Graph Visualization</Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Hello Member Section */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Hello Service Response
            </Typography>
            {helloMemberResponse && (
              <Card sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="body1">
                    <strong>Name:</strong> {helloMemberResponse.name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email:</strong> {helloMemberResponse.email}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Entity Graph Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Entity Relationship Graph
            </Typography>

            {entityGraphResponse && entityGraphResponse.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Found {entityGraphResponse.length} normalized events showing relationships between entities and
                  resources.
                </Typography>

                <Grid container spacing={2}>
                  {entityGraphResponse.map((event, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      {renderEntityEvent(event, index)}
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : (
              <Alert severity="info">
                No entity graph data available. Make sure the playground module is properly configured.
              </Alert>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}

export default SamplePage
