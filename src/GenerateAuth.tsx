import React from "react";
import { REDIRECT_URI, REQUEST_STATE_LENGTH, SPOTIFY_AUTH_URL } from "./consts";

function generateRandomChar() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function times<T>(amount: number, cb: (i: number) => T) {
  const arr = [] as T[];
  for (let i = 0; i < amount; i += 1) {
    arr.push(cb(i));
  }
  return arr;
}

function generateSequence(length: number) {
  return times(length, generateRandomChar).join("");
}

function GenerateAuth() {
  const requestState = React.useMemo(() => generateSequence(REQUEST_STATE_LENGTH), [])

  const handleClick = () => {
    const params = new URLSearchParams();

    params.append("response_type", "code");
    params.append("client_id", process.env.REACT_APP_CLIENT_ID!);
    params.append("scope", "user-read-currently-playing");
    params.append("redirect_uri", REDIRECT_URI);
    params.append("state", requestState);

    localStorage.setItem("requestState", requestState);

    (window as Window).location = `${SPOTIFY_AUTH_URL}?${params}`;
  }

  return (
    <div className="my-8 flex justify-center">
      <button className="border px-4 py-2 rounded" onClick={handleClick}>
        Generate Auth Token
      </button>
    </div>
  );
}

export default GenerateAuth;
