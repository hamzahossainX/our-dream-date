import type { InvitationConfig } from "./contracts";

export const DEFAULT_CONFIG: InvitationConfig = {
  version: 1, recipientName: "my love", senderName: "Fahim", timezone: "Asia/Dhaka",
  title: "A little invitation,\njust for you.",
  subtitle: "My favourite place is anywhere with you.",
  openingNote: "Life gets busy. But you and me? We deserve a little time that's only ours. I've been planning something, and there's just one thing I need to know…",
  closingMessage: "I'll take care of the little details. You just bring that smile I fell in love with.",
  minDate: null, maxDate: null, accent: "rose", messageMaxLength: 1000,
  timeSlots: [
    { id: "afternoon", label: "A slow afternoon", time: "15:00" },
    { id: "sunset", label: "Around sunset", time: "17:30" },
    { id: "evening", label: "An evening together", time: "19:00" },
  ],
  questions: [{
    id: "activities", label: "What sounds like us?", description: "Pick a little adventure. Or a few — there's no hurry.",
    selectionMode: "multiple", required: true, minSelections: 1, maxSelections: 4, appliesTo: "yes",
    options: [
      { id: "dinner", label: "Dinner for two", emoji: "🍝", description: "Good food. Even better company." },
      { id: "coffee", label: "Coffee & conversations", emoji: "☕", description: "The kind that go on for hours." },
      { id: "movie", label: "Movie night", emoji: "🎬", description: "Your pick. I'll bring the snacks." },
      { id: "walk", label: "A sunset stroll", emoji: "🌷", description: "Nowhere to rush. A hand to hold." },
    ],
  }],
};
