import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class SuggestAppStack extends cdk.Stack {

  readonly suggestPlaylistFetchHandler: lambdaNodeJS.NodejsFunction

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    

    const suggestSecret = new secretsmanager.Secret(this, 'SuggestAppSecret', {
      secretName: 'SuggestAppAPICredentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY || '',
          SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
          SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
        }),
        generateStringKey: 'companyhero',
      },
    });

    const suggestArnParam = new ssm.StringParameter(this, 'SuggestAppSecretArn', {
      parameterName: '/suggest-music-service/secret-arn',
      stringValue: suggestSecret.secretArn,
    });

      this.suggestPlaylistFetchHandler = new lambdaNodeJS.NodejsFunction(this, "SuggestPlaylistFetchFunction", {
          memorySize: 300,
          runtime: lambda.Runtime.NODEJS_18_X,
          functionName: 'SuggestPlaylistFetchFunction',
          entry: 'lambda/suggestPlaylist/suggestPlaylistFetchFunction.ts',
          handler: 'handler',
          timeout: cdk.Duration.seconds(5),
          environment: {
            SECRET_ARN: suggestArnParam.stringValue,
          },
          bundling: {
            minify: true,
            sourceMap: false,
          },
          tracing: lambda.Tracing.ACTIVE,
          insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
      })

      suggestSecret.grantRead(this.suggestPlaylistFetchHandler);
  }
}
