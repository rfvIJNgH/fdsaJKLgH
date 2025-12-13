import React, { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import NoChatSelected from "./NoChatSelected";
import ChatContainer from "./ChatContainer";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

const Message: React.FC = () => {
    const { selectedUser, clearSelectedUser } = useChatStore();
    const location = useLocation();
    const receiverProfile = location.state?.receiverProfile ?? null;

    useEffect(() => {
        if (!receiverProfile) {
            clearSelectedUser();
        }
    }, [location.pathname])

    return (
        <div className="h-screen bg-dark-700">
            <div className="flex items-center justify-center pt-10 px-4">
                <div className="bg-dark-600 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
                    <div className="flex h-full rounded-lg overflow-hidden">
                        <Sidebar />
                        {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Message;