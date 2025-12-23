import { useContext, useMemo, useEffect, useRef, useCallback } from "react";
import { StreamContext } from "../../contexts/StreamContext";
import { VideoOff, Users } from "lucide-react";

interface VideoPlayerProps {
  isFullScreen?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ isFullScreen = false }) => {
  const { name, stream, peers, roomId, isStreamer } = useContext(StreamContext);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const remotePeers = useMemo(() => peers ?? [], [peers]);

  // For one-way streaming:
  // - Streamer sees their own video
  // - Viewers see the streamer's video (which comes from peers)
  const streamerPeer = useMemo(() => {
    if (isStreamer) return null;
    // For viewers, find the streamer in peers list
    const foundPeer = remotePeers.find(peer => peer.stream) || null;
    console.log('🔍 Streamer peer search:', { remotePeers, foundPeer, hasPeers: remotePeers.length > 0 });
    return foundPeer;
  }, [remotePeers, isStreamer]);

  // Callback ref to handle stream assignment when video element mounts
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      localVideoRef.current = node;
      if (node && stream) {
        node.srcObject = stream;
      }
    },
    [stream]
  );

  // Also update srcObject when stream changes after mount
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Only show videos when in a room
  if (!roomId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <div className="text-center text-gray-400">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No room connected</p>
        </div>
      </div>
    );
  }

  // Fullscreen layout - main video fills the screen with thumbnails
  if (isFullScreen) {
    return (
      <div className="absolute inset-0 w-full h-full bg-black">
        {/* STREAMER VIEW */}
        {isStreamer && (
          <>
            {/* Loading state when no stream yet */}
            {!stream && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-sm text-gray-300">Accessing camera...</span>
                <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                  Please allow camera and microphone access when prompted
                </p>
              </div>
            )}

            {/* Streamer's own video */}
            {stream && (
              <video
                playsInline
                muted
                ref={setVideoRef}
                autoPlay
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}

            {/* Camera off overlay */}
            {stream && !stream.getVideoTracks()[0]?.enabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                <div className="text-center">
                  <VideoOff className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Camera is off</p>
                </div>
              </div>
            )}

            {/* Your name badge */}
            {stream && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm font-medium">
                  {name || "Me"} (Streamer)
                </span>
              </div>
            )}
          </>
        )}

        {/* VIEWER VIEW */}
        {!isStreamer && (
          <>
            {/* Loading state when waiting for streamer */}
            {!streamerPeer && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-sm text-gray-300">Connecting to stream...</span>
                <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                  Waiting for the streamer
                </p>
              </div>
            )}

            {/* Display streamer's video */}
            {streamerPeer && streamerPeer.stream && (
              <StreamerVideo peer={streamerPeer} />
            )}

            {/* Streamer name badge
            {streamerPeer && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm font-medium">
                  {streamerPeer.name || "Streamer"}
                </span>
              </div>
            )} */}
          </>
        )}
      </div>
    );
  }

  // Grid layout - for non-fullscreen mode (original behavior)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-center mt-3 gap-4">
      {/* STREAMER VIEW - Show own video */}
      {isStreamer && (
        <>
          {!stream && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-200 rounded-md min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <span className="text-sm text-gray-600">Accessing camera...</span>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Please allow camera and microphone access when prompted
              </p>
            </div>
          )}

          {stream && (
            <div>
              <h5 className="mb-2 text-sm font-medium text-black">
                {name || "Me"} (Streaming)
              </h5>
              <video
                playsInline
                muted
                ref={setVideoRef}
                autoPlay
                className="w-full max-w-[600px] rounded-md"
              />
            </div>
          )}
        </>
      )}

      {/* VIEWER VIEW - Show streamer's video */}
      {!isStreamer && (
        <>
          {!streamerPeer && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-200 rounded-md min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <span className="text-sm text-gray-600">Connecting to stream...</span>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Waiting for the streamer
              </p>
            </div>
          )}

          {streamerPeer && streamerPeer.stream && (
            <RemoteVideo peer={streamerPeer} />
          )}
        </>
      )}
    </div>
  );
};

// Thumbnail component for fullscreen mode
const RemoteThumbnail: React.FC<{ peer: any }> = ({ peer }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-colors">
      <video
        playsInline
        autoPlay
        muted
        ref={videoRef}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-60 px-2 py-0.5 rounded backdrop-blur-sm">
        <span className="text-white text-xs font-medium truncate block">
          {peer.name || "Participant"}
        </span>
      </div>
    </div>
  );
};

// Streamer video component for viewers in fullscreen
const StreamerVideo: React.FC<{ peer: any }> = ({ peer }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log('🎬 StreamerVideo component:', { peer, hasStream: !!peer.stream });
    if (videoRef.current && peer.stream) {
      console.log('✅ Setting stream to video element:', peer.stream.getTracks());
      videoRef.current.srcObject = peer.stream;
      videoRef.current.muted = true; // Ensure muted for autoplay
      // Ensure video plays
      videoRef.current.play().catch(err => {
        console.error('❌ Error playing video:', err);
        // Try playing muted as fallback
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => console.error('Failed to play even when muted:', e));
        }
      });
    }
  }, [peer.stream]);

  return (
    <video
      playsInline
      autoPlay
      muted
      controls
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-contain"
    />
  );
};

// Separate component for remote videos (grid mode)
const RemoteVideo: React.FC<{ peer: any }> = ({ peer }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log('🎬 RemoteVideo component:', { peer, hasStream: !!peer.stream });
    if (videoRef.current && peer.stream) {
      console.log('✅ Setting stream to remote video element:', peer.stream.getTracks());
      videoRef.current.srcObject = peer.stream;
      videoRef.current.muted = true; // Ensure muted for autoplay
      // Ensure video plays
      videoRef.current.play().catch(err => {
        console.error('❌ Error playing remote video:', err);
        // Try playing muted as fallback
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => console.error('Failed to play even when muted:', e));
        }
      });
    }
  }, [peer.stream]);

  return (
    <div>
      <h5 className="mb-2 text-sm text-black font-medium">
        {peer.name || "Participant"}
      </h5>
      <video
        playsInline
        autoPlay
        muted
        controls
        ref={videoRef}
        className="w-full max-w-[600px] rounded-md"
      />
    </div>
  );
};

export default VideoPlayer;