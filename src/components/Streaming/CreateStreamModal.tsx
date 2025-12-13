import React, { useState } from "react";
import { X, Video, Lock, Sword, Globe, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStream: (streamData: { title: string; type: "public" | "private" | "battle" }) => void;
}

const CreateStreamModal: React.FC<CreateStreamModalProps> = ({ isOpen, onClose }) => {
  const [streamTitle, setStreamTitle] = useState("");
  const [selectedType, setSelectedType] = useState<"public" | "private" | "battle">("public");
  const [step, setStep] = useState<"select" | "details">("select");
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
      type: "private" as const,
      icon: Lock,
      title: "Private Stream",
      description: "Only invited users can join your stream",
      color: "bg-red-500",
      borderColor: "border-red-500",
    },
    {
      type: "battle" as const,
      icon: Sword,
      title: "Battle Stream",
      description: "Competitive streaming with other creators",
      color: "bg-orange-500",
      borderColor: "border-orange-500",
    },
  ];

  const handleClose = () => {
    setStreamTitle("");
    setSelectedType("public");
    setStep("select");
    onClose();
  };

  const handleTypeSelect = (type: "public" | "private" | "battle") => {
    setSelectedType(type);
    setStep("details"); // move to details modal
  };

  const handleStart = () => {
    navigate(`/streaming/${user?.username}/${selectedType}`);
    handleClose();
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
                {selectedType === "private" && "Private Stream Setup"}
                {selectedType === "battle" && "Battle Stream Arena"}
              </h2>

              {/* Example form */}
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Enter stream title"
                className="w-full p-3 rounded-lg bg-dark-600 text-white border border-gray-600 focus:border-primary-500"
              />

              {selectedType === "private" && (
                <input
                  type="text"
                  placeholder="Enter invite code"
                  className="w-full p-3 rounded-lg bg-dark-600 text-white border border-gray-600"
                />
              )}

              {selectedType === "battle" && (
                <p className="text-sm text-gray-400">
                  You’ll be matched with another creator for a live battle!
                </p>
              )}

              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-transform duration-300 hover:scale-105 flex items-center justify-center space-x-2"
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
