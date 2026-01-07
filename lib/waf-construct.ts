import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

interface WafConstructProps {
  scope: 'REGIONAL' | 'CLOUDFRONT';
}

export class WafConstruct extends Construct {
  public readonly arn: string;

  constructor(scope: Construct, id: string, props: WafConstructProps) {
    super(scope, id);

    const waf = new wafv2.CfnWebACL(this, `ApiWAF-${id}`, {
      defaultAction: { allow: {} },
      scope: props.scope,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'ApiWAF',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputs',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesIPReputationList',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesIPReputationList',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'IPReputation',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    this.arn = waf.attrArn;
  }
}
