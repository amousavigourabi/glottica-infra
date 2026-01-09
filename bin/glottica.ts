#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CloudfrontAcmStack } from '../lib/cloudfront-acm-stack';
import { GlotticaStack } from '../lib/glottica-stack';

const app = new cdk.App();

const certificateBaseRegion = 'us-east-1';

const cfStack = new CloudfrontAcmStack(app, 'CloudfrontAcmStack', {
  crossRegionReferences: true,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: certificateBaseRegion,
  },
});

new GlotticaStack(app, 'GlotticaStack', {
  account: process.env.AWS_ACCOUNT_ID!,
  cloudFrontCert: cfStack.arn,
  crossRegionReferences: true,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
  githubRepo: process.env.GITHUB_REPOSITORY!,
});
