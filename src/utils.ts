import { SPOTIFY_TOKEN_URL } from "./consts";

export function fetchSpotifyAuth(params: URLSearchParams) {
  return fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(process.env.REACT_APP_CLIENT_ID! + ":" + process.env.REACT_APP_CLIENT_SECRET!)}`,
    },
    body: params,
  })
}
