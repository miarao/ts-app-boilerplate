export const events = [
  {
    eventName: 'GetObject',
    eventSource: 's3.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/app1-role/session1',
      sessionContext: { sessionIssuer: { userName: 'app1-role' } },
    },
    sourceIPAddress: '10.0.1.42',
    resources: [
      {
        type: 'AWS::S3::Object',
        ARN: 'arn:aws:s3:::app-data-bucket-1/input.csv',
      },
    ],
  },
  {
    eventName: 'PutItem',
    eventSource: 'dynamodb.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/app2-role/session2',
      sessionContext: { sessionIssuer: { userName: 'app2-role' } },
    },
    sourceIPAddress: '10.0.2.15',
    resources: [
      {
        type: 'AWS::DynamoDB::Table',
        ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/app2-table',
      },
    ],
  },
  {
    eventName: 'Invoke',
    eventSource: 'lambda.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/batch-role/session3',
      sessionContext: { sessionIssuer: { userName: 'batch-role' } },
    },
    sourceIPAddress: '10.0.3.10',
    resources: [
      {
        type: 'AWS::Lambda::Function',
        ARN: 'arn:aws:lambda:us-east-1:123456789012:function:batchProcessorLambda',
      },
    ],
  },
  {
    eventName: 'Publish',
    eventSource: 'sns.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/alert-role/session4',
      sessionContext: { sessionIssuer: { userName: 'alert-role' } },
    },
    sourceIPAddress: '10.0.4.20',
    resources: [
      {
        type: 'AWS::SNS::Topic',
        ARN: 'arn:aws:sns:us-east-1:123456789012:alerts-topic',
      },
    ],
  },
  {
    eventName: 'GetItem',
    eventSource: 'dynamodb.amazonaws.com',
    userIdentity: {
      type: 'IAMUser',
      userName: 'alice',
      arn: 'arn:aws:iam::123456789012:user/alice',
    },
    sourceIPAddress: '198.51.100.123',
    resources: [
      {
        type: 'AWS::DynamoDB::Table',
        ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/userProfiles',
      },
    ],
  },
  {
    eventName: 'PutObject',
    eventSource: 's3.amazonaws.com',
    userIdentity: {
      type: 'IAMUser',
      userName: 'bob',
      arn: 'arn:aws:iam::123456789012:user/bob',
    },
    sourceIPAddress: '203.0.113.222',
    resources: [
      {
        type: 'AWS::S3::Object',
        ARN: 'arn:aws:s3:::app-logs-bucket/log1.txt',
      },
    ],
  },
  {
    eventName: 'GetItem',
    eventSource: 'dynamodb.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/app2-role/session2',
      sessionContext: { sessionIssuer: { userName: 'app2-role' } },
    },
    sourceIPAddress: '10.0.2.15',
    resources: [
      {
        type: 'AWS::DynamoDB::Table',
        ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/userProfiles',
      },
    ],
  },
  {
    eventName: 'PutItem',
    eventSource: 'dynamodb.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/app2-role/session2',
      sessionContext: { sessionIssuer: { userName: 'app2-role' } },
    },
    sourceIPAddress: '10.0.2.15',
    resources: [
      {
        type: 'AWS::DynamoDB::Table',
        ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/app2-table',
      },
    ],
  },
  {
    eventName: 'GetItem',
    eventSource: 'dynamodb.amazonaws.com',
    userIdentity: {
      type: 'IAMUser',
      userName: 'alice',
      arn: 'arn:aws:iam::123456789012:user/alice',
    },
    sourceIPAddress: '198.51.100.120',
    resources: [
      {
        type: 'AWS::DynamoDB::Table',
        ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/userProfiles',
      },
    ],
  },
  {
    eventName: 'Invoke',
    eventSource: 'lambda.amazonaws.com',
    userIdentity: {
      type: 'AssumedRole',
      arn: 'arn:aws:sts::123456789012:assumed-role/batch-role/session3',
      sessionContext: { sessionIssuer: { userName: 'batch-role' } },
    },
    sourceIPAddress: '10.0.3.10',
    resources: [
      {
        type: 'AWS::Lambda::Function',
        ARN: 'arn:aws:lambda:us-east-1:123456789012:function:analyticsLambda',
      },
    ],
  },
]
