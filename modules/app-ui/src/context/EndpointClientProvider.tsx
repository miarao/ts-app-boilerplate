import type { RequestConfig } from 'client'
import { createInternalApiClient } from 'client'
import { HelloMemberRequest, HelloMemberResponse } from 'hello-api'
import type { Parser } from 'misc'
import { zodThingParser } from 'misc'
import { errorLike } from 'misc'
import React, { createContext, useContext, useMemo } from 'react'

import { useEnvVars } from './EnvironmentProvider'

// 1) Define an endpoint's schema pair
export interface EndpointDefinition<RQ, RS> {
  requestParser: Parser<RQ>
  responseParser: Parser<RS>
}

// 2) The full map: endpointName → its definition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EndpointsMap = Record<string, EndpointDefinition<any, any>>

// 3) Context value type: one generic callEndpoint method
export interface EndpointClientProviderContextType {
  callEndpoint: <RQ, RS>(
    serviceName: string,
    endpointName: string,
    requestData: RQ,
    config?: RequestConfig,
  ) => Promise<RS>
}

export const endpoints: EndpointsMap = {
  greeting: {
    requestParser: zodThingParser(HelloMemberRequest),
    responseParser: zodThingParser(HelloMemberResponse),
  },
}

const EndpointClientContext = createContext<EndpointClientProviderContextType | null>(null)

export interface EndpointClientProps {
  children: React.ReactNode
}

export const EndpointClientProvider: React.FC<EndpointClientProps> = ({ children }) => {
  const env = useEnvVars()
  const apiUrl = env.apiUrl ?? 'http://localhost:7077'
  const client = useMemo(() => createInternalApiClient(env.apiUrl ?? apiUrl), [apiUrl])

  const value = useMemo<EndpointClientProviderContextType>(
    () => ({
      async callEndpoint<RQ, RS>(
        serviceName: string,
        endpointName: string,
        requestData: unknown,
        config?: RequestConfig,
      ): Promise<RS> {
        // 1. Lookup
        const def = endpoints[endpointName]
        if (!def) {
          throw new Error(`No endpoint definition for "${endpointName}"`)
        }

        // 2. Validate + transform request
        let parsedRequest: RQ
        try {
          // zodThingParser expects a JSON string
          parsedRequest = await def.requestParser.parse(JSON.stringify(requestData))
        } catch (err) {
          throw new Error(`Request validation failed: ${errorLike(err).message}`)
        }

        // 3. Call backend
        // eslint-disable-next-line no-console
        console.log(`sending request to ${serviceName}.${endpointName}, request: ${JSON.stringify(parsedRequest)}`)
        const response = await client.invoke<RQ, RS>(
          {
            serviceName,
            request: {
              endpointName,
              responseFormat: 'framed',
              requestData: parsedRequest,
            },
          },
          config,
        )

        // eslint-disable-next-line no-console
        console.log(`response from backend: ${JSON.stringify(response, null, 2)}`)

        if (!response || !response.data) {
          throw new Error(`No data in response from "${endpointName}"`)
        }

        // eslint-disable-next-line no-console
        console.log(`data from backend: ${JSON.stringify(response.data, null, 2)}`)

        // 4. Validate + transform response
        let parsedResponse: RS
        try {
          parsedResponse = await def.responseParser.parse(JSON.stringify(response.data))
          // eslint-disable-next-line no-console
          console.log(`parsed response: ${JSON.stringify(parsedResponse, null, 2)}`)
        } catch (err) {
          throw new Error(`Response validation failed: ${errorLike(err).message}`)
        }

        return parsedResponse
      },
    }),
    [client, endpoints],
  )

  return <EndpointClientContext.Provider value={value}>{children}</EndpointClientContext.Provider>
}

// Hook for consuming
export function useEndpointClient(): EndpointClientProviderContextType {
  const ctx = useContext(EndpointClientContext)
  if (!ctx) {
    throw new Error('useEndpointClient must be used inside <CallEndpointProvider>')
  }
  return ctx
}
