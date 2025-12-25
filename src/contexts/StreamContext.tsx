import {
  createContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import Peer, { Instance as PeerInstance, SignalData } from 'simple-peer';

/* ================= TYPES ================= */

interface PeerEntry {
  id: string;
  name?: string;
  stream?: MediaStream;
}

interface StreamContextType {
  name: string;
  setName: (name: string) => void;
  title: string;
  setTitle: (title: string) => void;
  streamType: "public" | "premium";
  setStreamType: (type: "public" | "premium") => void;
  price: number;
  setPrice: (price: number) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  stream?: MediaStream;
  peers: PeerEntry[];
  myVideo: React.RefObject<HTMLVideoElement>;
  joinRoom: (roomOverride?: string, name?: string) => void;
  leaveRoom: () => void;
  isStreamer: boolean;
  setIsStreamer: (isStreamer: boolean) => void;
  socket: Socket;
}

interface ContextProviderProps {
  children: ReactNode;
}

/* ================= SOCKET ================= */

// Use localhost for development, render.com for production
const socket: Socket = io('http://localhost:8081');

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
});

/* ================= CONTEXT ================= */

export const StreamContext = createContext<StreamContextType>(
  {} as StreamContextType
);

/* ================= PROVIDER ================= */

export const StreamProvider = ({ children }: ContextProviderProps) => {
  const [stream, setStream] = useState<MediaStream>();
  const [name, setName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [streamType, setStreamType] = useState<"public" | "premium">("public");
  const [price, setPrice] = useState<number>(0);
  const [roomId, setRoomId] = useState<string>('');
  const [joinedRoom, setJoinedRoom] = useState<boolean>(false);
  const [peers, setPeers] = useState<PeerEntry[]>([]);
  const [isStreamer, setIsStreamer] = useState<boolean>(false);

  const myVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, PeerInstance>>(new Map());

  /* ================= HELPERS ================= */

  const removePeer = (peerId: string) => {
    peersRef.current.get(peerId)?.destroy();
    peersRef.current.delete(peerId);
    setPeers((prev) => prev.filter((p) => p.id !== peerId));
  };

  const addPeer = (peerId: string, initiator: boolean, remoteName?: string) => {
    // Don't create duplicate peer connections
    if (peersRef.current.has(peerId)) {
      console.log('⚠️ Peer already exists:', peerId);
      return;
    }

    // For one-way streaming:
    // - Streamer sends their stream to viewers (initiator=true, with stream)
    // - Viewers receive only (initiator=false, no stream)
    const peerConfig: any = {
      initiator,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:stun.relay.metered.ca:80",
          },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: "67ea82eebbfbb45a6980169c",
            credential: "IRK6MD5sjYCZ/0Rq",
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "67ea82eebbfbb45a6980169c",
            credential: "IRK6MD5sjYCZ/0Rq",
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: "67ea82eebbfbb45a6980169c",
            credential: "IRK6MD5sjYCZ/0Rq",
          },
          {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "67ea82eebbfbb45a6980169c",
            credential: "IRK6MD5sjYCZ/0Rq",
          },
        ],
      },
    };

    // Only streamer sends their stream
    if (isStreamer && stream) {
      peerConfig.stream = stream;
      console.log('📹 Creating peer as STREAMER (with stream)', { peerId, initiator });
    } else {
      console.log('👀 Creating peer as VIEWER (no stream)', { peerId, initiator, isStreamer });
    }

    const peer = new Peer(peerConfig);

    // Add peer to state immediately (without stream initially)
    setPeers((prev) => {
      if (prev.some((p) => p.id === peerId)) {
        return prev; // Already exists
      }
      console.log('➕ Adding peer to state:', { peerId, name: remoteName });
      return [...prev, { id: peerId, name: remoteName }];
    });

    peer.on('signal', (data: SignalData) => {
      console.log('📡 Sending signal to', peerId, data.type);
      socket.emit('signal', { roomId, targetId: peerId, data });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      console.log('🎥 RECEIVED STREAM from', peerId, remoteStream.getTracks());
      // Update peer with stream when it arrives
      setPeers((prev) =>
        prev.map((p) =>
          p.id === peerId ? { ...p, stream: remoteStream } : p
        )
      );
    });

    peer.on('close', () => {
      console.log('❌ Peer closed:', peerId);
      removePeer(peerId);
    });
    
    peer.on('error', (err) => {
      console.error('❌ Peer error:', peerId, err);
      removePeer(peerId);
    });

    peersRef.current.set(peerId, peer);
  };

  /* ================= EFFECTS ================= */

  // Get media stream - ONLY for streamers
  useEffect(() => {
    // Only request media if user is a streamer
    if (!isStreamer) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
      })
      .catch((err) => {
        console.error('Could not get media stream', err);
      });
  }, [isStreamer]);

  // Attach local stream to own video element when ready
  useEffect(() => {
    if (stream && myVideo.current && !myVideo.current.srcObject) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  // Socket lifecycle
  useEffect(() => {

    const handlePeersInRoom = ({ 
      peers 
    }: { 
      peers: Array<{ id: string; name?: string; isStreamer?: boolean }> 
    }) => {
      console.log('📥 Received peers-in-room:', peers);
      peers.forEach(({ id, name, isStreamer: peerIsStreamer }) => {
        // For one-way streaming:
        // - If I'm a streamer, I initiate to viewers (initiator: true)
        // - If I'm a viewer connecting to streamer, they initiate (initiator: false)
        const shouldInitiate = isStreamer && !peerIsStreamer;
        console.log('🔗 Connecting to peer:', { id, name, peerIsStreamer, myIsStreamer: isStreamer, shouldInitiate });
        addPeer(id, shouldInitiate, name);
      });
    };

    const handlePeerJoined = ({
      peerId,
      name: remoteName,
      isStreamer: peerIsStreamer,
    }: {
      peerId: string;
      name?: string;
      isStreamer?: boolean;
    }) => {
      console.log('📥 Peer joined:', { peerId, remoteName, peerIsStreamer });
      // For one-way streaming:
      // - If I'm a streamer and a viewer joined, I initiate (initiator: true)
      // - If I'm a viewer and streamer joined, they initiate (initiator: false)
      const shouldInitiate = isStreamer && !peerIsStreamer;
      console.log('🔗 Connecting to new peer:', { peerId, myIsStreamer: isStreamer, peerIsStreamer, shouldInitiate });
      addPeer(peerId, shouldInitiate, remoteName);
    };

    const handleSignal = ({
      from,
      data,
    }: {
      from: string;
      data: SignalData;
    }) => {
      console.log('📡 Received signal from', from, data.type);
      const peer = peersRef.current.get(from);
      if (peer) {
        peer.signal(data);
      } else {
        console.warn('⚠️ Received signal from unknown peer:', from);
      }
    };

    const handlePeerLeft = ({ peerId }: { peerId: string }) => {
      removePeer(peerId);
    };

    socket.on('peers-in-room', handlePeersInRoom);
    socket.on('peer-joined', handlePeerJoined);
    socket.on('signal', handleSignal);
    socket.on('peer-left', handlePeerLeft);

    return () => {
      socket.off('peers-in-room', handlePeersInRoom);
      socket.off('peer-joined', handlePeerJoined);
      socket.off('signal', handleSignal);
      socket.off('peer-left', handlePeerLeft);
      peersRef.current.forEach((peer, id) => {
        peer.destroy();
        peersRef.current.delete(id);
      });
      setPeers([]);
    };
    // We intentionally exclude addPeer/removePeer to avoid re-subscribing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, stream, isStreamer]);

  /* ================= ACTIONS ================= */

  const joinRoom = (roomOverride?: string, name?: string) => {
    const targetRoom = roomOverride || roomId;
    
    console.log('🚪 Attempting to join room:', { targetRoom, isStreamer, hasStream: !!stream });
    
    // For streamers, wait for stream. For viewers, no stream needed.
    if (isStreamer && !stream) {
      console.warn('⚠️ Streamer cannot join without stream');
      return;
    }
    if (!targetRoom) {
      console.warn('⚠️ No room ID provided');
      return;
    }
    
    // Leave current room if joining a different room
    if (joinedRoom && roomId && targetRoom !== roomId) {
      console.log('🚪 Leaving current room:', roomId);
      socket.emit('leaveRoom', { roomId });
      peersRef.current.forEach((peer, id) => {
        peer.destroy();
        peersRef.current.delete(id);
      });
      setPeers([]);
    }
    
    if (roomOverride) setRoomId(roomOverride);
    console.log('📤 Emitting joinRoom:', { roomId: targetRoom, name, isStreamer });
    socket.emit('joinRoom', { roomId: targetRoom, name, isStreamer });
    setJoinedRoom(true);
  };

  

  const leaveRoom = () => {
    if (roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    peersRef.current.forEach((peer, id) => {
      peer.destroy();
      peersRef.current.delete(id);
    });
    setPeers([]);
    setJoinedRoom(false);
    setRoomId('');
    
    // Stop all media tracks to release camera and microphone
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(undefined);
    }
  };

  /* ================= PROVIDER ================= */

  return (
    <StreamContext.Provider
      value={{
        name,
        setName,
        title,
        setTitle,
        streamType,
        setStreamType,
        price,
        setPrice,
        roomId,
        setRoomId,
        stream,
        peers,
        myVideo,
        joinRoom,
        leaveRoom,
        isStreamer,
        setIsStreamer,
        socket,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

