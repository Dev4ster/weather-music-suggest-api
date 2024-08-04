import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SuggestAppStack } from '../lib/suggestApp-stack';
import { SuggestApiAwsStack } from '../lib/suggestApp-Api-stack';

test('Lambda Function Created', () => {
  const app = new cdk.App();

  const stack = new SuggestAppStack(app, 'MyTestStack');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x',
  });
});



test(' API Gateway Created', () => {
  const app = new cdk.App();
  const lambdaStack = new SuggestAppStack(app, 'LambdaStack');

  const stack = new SuggestApiAwsStack(app, 'ApiStack', {
    suggestPlaylistFetchHandler: lambdaStack.suggestPlaylistFetchHandler
  });

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  template.resourceCountIs('AWS::ApiGateway::Resource', 1);
  template.resourceCountIs('AWS::ApiGateway::Method', 1);
});