import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import {DnsConstruct} from "./dns-construct";
import {TableConstruct} from "./table-construct";
import {ComputeConstruct} from "./compute-construct";
import {ApiRoutingConstruct} from "./api-routing-construct";
import {CdnConstruct} from "./cdn-construct";
import {CodeBucketConstruct} from "./code-bucket-construct";
import {ComplianceBucketConstruct} from "./compliance-bucket-construct";
import {TrailConstruct} from "./trail-construct";

interface GlotticaStackProps extends cdk.StackProps {
  cloudFrontCert: string,
}

export class GlotticaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GlotticaStackProps) {
    super(scope, id, props);

    const rootDomain = 'glottica.org';
    const apiDomain = 'api.glottica.org';
    const dnsDomain = 'glottica.org';

    const dns = new DnsConstruct(this, 'DnsConstruct', {
      rootDomain,
    });

    const trailBucket = new ComplianceBucketConstruct(this, 'TrailBucketConstruct', {
      sox: false,
    });
    const logging = new ComplianceBucketConstruct(this, 'LoggingConstruct', {
      sox: false,
    });
    const lambdaCode = new CodeBucketConstruct(this, 'CodeBucketConstruct');

    new TrailConstruct(this, 'TrailConstruct', {
      putEvents: [lambdaCode.bucket],
      trailBucket: trailBucket.bucket,
    });

    const table = new TableConstruct(this, 'TableConstruct');

    const compute = new ComputeConstruct(this, 'ComputeConstruct', {
      table: table.table,
      codeBucket: lambdaCode.bucket,
    });

    new ApiRoutingConstruct(this, 'ApiRoutingConstruct', {
      lambda: compute.apiLambda,
      hostedZone: dns.zone,
      domainName: apiDomain,
    });

    new CdnConstruct(this, 'CdnConstruct', {
      hostedZone: dns.zone,
      loggingBucket: logging.bucket,
      domainName: dnsDomain,
      certArn: props.cloudFrontCert,
    });
  }
}
