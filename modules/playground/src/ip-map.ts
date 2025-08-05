export const ipToReducedARN: Record<string, { name: string }> = {
  '10.0.1.42': { name: 'app1-pod' },
  '10.0.2.15': { name: 'app2-pod' },
  '10.0.3.10': { name: 'batch-node' },
  '10.0.4.20': { name: 'alert-pod' },
  '10.0.1.100': { name: 's3-vpce' },
  '10.0.2.100': { name: 'ddb-vpce' },
  '10.0.3.200': { name: 'lambda-vpce' },
  '10.0.4.150': { name: 'sns-vpce' },
  '10.0.5.30': { name: 'some-service' },
}
