export interface Transport {
  /**
   * Sends a request and awaits the response.
   * @returns a Promise of the typed response
   */
  send<Req, Resp>(endpointName: string, payload: Req, options?: { rawMode?: boolean }): Promise<Resp>

  /**
   * Fires off a request without awaiting a response (fire-and-forget).
   */
  sendUnawaited<Req>(endpointName: string, payload: Req): void
}
