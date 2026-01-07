import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface ComplianceBucketProps {
  sox: boolean;
}

export class ComplianceBucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ComplianceBucketProps) {
    super(scope, id);

    const retentionPeriod = cdk.Duration.days(props.sox ? 7 * 366 : 365);

    this.bucket = new s3.Bucket(this, `ComplianceBucket-${id}`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
      enforceSSL: true,
      objectLockDefaultRetention: props.sox ? {
        duration: retentionPeriod,
        mode: s3.ObjectLockMode.COMPLIANCE,
      } : undefined,
      objectLockEnabled: props.sox,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(7),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(28),
            },
          ],
          expiration: retentionPeriod,
        },
      ],
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
  }
}
