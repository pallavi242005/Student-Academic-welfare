import { Assignment } from '../types';

/**
 * Syncs a single assignment to Google Calendar.
 * If the assignment already has a googleEventId, it will update the existing event.
 * Otherwise, it will create a new event.
 * Returns the googleEventId of the event.
 */
export async function syncAssignmentToCalendar(
  assignment: Assignment,
  accessToken: string
): Promise<string> {
  const isUpdate = !!assignment.googleEventId;
  const url = isUpdate
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${assignment.googleEventId}`
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const method = isUpdate ? 'PUT' : 'POST';

  const time = assignment.dueTime || '12:00';
  // Construct ISO datetime in local time format (without Z offset) so Google Calendar places it in user's calendar local time
  const startDateTime = `${assignment.dueDate}T${time}:00`;
  // Set end time to 30 minutes after start time
  const [hours, minutes] = time.split(':').map(Number);
  const endHours = (hours + (minutes + 30 >= 60 ? 1 : 0)) % 24;
  const endMinutes = (minutes + 30) % 60;
  const formattedEndHours = String(endHours).padStart(2, '0');
  const formattedEndMinutes = String(endMinutes).padStart(2, '0');
  const endDateTime = `${assignment.dueDate}T${formattedEndHours}:${formattedEndMinutes}:00`;

  const eventPayload = {
    summary: `📚 [Due: ${assignment.priority.toUpperCase()}] ${assignment.title}`,
    description: `Subject: ${assignment.subject}\nPriority: ${assignment.priority}\nStatus: ${assignment.completed ? 'Completed' : 'Pending'}\nNotes: ${assignment.notes || 'None'}`,
    start: {
      dateTime: startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    end: {
      dateTime: endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },   // 1 hour before
      ],
    },
  };

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Calendar API Error:', errorText);
    throw new Error(`Failed to sync calendar: ${response.statusText} (${response.status})`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Deletes a synced event from Google Calendar.
 */
export async function deleteAssignmentFromCalendar(
  eventId: string,
  accessToken: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    console.error('Google Calendar Delete Error:', errorText);
    throw new Error(`Failed to delete event: ${response.statusText}`);
  }
}
