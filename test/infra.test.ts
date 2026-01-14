import * as cdk from 'aws-cdk-lib/core';
import * as glottica from '../lib/glottica-stack';
import { Template } from 'aws-cdk-lib/assertions';

test('Hosted Zone A & AAAA records created', () => {
  const app = new cdk.App();
  const stack = new glottica.GlotticaStack(app, 'MyTestStack', {
    account: '123412341234',
    env: {
      account: '123412341234',
      region: process.env.AWS_REGION,
    },
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Route53::RecordSet', {
    Name: 'api.glottica.org.',
    Type: 'A',
  });
  template.hasResourceProperties('AWS::Route53::RecordSet', {
    Name: 'api.glottica.org.',
    Type: 'AAAA',
  });
});
