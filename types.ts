export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export type AppMode = 'generate' | 'edit';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
