import React, { useContext, useEffect, useState } from "react";
import { X, Video, Lock, CircleDollarSign, Globe, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { StreamContext } from "../../contexts/StreamContext";

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStream: (streamData: { title: string; type: "public" | "private" | "premium" }) => void;
}

const CreateStreamModal: React.FC<CreateStreamModalProps> = ({ isOpen, onClose }) => {
  const [streamTitle, setStreamTitle] = useState("");
  const [selectedType, setSelectedType] = useState<"public" | "premium">("public");
  const [step, setStep] = useState<"select" | "details">("select");
  const [premiumPrice, setPremiumPrice] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const streamTypes = [
    {
      type: "public" as const,
      icon: Globe,
      title: "Public Stream",
      description: "Anyone can join and watch your stream",
      color: "bg-green-500",
      borderColor: "border-green-500",
    },
    {
      type: "premium" as const,
      icon: CircleDollarSign,
      title: "Premium Stream",
      description: "Viewers pay coins to watch your stream",
      color: "bg-orange-500",
      borderColor: "border-orange-500",
    },
  ];

  const handleClose = () => {
    setStreamTitle("");
    setSelectedType("public");
    setPremiumPrice("");
    setStep("select");
    onClose();
  };

  const handleTypeSelect = (type: "public" | "premium") => {
    setSelectedType(type);
    setStep("details"); // move to details modal
  };

  const handleStart = async () => {
    try {
      // Generate room ID for this streaming session
      const newRoomId = Math.random().toString(36).substring(2, 9);
      console.log('🎬 Creating new stream with roomId:', newRoomId);
      
      // Pass stream data through navigation state
      const streamData = {
        title: streamTitle,
        streamType: selectedType,
        name: user?.username || "Anonymous",
        price: selectedType === "premium" ? Number(premiumPrice) : 0,
      };
      
      navigate(`/streaming/${newRoomId}`, { state: streamData });
    } catch (err) {
      console.error("Failed to create stream:", err);
    } finally {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-dark-700 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
        {/* Wrapper with sliding animation */}
        <div className="flex transition-transform duration-500" style={{ transform: step === "select" ? "translateX(0%)" : "translateX(-100%)" }}>

          {/* Step 1 - Type Selection */}
          <div className="w-full flex-shrink-0">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Choose Stream Type</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {streamTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    onClick={() => handleTypeSelect(type.type)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left border-gray-600 bg-dark-600 hover:bg-dark-500`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`${type.color} p-2 rounded-lg flex-shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{type.title}</h3>
                        <p className="text-sm text-gray-400">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 - Details per Type */}
          <div className="w-full flex-shrink-0">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <button onClick={() => setStep("select")} className="text-gray-400 hover:text-white flex items-center space-x-1">
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">
                {selectedType === "public" && "Public Stream Details"}
                {selectedType === "premium" && "Premium Stream Setup"}
              </h2>

              {/* Stream title input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter stream title"
                  required
                  className="w-full p-3 rounded-lg bg-dark-600 text-white border border-gray-600 focus:border-primary-500"
                />
              </div>

              {selectedType === "premium" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (Coins)
                  </label>
                  <input
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                    placeholder="Enter coin price (e.g., 100)"
                    min="0"
                    required
                    className="w-full p-3 rounded-lg bg-dark-600 text-white border border-gray-600 focus:border-primary-500"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Viewers will pay this amount to watch your premium stream
                  </p>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={!streamTitle.trim() || (selectedType === "premium" && !premiumPrice)}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-transform duration-300 hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Video className="h-5 w-5" />
                <span>Start Streaming</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStreamModal;
