#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config'; 
import * as cdk from 'aws-cdk-lib';
import { SuggestAppStack } from '../lib/suggestApp-stack';
import { SuggestApiAwsStack } from '../lib/suggestApp-Api-stack';

const app = new cdk.App();


const env: cdk.Environment = {
  account: process.env.AWS_ACCOUNT_ID,
  region: process.env.AWS_REGION
}

const tags = {
  cost: 'CompanyHeroTl',
  team: 'CompanyHero'
}

const suggestAppStack = new SuggestAppStack(app, "SuggestApp", {
  env,
  tags
})

const suggestApiAwsStack = new SuggestApiAwsStack(app, "SuggestApi", {
  suggestPlaylistFetchHandler: suggestAppStack.suggestPlaylistFetchHandler,
  tags,
  env
})

suggestApiAwsStack.addDependency(suggestAppStack)
