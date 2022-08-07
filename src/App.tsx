import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GenerateAuth from "./GenerateAuth";
import CurrentSong from "./CurrentSong";
import AuthCallback from "./AuthCallback";

function App() {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <GenerateAuth /> } />
        <Route path="/callback" element={ <AuthCallback params={params} /> } />
        <Route path="/:refreshToken" element={ <CurrentSong /> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
