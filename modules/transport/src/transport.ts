/**
 * Optional settings passed to transport send calls.
 */
export interface TransportOptions {
  /**
   * If set to true, the transport should request that the remote
   * endpoint return a raw/unframed response (when supported).  This
   * mirrors the existing behaviour in the service boilerplate where
   * responses can be framed or raw.  Implementations may ignore this
   * flag if the underlying protocol does not support it.
   */
  rawMode?: boolean
}

export interface Transport {
  /**
   * Sends a request and awaits the response.
   * @returns a Promise of the typed response
   */
  send<Req, Resp>(endpointName: string, payload: Req, options?: TransportOptions): Promise<Resp>

  /**
   * Fires off a request without awaiting a response (fire-and-forget).
   */
  sendUnawaited<Req>(endpointName: string, payload: Req): void
}
