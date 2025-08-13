import { z } from 'zod'

export interface Handler<Req, Resp> {
  /**
   * @param request input data.
   * @param context additional information of the request.
   */
  handle(request: Req, context: RequestContext): Promise<Resp>
}

export const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
export type HttpMethod = z.infer<typeof HttpMethod>

/** 2. HttpContext as a Zod object schema */
export const HttpContextSchema = z
  .object({
    headers: z.record(z.string()).optional(),
    method: HttpMethod,
    path: z.string(),
    query: z.record(z.union([z.string(), z.array(z.string())])).optional(),
    params: z.record(z.string()).optional(),
  })
  .strict()
export type HttpContextSchema = z.infer<typeof HttpContextSchema>

/** 4. RequestContext as a Zod object schema */
export const RequestContext = z
  .object({
    requestId: z.string().uuid(),
    http: HttpContextSchema.optional(),
  })
  .strict()
export type RequestContext = z.infer<typeof RequestContext>
