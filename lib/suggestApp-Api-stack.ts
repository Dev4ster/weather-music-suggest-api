import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-logs'
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface SuggestApiAwsStackProps extends cdk.StackProps {
  suggestPlaylistFetchHandler: lambdaNodeJS.NodejsFunction
}

export class SuggestApiAwsStack extends cdk.Stack {


  constructor(scope: Construct, id: string, props: SuggestApiAwsStackProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, "SuggestApiLogs")

    const api = new apigateway.RestApi(this, "SuggestApi", {
      restApiName: 'SuggestApi',
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true
        })
      }
    })

    const suggestFetchIntegration = new apigateway.LambdaIntegration(props.suggestPlaylistFetchHandler)

		// /products
    const productsResource = api.root.addResource('suggest')
    productsResource.addMethod("GET", suggestFetchIntegration)
  }
}
