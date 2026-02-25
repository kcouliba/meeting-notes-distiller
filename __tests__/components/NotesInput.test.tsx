import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { NotesInput } from '@/components/NotesInput';

// Mock the parsers module
jest.mock('@/lib/parsers', () => ({
  parseTranscriptFile: jest.fn(),
  isFileParseError: jest.fn((result: unknown) => {
    return result !== null && typeof result === 'object' && 'code' in (result as Record<string, unknown>);
  }),
}));

import { parseTranscriptFile } from '@/lib/parsers';

// Wrapper to provide controlled state for tests
function NotesInputWrapper(props: { onSubmit?: (notes: string) => void; isLoading?: boolean; initialNotes?: string }) {
  const [notes, setNotes] = useState(props.initialNotes ?? '');
  return (
    <NotesInput
      onSubmit={props.onSubmit ?? jest.fn()}
      isLoading={props.isLoading ?? false}
      notes={notes}
      onNotesChange={setNotes}
    />
  );
}

describe('NotesInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea and buttons', () => {
    render(<NotesInputWrapper />);

    expect(screen.getByPlaceholderText(/paste your meeting notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /distill/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('character counter shows correct count', () => {
    render(<NotesInputWrapper />);

    const textarea = screen.getByPlaceholderText(/paste your meeting notes/i);
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    expect(screen.getByText(/11/)).toBeInTheDocument();
  });

  it('submit button is disabled when empty', () => {
    render(<NotesInputWrapper />);

    const submitButton = screen.getByRole('button', { name: /distill/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is disabled when over 50000 chars', () => {
    render(<NotesInputWrapper />);

    const textarea = screen.getByPlaceholderText(/paste your meeting notes/i);
    const longText = 'a'.repeat(50001);
    fireEvent.change(textarea, { target: { value: longText } });

    const submitButton = screen.getByRole('button', { name: /distill/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onSubmit with notes text', () => {
    const onSubmit = jest.fn();
    render(<NotesInputWrapper onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting notes/i);
    fireEvent.change(textarea, { target: { value: 'Some meeting notes' } });

    const submitButton = screen.getByRole('button', { name: /distill/i });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith('Some meeting notes');
  });

  it('shows loading state when isLoading is true', () => {
    render(<NotesInputWrapper isLoading={true} />);

    expect(screen.getByText(/distilling/i)).toBeInTheDocument();
  });

  it('clears text when clear button is clicked', () => {
    render(<NotesInputWrapper />);

    const textarea = screen.getByPlaceholderText(/paste your meeting notes/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Some text' } });
    expect(textarea.value).toBe('Some text');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(textarea.value).toBe('');
  });

  it('shows supported formats hint when textarea is empty', () => {
    render(<NotesInputWrapper />);

    expect(screen.getByText(/supports .vtt, .srt, and .txt/i)).toBeInTheDocument();
  });

  it('hides supported formats hint when textarea has content', () => {
    render(<NotesInputWrapper initialNotes="Some notes" />);

    expect(screen.queryByText(/supports .vtt, .srt, and .txt/i)).not.toBeInTheDocument();
  });

  it('upload button is disabled when loading', () => {
    render(<NotesInputWrapper isLoading={true} />);

    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    expect(uploadButton).toBeDisabled();
  });

  it('has hidden file input with correct accept attribute', () => {
    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    expect(fileInput).toHaveAttribute('accept', '.vtt,.srt,.txt');
    expect(fileInput).toHaveClass('hidden');
  });
});

describe('NotesInput file upload behavior', () => {
  const mockedParseTranscriptFile = parseTranscriptFile as jest.MockedFunction<typeof parseTranscriptFile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('populates textarea with parsed file content on successful upload', async () => {
    mockedParseTranscriptFile.mockResolvedValue({
      text: 'Parsed transcript content.',
      filename: 'meeting.vtt',
      extension: '.vtt',
      charCount: 26,
    });

    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File(['WEBVTT\n\nHello'], 'meeting.vtt', { type: 'text/vtt' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/paste your meeting notes/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Parsed transcript content.');
    });
  });

  it('shows error message on unsupported file type', async () => {
    mockedParseTranscriptFile.mockResolvedValue({
      code: 'UNSUPPORTED_TYPE',
      message: 'Unsupported file type. Please upload a .vtt, .srt, or .txt file.',
    });

    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unsupported file type/i);
    });
  });

  it('shows error message when file is too large', async () => {
    mockedParseTranscriptFile.mockResolvedValue({
      code: 'FILE_TOO_LARGE',
      message: 'File is too large (max 500 KB). Try a shorter transcript.',
    });

    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File(['x'], 'big.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/too large/i);
    });
  });

  it('shows error message for empty file', async () => {
    mockedParseTranscriptFile.mockResolvedValue({
      code: 'EMPTY_FILE',
      message: 'The file appears to be empty.',
    });

    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File([''], 'empty.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/empty/i);
    });
  });

  it('does not modify textarea on file parse error', async () => {
    mockedParseTranscriptFile.mockResolvedValue({
      code: 'UNSUPPORTED_TYPE',
      message: 'Unsupported file type. Please upload a .vtt, .srt, or .txt file.',
    });

    render(<NotesInputWrapper initialNotes="Existing notes" />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/paste your meeting notes/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Existing notes');
  });

  it('clears file error when user types in textarea', async () => {
    mockedParseTranscriptFile.mockResolvedValue({
      code: 'UNSUPPORTED_TYPE',
      message: 'Unsupported file type. Please upload a .vtt, .srt, or .txt file.',
    });

    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/paste your meeting notes/i);
    fireEvent.change(textarea, { target: { value: 'New text' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows truncation warning when file content exceeds 50,000 chars', async () => {
    const longText = 'a'.repeat(60000);
    mockedParseTranscriptFile.mockResolvedValue({
      text: longText,
      filename: 'long.txt',
      extension: '.txt',
      charCount: 60000,
    });

    render(<NotesInputWrapper />);

    const fileInput = screen.getByLabelText(/upload transcript file/i);
    const file = new File([longText], 'long.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/truncated to 50,000 characters/i);
    });
  });
});
