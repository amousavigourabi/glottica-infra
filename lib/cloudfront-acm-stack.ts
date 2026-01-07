import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import {DnsConstruct} from "./dns-construct";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export class CloudfrontAcmStack extends cdk.Stack {
  public readonly arn: string
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const rootDomain = 'glottica.org';
    const cdnDomain = 'glottica.org';

    const dns = new DnsConstruct(this, 'DnsConstruct', {
      rootDomain,
    });

    const cert = new acm.Certificate(this, 'CloudFrontCert', {
      domainName: cdnDomain,
      validation: acm.CertificateValidation.fromDns(dns.zone),
    });

    this.arn = cert.certificateArn;
  }
}
