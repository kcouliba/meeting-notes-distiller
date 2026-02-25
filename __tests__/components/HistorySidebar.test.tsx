import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { HistorySidebar } from '@/components/HistorySidebar';
import type { MeetingListItem } from '@/types/meeting';

const sampleMeetings: MeetingListItem[] = [
  {
    id: 'meet-1',
    title: 'Q2 roadmap discussion',
    createdAt: '2026-02-24T10:30:00.000Z',
    participantCount: 4,
    actionCount: 3,
  },
  {
    id: 'meet-2',
    title: 'Sprint retrospective',
    createdAt: '2026-02-23T14:00:00.000Z',
    participantCount: 3,
    actionCount: 2,
  },
  {
    id: 'meet-3',
    title: 'Design review session',
    createdAt: '2026-02-22T09:00:00.000Z',
    participantCount: 5,
    actionCount: 4,
  },
];

describe('HistorySidebar', () => {
  const defaultProps = {
    meetings: sampleMeetings,
    activeMeetingId: null as string | null,
    isLoading: false,
    onSelect: jest.fn(),
    onDelete: jest.fn(),
    onNewMeeting: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders as a nav with correct aria-label', () => {
    render(<HistorySidebar {...defaultProps} />);

    const nav = screen.getByRole('navigation', { name: /meeting history/i });
    expect(nav).toBeInTheDocument();
  });

  it('renders "History" header', () => {
    render(<HistorySidebar {...defaultProps} />);

    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders "New" button', () => {
    render(<HistorySidebar {...defaultProps} />);

    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
  });

  it('calls onNewMeeting when New button is clicked', () => {
    const onNewMeeting = jest.fn();
    render(<HistorySidebar {...defaultProps} onNewMeeting={onNewMeeting} />);

    fireEvent.click(screen.getByRole('button', { name: /new/i }));

    expect(onNewMeeting).toHaveBeenCalledTimes(1);
  });

  it('renders all meeting items', () => {
    render(<HistorySidebar {...defaultProps} />);

    expect(screen.getByText('Q2 roadmap discussion')).toBeInTheDocument();
    expect(screen.getByText('Sprint retrospective')).toBeInTheDocument();
    expect(screen.getByText('Design review session')).toBeInTheDocument();
  });

  it('shows empty state when no meetings', () => {
    render(<HistorySidebar {...defaultProps} meetings={[]} />);

    expect(
      screen.getByText(/no meetings yet/i)
    ).toBeInTheDocument();
  });

  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(
      <HistorySidebar {...defaultProps} meetings={[]} isLoading={true} />
    );

    // Should not show meeting items or empty state
    expect(screen.queryByText(/no meetings yet/i)).not.toBeInTheDocument();
    // Should render skeleton elements (Skeleton uses animate-pulse class)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not show empty state when loading', () => {
    render(<HistorySidebar {...defaultProps} meetings={[]} isLoading={true} />);

    expect(screen.queryByText(/no meetings yet/i)).not.toBeInTheDocument();
  });

  it('calls onSelect with meeting ID when item is clicked', () => {
    const onSelect = jest.fn();
    render(<HistorySidebar {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Q2 roadmap discussion'));

    expect(onSelect).toHaveBeenCalledWith('meet-1');
  });

  it('highlights active meeting', () => {
    render(
      <HistorySidebar {...defaultProps} activeMeetingId="meet-2" />
    );

    // The active item's button should have aria-current="true"
    const buttons = screen.getAllByRole('button');
    const activeButton = buttons.find(
      (btn) => btn.getAttribute('aria-current') === 'true'
    );
    expect(activeButton).toBeDefined();
    expect(activeButton).toHaveTextContent('Sprint retrospective');
  });

  it('does not highlight any item when activeMeetingId is null', () => {
    render(<HistorySidebar {...defaultProps} activeMeetingId={null} />);

    const buttons = screen.getAllByRole('button');
    const activeButtons = buttons.filter(
      (btn) => btn.getAttribute('aria-current') === 'true'
    );
    expect(activeButtons).toHaveLength(0);
  });

  it('calls onDelete with meeting ID when delete is confirmed', () => {
    const onDelete = jest.fn();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HistorySidebar {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', {
      name: 'Delete meeting: Q2 roadmap discussion',
    });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('meet-1');
  });
});
