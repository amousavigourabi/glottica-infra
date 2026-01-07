import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {WafConstruct} from "./waf-construct";

interface ApiRoutingConstructProps {
  lambda: lambda.Function;
  hostedZone: route53.IHostedZone;
  domainName: string;
}

export class ApiRoutingConstruct extends Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiRoutingConstructProps) {
    super(scope, id);

    const certificate = new acm.Certificate(this, `ApiCertificate-${id}`, {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });

    this.api = new apigw.RestApi(this, `MyApi-${id}`, {
      restApiName: 'MyApi',
      domainName: {
        domainName: props.domainName,
        certificate,
      },
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    const v1Api = this.api.root
      .addResource('api')
      .addResource('v1');

    v1Api.addMethod('GET', new apigw.LambdaIntegration(props.lambda));

    const waf = new WafConstruct(this, 'ApiWaf', {
      scope: 'REGIONAL',
    });

    new wafv2.CfnWebACLAssociation(this, `ApiWafAssoc-${id}`, {
      resourceArn: this.api.arnForExecuteApi(),
      webAclArn: waf.arn,
    });

    if (!props.domainName.endsWith(props.hostedZone.zoneName)) {
      throw new Error(`CloudFront domain ${props.domainName} is not compatible with hosted zone at ${props.hostedZone.zoneName}.`);
    }
    const sliceEnd = Math.max(props.domainName.length - props.hostedZone.zoneName.length - 1, 0);
    const processedDomainName = props.domainName.slice(0, sliceEnd);

    new route53.ARecord(this, `ApiARecord-${id}`, {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(this.api)),
      recordName: processedDomainName,
    });
  }
}
