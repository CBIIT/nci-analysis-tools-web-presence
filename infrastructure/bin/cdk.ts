#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudFrontS3Stack } from '../lib/cloudfront-s3-stack';

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

new CloudFrontS3Stack(app, `AnalysisToolsStack-${TIER}`, {
  env: { account: AWS_ACCOUNT_ID, region },
  stackName: `${TIER}-analysistools-website`,
  description: 'CloudFront and S3 infrastructure for NCI Analysis Tools portal',
});

app.synth();
