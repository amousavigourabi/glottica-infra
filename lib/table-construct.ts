import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as backup from 'aws-cdk-lib/aws-backup';

export class TableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new dynamodb.Table(this, `Table-${id}`, {
      partitionKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
    });

    const backupVault = new backup.BackupVault(this, `BackupVault-${id}`, {
      encryptionKey: undefined,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const plan = new backup.BackupPlan(this, `BackupPlan-${id}`, {
      backupPlanName: 'DynamoDBMonthlyBackup',
    });

    plan.addRule(new backup.BackupPlanRule({
      ruleName: `MonthlySnapshot-${id}`,
      scheduleExpression: cdk.aws_events.Schedule.cron({ day: '1', hour: '0', minute: '0' }), // 1st of month UTC
      backupVault,
      moveToColdStorageAfter: cdk.Duration.days(30),
      deleteAfter: cdk.Duration.days(365),
    }));

    plan.addSelection(`BackupPlanSelection-${id}`, {
      resources: [
        backup.BackupResource.fromDynamoDbTable(this.table),
      ],
    });
  }
}
