import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import axios from 'axios';
import { SecretsManager } from 'aws-sdk';
import * as AWSXRay from "aws-xray-sdk";
type Secrets = {
  SPOTIFY_CLIENT_ID: string
  OPENWEATHERMAP_API_KEY: string
  SPOTIFY_CLIENT_SECRET: string
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
AWSXRay.captureAWS(require('aws-sdk'))

const secretsManager = new SecretsManager();
let cachedSecrets: Secrets;

export async function handler(
  event: APIGatewayProxyEvent, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: Context
): Promise<APIGatewayProxyResult> {
  
  const city = event.queryStringParameters?.city;
  if (!city) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'City parameter is required' }),
    };
  }

  try {
    const secrets = await getSecrets();
    const spotifyToken = await getSpotifyToken(secrets.SPOTIFY_CLIENT_ID, secrets.SPOTIFY_CLIENT_SECRET);
    const temperature = await getTemperature(city, secrets.OPENWEATHERMAP_API_KEY);
    const genre = getGenreByTemperature(temperature);
    const musicSuggestions = await getMusicSuggestions(genre, spotifyToken);


    return {
      statusCode: 200,
      body: JSON.stringify({ genre, musicSuggestions, deploy: true }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred' }),
    };
  }
}

export function getXRaySubSegment(segmentName: string) {
  const segment = AWSXRay.getSegment();
  if (!segment) {
    throw new Error('X-Ray segment is undefined');
  }
  const subsegment = segment.addNewSubsegment(segmentName);
  return subsegment
}

export async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  const subsegment = getXRaySubSegment('getSpotifyToken');
  try {
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'client_credentials',
      },
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  
    return tokenResponse.data.access_token;
  }catch(error) {
    subsegment.addError(error as Error); 
    throw error;
  } finally {
    subsegment.close();
  }
}

export async function getSecrets(): Promise<Secrets> {
  const subsegment = getXRaySubSegment('getSecrets');
  try {
    if (!cachedSecrets) {
      const secretArn = process.env.SECRET_ARN || '';
      const response = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
      cachedSecrets = JSON.parse(response.SecretString || '{}');
    }
    return cachedSecrets as Secrets;
  }catch(error) {
    subsegment.addError(error as Error);
    throw error;
  } finally {
    subsegment.close();
  }
}

export async function getTemperature(city: string, apiKey: string): Promise<number> {

  const subsegment = getXRaySubSegment('getTemperature'); 

  try {
    const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        units: 'metric',
        appid: apiKey,
      },
    });
    return response.data.main.temp;
  } catch (error) {
    subsegment.addError(error as Error);
    throw error;
  } finally {
    subsegment.close();
  }
}


export function getGenreByTemperature(temp: number): string {
  if (temp > 25) {
    return 'Pop';
  } else if (temp >= 10 && temp <= 25) {
    return 'Rock';
  } else {
    return 'Classical';
  }
}


export async function getMusicSuggestions(genre: string, apiKey: string): Promise<string[]> {

  const subsegment = getXRaySubSegment('getMusicSuggestions');
  try {
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        seed_genres: genre.toLowerCase(),
        limit: 10,
      },
    });
  
    return response.data.tracks.map((track: {name : string}) => track.name);
  } catch (error) {
    subsegment.addError(error as Error);
    throw error;
  } finally {
    subsegment.close();
  }
}