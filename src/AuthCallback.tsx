import React from "react";
import { REDIRECT_URI } from "./consts";
import { fetchSpotifyAuth } from "./utils";

interface Token {
  refresh_token: string
}

interface ErrorProps {
  message: string
}
function Error({message}: ErrorProps) {
  return (
    <div className="flex justify-center px-8 py-4 text-rose-400 font-bold">
      {message}
    </div>
  );
}

interface CodeViewProps {
  code: string
}
function CodeView({code}: CodeViewProps) {
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      const params = new URLSearchParams();

      params.append("grant_type", "authorization_code");
      params.append("redirect_uri", REDIRECT_URI);
      params.append("code", code!);

      const response = await fetchSpotifyAuth(params);

      if (response.ok) {
        response.json().then(({refresh_token}: Token) => {
          setRefreshToken(refresh_token);
        });
      }
    })();
  }, [code]);

  if (refreshToken === null) { return null; }

  return (
    <div className="flex justify-center px-8 py-4 select-all">
      {`${window.location.origin}/${refreshToken}`}
    </div>
  );
}

interface AuthCallbackProps {
  params: URLSearchParams
}
function AuthCallback({params}: AuthCallbackProps) {
  const localRequestState = React.useMemo(() => localStorage.getItem("requestState"), []);

  if (params.get("state") !== localRequestState) { return <Error message="requestState mismatch" /> }
  if (params.has("error")) { return <Error message={params.get("error")!} /> }
  if (!params.has("code")) { return <Error message="code doesn't exist" /> }

  return <CodeView code={params.get("code")!} />;
}

export default AuthCallback;
