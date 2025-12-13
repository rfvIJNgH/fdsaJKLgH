import React from "react";
import { User, Hand, Mic, MicOff } from "lucide-react";
import { Participant } from "../../types/meeting.types";

interface VideoCardProps {
  participant: Participant;
  isMain?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  participant,
  isMain = false,
}) => (
  <div
    className={`relative bg-gray-900 rounded-lg overflow-hidden ${
      isMain ? "col-span-2 row-span-2" : ""
    }`}
  >
    {participant.hasVideo ? (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
      </div>
    ) : (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-gray-300" />
        </div>
      </div>
    )}

    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
          {participant.name}
        </span>
        {participant.isHost && (
          <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
            HOST
          </span>
        )}
      </div>
      <div className="flex items-center space-x-1">
        {participant.isHandRaised && (
          <Hand className="w-4 h-4 text-yellow-400" />
        )}
        {!participant.isMuted ? (
          <Mic className="w-4 h-4 text-green-400" />
        ) : (
          <MicOff className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  </div>
);
