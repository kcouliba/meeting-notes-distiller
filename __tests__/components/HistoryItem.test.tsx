import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryItem } from '@/components/HistoryItem';
import type { MeetingListItem } from '@/types/meeting';

const sampleMeeting: MeetingListItem = {
  id: 'meet-1',
  title: 'Discussed Q2 roadmap priorities',
  createdAt: new Date().toISOString(), // today
  participantCount: 4,
  actionCount: 3,
};

describe('HistoryItem', () => {
  const defaultProps = {
    meeting: sampleMeeting,
    isActive: false,
    onSelect: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meeting title', () => {
    render(<HistoryItem {...defaultProps} />);

    expect(screen.getByText('Discussed Q2 roadmap priorities')).toBeInTheDocument();
  });

  it('renders participant count', () => {
    render(<HistoryItem {...defaultProps} />);

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders action count', () => {
    render(<HistoryItem {...defaultProps} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows "Today" for meetings created today', () => {
    render(<HistoryItem {...defaultProps} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows "Yesterday" for meetings created yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const meeting = { ...sampleMeeting, createdAt: yesterday.toISOString() };

    render(<HistoryItem {...defaultProps} meeting={meeting} />);

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('shows formatted date for older meetings', () => {
    const meeting = { ...sampleMeeting, createdAt: '2026-01-15T10:00:00.000Z' };

    render(<HistoryItem {...defaultProps} meeting={meeting} />);

    expect(screen.getByText('Jan 15')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<HistoryItem {...defaultProps} onSelect={onSelect} />);

    // Click the title text — it's inside the outer button
    fireEvent.click(screen.getByText('Discussed Q2 roadmap priorities'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('sets aria-current="true" when active', () => {
    render(<HistoryItem {...defaultProps} isActive={true} />);

    const title = screen.getByText('Discussed Q2 roadmap priorities');
    const outerItem = title.closest('[aria-current]');
    expect(outerItem).toHaveAttribute('aria-current', 'true');
  });

  it('does not set aria-current when inactive', () => {
    const { container } = render(<HistoryItem {...defaultProps} isActive={false} />);

    // No element should have aria-current when inactive
    const activeElements = container.querySelectorAll('[aria-current]');
    expect(activeElements).toHaveLength(0);
  });

  it('has a delete button with correct aria-label', () => {
    render(<HistoryItem {...defaultProps} />);

    const deleteButton = screen.getByRole('button', {
      name: `Delete meeting: ${sampleMeeting.title}`,
    });
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    const onDelete = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HistoryItem {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', {
      name: `Delete meeting: ${sampleMeeting.title}`,
    });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Delete this meeting report?');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not call onDelete when delete is cancelled', () => {
    const onDelete = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<HistoryItem {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', {
      name: `Delete meeting: ${sampleMeeting.title}`,
    });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('delete click does not trigger onSelect', () => {
    const onSelect = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HistoryItem {...defaultProps} onSelect={onSelect} />);

    const deleteButton = screen.getByRole('button', {
      name: `Delete meeting: ${sampleMeeting.title}`,
    });
    fireEvent.click(deleteButton);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
