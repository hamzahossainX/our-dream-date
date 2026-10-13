export type Answer = "yes" | "no";
export type Accent = "rose" | "lavender" | "peach";
export interface InvitationOption { id: string; label: string; emoji: string; description?: string }
export interface InvitationQuestion {
  id: string; label: string; description?: string; selectionMode: "single" | "multiple";
  required: boolean; minSelections: number; maxSelections: number; options: InvitationOption[]; appliesTo: "yes" | "no" | "both";
}
export interface InvitationConfig {
  version: number; recipientName: string; senderName: string; title: string; subtitle: string;
  openingNote: string; closingMessage: string; timezone: string;
  minDate: string | null; maxDate: string | null;
  timeSlots: { id: string; label: string; time: string }[];
  questions: InvitationQuestion[]; accent: Accent; messageMaxLength: number;
}
export interface SubmissionInput {
  answer: Answer; chosenDate: string | null; timeSlotId: string | null;
  selections: Record<string, string[]>; message: string; configVersion: number; idempotencyKey: string;
}
export interface SavedSelection { questionId: string; questionLabel: string; options: { id: string; label: string }[] }
export interface SavedResponse {
  id: string; invitationId: string; answer: Answer; chosenDate: string | null;
  chosenTime: string | null; timezone: string; selections: SavedSelection[]; message: string;
  submittedAt: string; configVersion: number;
}
export interface InvitationPayload {
  config: InvitationConfig; configured: boolean; authorized: boolean; response: SavedResponse | null;
}
export interface AdminMetrics {
  total: number; accepted: number; declined: number;
  activities: { label: string; count: number }[];
  days: { date: string; count: number }[];
  times: { label: string; count: number }[];
}
export interface AdminResponsesPayload { responses: SavedResponse[]; total: number; page: number; pageSize: number; metrics: AdminMetrics }
