export interface ContactFormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  newsletter: boolean;
  timestamp?: any;
  status?: 'new' | 'read' | 'replied' | 'closed';
  id?: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
  id?: string;
}
