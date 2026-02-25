export interface Action {
  task: string;
  assignee: string | null;
  deadline: string | null;
}

export interface MeetingReport {
  summary: string[];
  decisions: string[];
  actions: Action[];
  pending: string[];
  participants: string[];
}

export type OutputFormat = 'markdown' | 'slack' | 'email' | 'notion';

// --- File Upload Types ---

export type SupportedFileExtension = '.vtt' | '.srt' | '.txt';

export const SUPPORTED_EXTENSIONS: SupportedFileExtension[] = ['.vtt', '.srt', '.txt'];

export const SUPPORTED_MIME_TYPES: Record<SupportedFileExtension, string[]> = {
  '.vtt': ['text/vtt'],
  '.srt': ['application/x-subrip', 'text/plain'],
  '.txt': ['text/plain'],
};

export const MAX_FILE_SIZE_BYTES = 512_000; // 500 KB

export interface FileParseResult {
  /** The extracted plain text content */
  text: string;
  /** Original filename */
  filename: string;
  /** Detected file type */
  extension: SupportedFileExtension;
  /** Number of characters extracted */
  charCount: number;
}

export interface FileParseError {
  code: 'UNSUPPORTED_TYPE' | 'FILE_TOO_LARGE' | 'PARSE_ERROR' | 'EMPTY_FILE';
  message: string;
}

// --- Meeting History Types ---

export interface MeetingRecord {
  id: string;
  title: string;
  rawNotes: string;
  report: MeetingReport;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  createdAt: string;
  participantCount: number;
  actionCount: number;
}

export interface MeetingListResponse {
  meetings: MeetingListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SaveMeetingRequest {
  rawNotes: string;
  report: MeetingReport;
}

export interface SaveMeetingResponse {
  id: string;
  title: string;
  createdAt: string;
}

// --- Task / Kanban Types ---

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface TaskRecord {
  id: string;
  meetingId: string;
  meetingTitle: string;
  task: string;
  assignee: string | null;
  deadline: string | null;
  status: TaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: TaskRecord[];
}

export interface TaskUpdateRequest {
  status?: TaskStatus;
  position?: number;
  assignee?: string | null;
  deadline?: string | null;
}
