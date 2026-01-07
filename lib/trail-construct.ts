import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';

interface TrailConstructProps {
  putEvents: s3.IBucket[];
  trailBucket: s3.IBucket;
}

export class TrailConstruct extends Construct {
  constructor(scope: Construct, id: string, props: TrailConstructProps) {
    super(scope, id);

    const trail = new cloudtrail.Trail(this, 'DeploymentTrail', {
      bucket: props.trailBucket,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      includeGlobalServiceEvents: true,
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    trail.addS3EventSelector(
      props.putEvents.map(bucket => ({ bucket })),
      {
        readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
      }
    );
  }
}
