#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { GlotticaStack } from '../lib/glottica-stack';
import {CloudfrontAcmStack} from "../lib/cloudfront-acm-stack";

const app = new cdk.App();

const cfStack = new CloudfrontAcmStack(app, 'CloudfrontAcmStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  crossRegionReferences: true,
});

new GlotticaStack(app, 'GlotticaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-west-1',
  },
  crossRegionReferences: true,
  cloudFrontCert: cfStack.arn,
});
