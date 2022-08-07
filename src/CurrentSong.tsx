import React, { useRef, useState } from "react";
import { SPOTIFY_POLL_MS, SPOTIFY_POLL_URL } from "./consts";
import { useParams } from "react-router-dom";
import { fetchSpotifyAuth } from "./utils";
import { animated, SpringRef, useSpring } from "react-spring";

interface Token {
  access_token: string
  expires_in: number
}

interface ExpiresInWrapper {
  value: number,
}

interface Song {
  item: SongItem
  is_playing: boolean
  progress_ms: number
}

interface SongItem {
  name: string
  id: string
  artists: SongArtist[]
  album: SongAlbum
  duration_ms: number
}

interface SongArtist {
  name: string
}

interface SongAlbum {
  name: string
  images: [SongImage, SongImage, SongImage]
}

interface SongImage {
  height: number
  width: number
  url: string
}

interface SongCardProps {
  trackSpring: React.HTMLAttributes<object>["style"]
  song: Song | null
}

function useMarquee<T>(
  song: Song | null,
  api: SpringRef<T>,
  ref: React.MutableRefObject<HTMLDivElement | null>,
) {
  React.useEffect(() => {
    (() => {
      if (song === null) { return; }
      if (ref.current === null) { return; }

      const {scrollWidth, clientWidth} = ref.current;
      const diff = scrollWidth - clientWidth;

      api.stop();
      // @ts-ignore
      api.set({transform: "translateX(0px)"});

      if (diff === 0) { return; }

      // @ts-ignore
      api.start({
        config: {duration: diff * 10 * 3},
        loop: { reverse: true },
        delay: 1000 * 5,
        from: {transform: "translateX(0px)"},
        to: {transform: `translateX(${-diff}px)`},
      });
    })();
  }, [ref, song, api]);
}

function SongCard({trackSpring, song}: SongCardProps) {
  const nameRef = useRef(null);
  const artistsRef = useRef(null);
  const albumRef = useRef(null);

  const [nameSpring, nameSpringApi] = useSpring(() => ({transform: "translateX(0px)"}));
  const [artistsSpring, artistsSpringApi] = useSpring(() => ({transform: "translateX(0px)"}));
  const [albumSpring, albumSpringApi] = useSpring(() => ({transform: "translateX(0px)"}));

  useMarquee(song, nameSpringApi, nameRef);
  useMarquee(song, artistsSpringApi, artistsRef);
  useMarquee(song, albumSpringApi, albumRef);

  if (song === null) { return null; }

  return (
    <div className="w-[32rem] shrink-0">
      <div className="h-1.5 bg-zinc-500">
        <animated.div className="h-1.5 bg-[#1ed760]" style={trackSpring} />
      </div>
      <div className="flex gap-4 mx-8 my-4">
        <div className="shrink-0 h-24 w-24 flex flex-col justify-center">
          <img className="h-24 w-24" width={96} src={song.item.album.images[0].url}/>
        </div>
        <div className="flex flex-1 flex-col justify-center w-min overflow-hidden">
          <animated.div
            ref={nameRef}
            className="text-stone-50 font-bold text-xl whitespace-nowrap"
            style={nameSpring}
          >
            {song.item.name}
          </animated.div>
          <animated.div
            ref={artistsRef}
            className="text-stone-200 text-xs whitespace-nowrap"
            style={artistsSpring}
          >
            {song.item.artists.map(({name}) => name).join(", ")}
          </animated.div>
          <animated.div
            ref={albumRef}
            className="text-stone-500 text-xs whitespace-nowrap"
            style={albumSpring}
          >
            {song.item.album.name}
          </animated.div>
        </div>
      </div>
    </div>
  );
}

function preloadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = reject;
    image.onabort = reject;

    image.src = url;
  });
}

interface SongViewProps {
  accessToken: string | null
}

function SongView({accessToken}: SongViewProps) {
  const [song, setSong] = useState<Song | null>(null);
  const [nextSong, setNextSong] = useState<Song | null>(null);


  const [trackSpring, trackSpringApi] = useSpring(() => ({width: "0%"}));
  const [spring, api] = useSpring(() => ({
    transform: "translateX(0%)",
    current: "scale(1)",
    next: "scale(0.5)",
  }));

  const fetchNextSong = React.useCallback(async () => {
    if (accessToken === null) { return; }
    const response = await fetch(SPOTIFY_POLL_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    if (response.status === 200) {
      const nextSong = await response.json() as Song;

      const {is_playing, progress_ms, item: {duration_ms}} = nextSong;
      const percentage = progress_ms / duration_ms * 100;
      const remaining = duration_ms - progress_ms;

      if (remaining < SPOTIFY_POLL_MS) {
        setTimeout(fetchNextSong, remaining);
      }

      trackSpringApi.set({width: `${percentage}%`});

      if (is_playing) {
        trackSpringApi.start({width: "100%", config: {duration: remaining}});
      } else {
        trackSpringApi.stop();
      }

      if (song === null) {
        setSong(nextSong);
        return;
      }
      if (song.item.id === nextSong.item.id) { return; }
      setNextSong(nextSong);
    }
  }, [song, accessToken, trackSpringApi, setSong, setNextSong]);

  React.useEffect(() => {
    const interval = setInterval(fetchNextSong, SPOTIFY_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchNextSong]);

  React.useEffect(() => {
    (() => {
      if (nextSong === null) { return; }
      api.start({to: async (next) => {
        await preloadImage(nextSong.item.album.images[1].url);
        await next({
          transform: "translateX(-100%)",
          current: "scale(0.5)",
          next: "scale(1)",
        });
        setSong(nextSong);
        setNextSong(null);
      }});
    })();
  }, [nextSong, setSong, api]);

  React.useEffect(() => {
    api.set({
      transform: "translateX(0%)",
      current: "scale(1)",
      next: "scale(0.5)",
    });
  }, [song, api]);

  return (
    <div className="w-[32rem] overflow-hidden bg-zinc-900">
      <animated.div className="flex" style={spring}>
        <animated.div style={{transform: spring.current}}>
          {/*// @ts-ignore */}
          <SongCard song={song} trackSpring={trackSpring}/>
        </animated.div>
        <animated.div style={{transform: spring.next}}>
          {/*// @ts-ignore */}
          <SongCard song={nextSong} trackSpring={trackSpring}/>
        </animated.div>
      </animated.div>
    </div>
  );
}

function CurrentSong() {
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [expiresIn, setExpiresIn] = React.useState<ExpiresInWrapper>({value: 60});
  const { refreshToken } = useParams();

  React.useEffect(() => {
    if (expiresIn !== null && refreshToken !== null) {
      const timeout = setTimeout(async () => {
        const params = new URLSearchParams();
        params.append("grant_type", "refresh_token");
        params.append("refresh_token", refreshToken!);

        const response = await fetchSpotifyAuth(params);

        if (response.ok) {
          response.json().then(({access_token, expires_in}: Token) => {
            setAccessToken(access_token);
            setExpiresIn({value: expires_in});
          });
        }
      }, (expiresIn.value - 60) * 1000);
      return () => clearTimeout(timeout);
    }
  }, [expiresIn, refreshToken, setAccessToken, setExpiresIn]);

  return <SongView accessToken={accessToken} />;
}

export default CurrentSong;
