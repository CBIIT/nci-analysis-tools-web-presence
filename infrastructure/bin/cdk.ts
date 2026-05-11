#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsAppStack } from '../lib/ecs-app-stack';

const TIER = process.env.TIER;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;

if (!TIER) {
  console.error("Error: TIER environment variable is not defined");
  process.exit(1);
}

if (!AWS_ACCOUNT_ID) {
  console.error("Error: AWS_ACCOUNT_ID environment variable is not defined");
  process.exit(1);
}

const app = new cdk.App();
const region = process.env.AWS_REGION || 'us-east-1';

new EcsAppStack(app, `AnalysisToolsPortalStack-${TIER}`, {
  env: { account: AWS_ACCOUNT_ID, region },
  stackName: `${TIER}-analysistools-portal`,
  description: 'ECS infrastructure for NCI Analysis Tools landing page',

  tier: TIER,
  appName: process.env.APP_NAME || 'analysistools-portal',
  appNamespace: process.env.APP_NAMESPACE || 'analysistools',
  appService: process.env.APP_SERVICE || 'web',
  appDomain: process.env.APP_DOMAIN || (TIER === 'prod' ? 'analysistools.cancer.gov' : `analysistools-${TIER}.cancer.gov`),

  vpcId: process.env.VPC_ID || '',
  subnetIds: (process.env.SUBNET_IDS || '').split(','),
  securityGroupIds: (process.env.SECURITY_GROUP_IDS || '').split(','),
  clusterArn: process.env.CLUSTER_ARN || '',
  listenerArn: process.env.LISTENER_ARN || '',
  appRoleArn: process.env.APP_ROLE_ARN || '',

  listenerRulePriority: Number(process.env.LISTENER_RULE_PRIORITY || '999'),
  healthCheckPath: process.env.HEALTH_CHECK_PATH || '/',
  gracePeriod: Number(process.env.GRACE_PERIOD || '60'),

  cpu: Number(process.env.WEB_CPU || '256'),
  memory: Number(process.env.WEB_MEMORY || '512'),
  desiredCount: Number(process.env.WEB_DESIRED_COUNT || '1'),
  containerPort: Number(process.env.WEB_CONTAINER_PORT || '80'),

  nonProdSchedule: process.env.WEB_NON_PROD_SCHEDULE === 'true',
  scheduledMinCapacity: Number(process.env.SCHEDULED_MIN_CAPACITY || '1'),
  scheduledMaxCapacity: Number(process.env.SCHEDULED_MAX_CAPACITY || '1'),
});

app.synth();
