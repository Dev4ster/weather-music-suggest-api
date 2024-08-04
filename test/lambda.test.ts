import { getGenreByTemperature, getSpotifyToken } from '../lambda/suggestPlaylist/suggestPlaylistFetchFunction';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Lambda Functions', () => {
  test('getGenreByTemperature returns correct genre', () => {
    expect(getGenreByTemperature(30)).toBe('Pop');
    expect(getGenreByTemperature(20)).toBe('Rock');
    expect(getGenreByTemperature(5)).toBe('Classical');
  });

  test('getSpotifyToken calls API and returns token', async () => {
    mockedAxios.post.mockResolvedValue({ data: { access_token: 'fake_token' } });

    const token = await getSpotifyToken('fake_client_id', 'fake_client_secret');
    expect(token).toBe('fake_token');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://accounts.spotify.com/api/token',
      null,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      })
    );
  });
});
