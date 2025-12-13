export interface Participant {
  id: number;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isHandRaised: boolean;
}

export interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  time: string;
}

export interface MeetingData {
  title: string;
  description: string;
  isPublic: boolean;
  requirePassword: boolean;
  password: string;
  meetingId: string;
  inviteLink: string;
}

export interface JoinData {
  meetingId: string;
  displayName: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
}
