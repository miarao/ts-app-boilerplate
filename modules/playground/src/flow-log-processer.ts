import { printer } from 'misc'

import { NormalizedEvent } from './build-relationship-graph'
import { ipToReducedARN } from './ip-map'

interface FlowLogEntry {
  version: number
  accountId: string
  interfaceId: string
  srcaddr: string
  dstaddr: string
  srcport: number
  dstport: number
  protocol: number
  packets: number
  bytes: number
  start: number
  end: number
  action: string // e.g. "ACCEPT" or "REJECT"
  logStatus: string // e.g. "OK"
  actionResult: string
}

export function processAndNormalizeRawFlowLogs(): NormalizedEvent[] {
  const flowLogs = parseFlowLog()
  flowLogs.forEach((fl, i) => printer(`line: ${i} log: ${JSON.stringify(fl)}`))
  return normalize(flowLogs)
}

export function parseFlowLog(): FlowLogEntry[] {
  const rawFlowLog = `
version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status
2 123456789012 eni-111 10.0.1.42 10.0.1.100 56789 443 6 100 8000 1626666600 1626666660 ACCEPT OK
2 123456789012 eni-222 10.0.2.15 10.0.2.100 54321 443 6 120 9000 1626666610 1626666670 ACCEPT OK
2 123456789012 eni-333 10.0.3.10 10.0.3.200 34567 443 6 90 7000 1626666620 1626666680 ACCEPT OK
2 123456789012 eni-444 10.0.4.20 10.0.4.150 45678 443 6 80 6500 1626666630 1626666690 ACCEPT OK
2 123456789012 eni-555 10.0.4.20 10.0.5.30 5678 9090 6 70 5500 1626666640 1626666700 ACCEPT OK
2 123456789012 eni-666 10.0.1.42 10.0.2.15 8080 8080 6 150 12000 1626666650 1626666710 ACCEPT OK
`
  const lines = rawFlowLog
    .trim()
    .split('\n')
    // skip header line:
    .slice(1)

  return lines.map(line => {
    const [ver, acct, eni, srcaddr, dstaddr, srcport, dstport, proto, pkts, bytes, start, end, action, logStatus] = line
      .trim()
      .split(/\s+/)

    let actionResult: string
    // TODO (om): add more cases
    if (logStatus === 'OK') {
      if (action === 'ACCEPT' && Number(proto) === 6) {
        actionResult = 'establish/TCP'
      } else {
        actionResult = 'unknownOK'
      }
    } else {
      actionResult = 'unknownSkipOrNoData'
    }

    return {
      version: Number(ver),
      accountId: acct,
      interfaceId: eni,
      srcaddr,
      dstaddr,
      srcport: Number(srcport),
      dstport: Number(dstport),
      protocol: Number(proto),
      packets: Number(pkts),
      bytes: Number(bytes),
      start: Number(start),
      end: Number(end),
      action,
      logStatus,
      actionResult,
    }
  })
}

export function normalize(entries: FlowLogEntry[]): NormalizedEvent[] {
  return entries.map(entry => {
    printer(`entry source address: ${entry.srcaddr}`)
    const ipEntityName = ipToReducedARN[entry.srcaddr].name ?? 'unknown entity name'

    printer(`entry destination address: ${entry.srcaddr}`)
    const namedArn = ipToReducedARN[entry.dstaddr].name ?? 'unknown arn name'

    return {
      action: entry.action,
      ipEntityName,
      namedArn: [namedArn],
    }
  })
}
