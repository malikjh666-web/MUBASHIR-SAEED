
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
  TOOL = 'tool'
}

export interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'audio' | 'document';
  base64?: string;
}

export interface GeneratedFile {
  fileName: string;
  content: string;
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  fileGenerated?: GeneratedFile;
  videoUrl?: string; // For Veo generated videos
  functionCall?: {
    name: string;
    args: any;
    id: string;
  };
  functionResponse?: {
    name: string;
    id: string;
    response: any;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  timestamp: number;
}
