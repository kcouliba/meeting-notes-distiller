import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionBar } from '@/components/ActionBar';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('ActionBar', () => {
  const defaultProps = {
    formattedOutput: '# Meeting Report\n\nSome content here',
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders copy and download buttons', () => {
    render(<ActionBar {...defaultProps} />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('copies text to clipboard', async () => {
    render(<ActionBar {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.formattedOutput);
    });
  });

  it('shows confirmation state after copying', async () => {
    render(<ActionBar {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  it('disables buttons when disabled prop is true', () => {
    render(<ActionBar formattedOutput="some text" disabled={true} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    const downloadButton = screen.getByRole('button', { name: /download/i });

    expect(copyButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
  });
});
