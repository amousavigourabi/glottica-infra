import * as backup from 'aws-cdk-lib/aws-backup';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Constants } from './constants';
import { Construct } from 'constructs';

export class TableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new dynamodb.Table(this, `Table-${id}`, {
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      partitionKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      sortKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    cdk.Tags.of(this.table).add('timestamp', new Date().toISOString());

    const backupVault = new backup.BackupVault(this, `BackupVault-${id}`, {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const plan = new backup.BackupPlan(this, `BackupPlan-${id}`, {
      backupPlanName: 'DynamoDBMonthlyBackup',
    });

    plan.addRule(new backup.BackupPlanRule({
      backupVault,
      deleteAfter: cdk.Duration.days(Constants.year),
      moveToColdStorageAfter: cdk.Duration.days(Constants.fourWeeks),
      ruleName: `MonthlySnapshot-${id}`,
      scheduleExpression: cdk.aws_events.Schedule.cron({
        day: '1',
        hour: '0',
        minute: '0',
      }),
    }));

    plan.addSelection(`BackupPlanSelection-${id}`, {
      resources: [
        backup.BackupResource.fromDynamoDbTable(this.table),
      ],
    });
  }
}
