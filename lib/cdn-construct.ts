import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import {WafConstruct} from "./waf-construct";

interface CdnConstructProps {
  hostedZone: route53.IHostedZone;
  loggingBucket: s3.Bucket;
  domainName: string;
  certArn: string;
}

export class CdnConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CdnConstructProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.loggingBucket,
      serverAccessLogsPrefix: 's3-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const cert = acm.Certificate.fromCertificateArn(this, 'CloudFrontCert', props.certArn);

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      signing: {
        behavior: cloudfront.SigningBehavior.ALWAYS,
        protocol: cloudfront.SigningProtocol.SIGV4,
      },
    });

    this.distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3StaticWebsiteOrigin(this.bucket, {
          originAccessControlId: oac.originAccessControlId,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/error/index.html',
          responseHttpStatus: 200,
        },
      ],
      domainNames: [
        props.domainName,
      ],
      certificate: cert,
      enableLogging: true,
      logBucket: props.loggingBucket,
    });

    const waf = new WafConstruct(this, 'CdnWaf', {
      scope: 'CLOUDFRONT',
    });

    new wafv2.CfnWebACLAssociation(this, 'CFWafAssoc', {
      resourceArn: this.distribution.distributionArn,
      webAclArn: waf.arn,
    });

    if (!props.domainName.endsWith(props.hostedZone.zoneName)) {
      throw new Error(`CloudFront domain ${props.domainName} is not compatible with hosted zone at ${props.hostedZone.zoneName}.`);
    }
    const sliceEnd = Math.max(props.domainName.length - props.hostedZone.zoneName.length - 1, 0)
    const processedDomainName = props.domainName.slice(0, sliceEnd);

    new route53.ARecord(this, 'WebsiteARecord', {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
      recordName: processedDomainName,
    });
  }
}
