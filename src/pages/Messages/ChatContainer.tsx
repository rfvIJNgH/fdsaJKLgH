import { useChatStore } from "../../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuth } from "../../contexts/AuthContext";
import { formatMessageTime } from "../../utils/formatMessageTime";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        ChatId,
        resetUnreadCount,
    } = useChatStore();
    const { user: currentUser, ProfileImage } = useAuth();
    
    const messageEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Helper function to check if message is from current user
    const isCurrentUserMessage = (message: any) => {
        // Convert both to strings for comparison to handle type mismatches
        const currentUserId = currentUser?.id?.toString();
        const messageSenderId = message.sender_id?.toString();
        
        console.log("Comparison - CurrentUserID:", currentUserId, "MessageSenderID:", messageSenderId);
        console.log("Is same user:", currentUserId === messageSenderId);
        
        return currentUserId === messageSenderId;
    };

    useEffect(() => {
        if (selectedUser && currentUser?.id) {
            getMessages(selectedUser.user.id, currentUser.id);
        }
    }, [selectedUser?.user.id, getMessages, currentUser?.id]);

    // Reset unread count when chat becomes active
    useEffect(() => {
        if (ChatId) {
            resetUnreadCount(ChatId);
        }
    }, [ChatId, resetUnreadCount]);

    useEffect(() => {
        if (messagesContainerRef.current && messages.length > 0) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.map((message) => {
                    const isFromCurrentUser = isCurrentUserMessage(message);
                    
                    return (
                        <div
                            key={message.id}
                            className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex items-end max-w-xs lg:max-w-md ${
                                isFromCurrentUser
                                    ? "flex-row-reverse space-x-2 space-x-reverse"
                                    : "space-x-2"
                            }`}>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                    <img
                                        src={
                                            isFromCurrentUser
                                                ? ProfileImage || "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                                                : selectedUser?.user.profile_image || "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                                        }
                                        alt="profile pic"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className={`flex flex-col ${isFromCurrentUser ? "items-end" : "items-start"}`}>
                                    <div className="text-xs text-gray-400 mb-1">
                                        {formatMessageTime(message.created_at)}
                                    </div>
                                    <div
                                        className={`px-4 py-2 rounded-2xl max-w-full break-words ${
                                            isFromCurrentUser
                                                ? "bg-primary-600 text-white rounded-br-md"
                                                : "bg-gray-600 text-gray-100 rounded-bl-md"
                                        }`}
                                    >
                                        {message.image_url && (
                                            <img
                                                src={message.image_url}
                                                alt="Attachment"
                                                className="max-w-[200px] rounded-lg mb-2"
                                            />
                                        )}
                                        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;