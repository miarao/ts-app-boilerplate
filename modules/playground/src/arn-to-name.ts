export const arnToNameMap: Record<string, { name: string }> = {
  'arn:aws:s3:::app-data-bucket-1/input.csv': {
    name: 'app-data-bucket-1',
  },
  'arn:aws:dynamodb:us-east-1:123456789012:table/app2-table': {
    name: 'app2-table',
  },
  'arn:aws:lambda:us-east-1:123456789012:function:batchProcessorLambda': {
    name: 'batchProcessorLambda',
  },
  'arn:aws:sns:us-east-1:123456789012:alerts-topic': {
    name: 'alerts-topic',
  },
  'arn:aws:dynamodb:us-east-1:123456789012:table/userProfiles': {
    name: 'userProfiles',
  },
  'arn:aws:s3:::app-logs-bucket/log1.txt': {
    name: 'app-logs-bucket',
  },
}
