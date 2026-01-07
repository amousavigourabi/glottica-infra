import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';

interface DnsConstructProps {
  rootDomain: string;
}

export class DnsConstruct extends Construct {
  public readonly zone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: DnsConstructProps) {
    super(scope, id);

    try {
      this.zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: props.rootDomain,
      });
    } catch (err) {
      this.zone = new route53.PublicHostedZone(this, 'HostedZone', {
        zoneName: props.rootDomain,
      });
    }
  }
}
