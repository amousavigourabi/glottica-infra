import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface GitHubIamConstructProps {
  awsAccountId: string;
  githubRepo: string;
}

export class GitHubIamConstruct extends Construct {

  constructor(scope: Construct, id: string, props: GitHubIamConstructProps) {
    super(scope, id);

    new iam.OpenIdConnectProvider(this, 'GitHubActionsOidcProvider', {
      clientIds: ['sts.amazonaws.com'],
      url: 'https://token.actions.githubusercontent.com',
    });

    const githubRole = new iam.Role(this, 'GithubActionsRole', {
      assumedBy: new iam.FederatedPrincipal(
        `arn:aws:iam::${props.awsAccountId}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': `repo:${props.githubRepo}:ref:refs/heads/master`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      description: 'Entrypoint role for GitHub actions.',
      roleName: 'github-actions-role',
    });

    const deploymentRole = new iam.Role(this, 'DeploymentRole', {
      assumedBy: new iam.ArnPrincipal(githubRole.roleArn),
      description: 'Deployment role assumed by GitHub actions.',
      roleName: 'deploymentRole',
    });

    deploymentRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
    );

    githubRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          deploymentRole.roleArn,
        ],
      }),
    );
  }
}
