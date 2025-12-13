import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = (serverUrl: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            socketRef.current = io(serverUrl, {
                transports: ["websocket"],
                withCredentials: true
            });

            socketRef.current.on('connect', () => {
                setSocket(socketRef.current);
            });

            socketRef.current.on('disconnect', () => {
                setSocket(null);
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, [serverUrl, isAuthenticated]);

    return socket;
};