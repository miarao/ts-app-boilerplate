import { printer } from 'misc'

import { arnToNameMap } from './arn-to-name'
import { events } from './events'
import { processAndNormalizeRawFlowLogs } from './flow-log-processer'
import { ipToReducedARN } from './ip-map'

interface Resource {
  type: string
  ARN: string
}

interface Event {
  eventName: string
  eventSource: string
  sourceIPAddress: string
  resources: Resource[]
  // additional properties
  [key: string]: unknown
}

interface TransformedEvent {
  action: string
  sourceIPAddress: string
  resourcesARN: string[]
}

export interface NormalizedEvent {
  action: string
  ipEntityName: string
  namedArn: string[]
}

export function processAndNormalize(): NormalizedEvent[] {
  const reduced = processEvents()
  const mapped: NormalizedEvent[] = reduced.map(e => {
    // handle failures via failMe('missing ip entity name')
    const ipEntityName = ipToReducedARN[e.sourceIPAddress]?.name ?? 'unknown entity name'
    // handle failures via failMe('missing arn name')
    const namedArn = e.resourcesARN.map(r => arnToNameMap[r]?.name ?? 'unknown arn name')

    return {
      action: e.action,
      ipEntityName,
      namedArn,
    } satisfies NormalizedEvent
  })

  printer('#############################################\n\n')
  printer('cloud trail events')
  printer(mapped)
  printer('\n\n#############################################')

  // TODO (om): ADDED FLOW LOGS
  const flowLogsNormalized = processAndNormalizeRawFlowLogs()
  printer('#############################################\n\n')
  printer('flow logs events:')
  printer(flowLogsNormalized)
  printer('\n\n#############################################')

  return [...flowLogsNormalized, ...mapped]
}

export function processEvents(): TransformedEvent[] {
  return transformEvents(events)
}

export function transformEvents(events: unknown[]): TransformedEvent[] {
  return events.map((e, idx) => {
    // validate inputs immediately
    try {
      assertIsEvent(e)
    } catch (err) {
      throw new Error(`Error processing event at index ${idx}: ${(err as Error).message}`)
    }

    // extract the ARNs
    const resourcesARN = e.resources.map(r => r.ARN)

    const serviceName = extractService(e.eventSource)

    return {
      action: `${serviceName}/${e.eventName}`,
      sourceIPAddress: e.sourceIPAddress,
      resourcesARN,
    }
  })
}

function assertIsEvent(e: any): asserts e is Event {
  if (typeof e !== 'object' || e === null) {
    throw new Error(`Invalid event: expected object but got ${typeof e}`)
  }
  if (typeof e.eventName !== 'string') {
    throw new Error('Invalid event: "eventName" must be a string')
  }
  if (typeof e.sourceIPAddress !== 'string') {
    throw new Error('Invalid event: "sourceIPAddress" must be a string')
  }
  if (!Array.isArray(e.resources)) {
    throw new Error('Invalid event: "resources" must be an array')
  }
  for (const [i, r] of e.resources.entries()) {
    if (typeof r !== 'object' || r === null) {
      throw new Error(`Invalid resource at index ${i}: expected object`)
    }
    if (typeof (r as any).ARN !== 'string') {
      throw new Error(`Invalid resource at index ${i}: "ARN" must be a string`)
    }
  }
}

export function extractService(eventSource: string): string {
  if (eventSource.trim() === '') {
    throw new Error('extractService: eventSource must be a non-empty string')
  }

  const parts = eventSource.split('.')
  if (parts.length < 1 || parts[0].trim() === '') {
    throw new Error(`extractService: invalid eventSource "${eventSource}"`)
  }

  return parts[0]
}
