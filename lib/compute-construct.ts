import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ssm from 'aws-cdk-lib/aws-ssm'

interface ComputeConstructProps {
  table: dynamodb.ITable;
  codeBucket: s3.IBucket;
}

export class ComputeConstruct extends Construct {
  public readonly apiLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const objectVersion = ssm.StringParameter.valueForStringParameter(
      this,
      '/my/app/api-lambda-version'
    );

    this.apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromBucketV2(props.codeBucket, "apiLambdaCode/handler.zip", {
        objectVersion,
      }),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });

    props.table.grantReadWriteData(this.apiLambda);
  }
}
