import { InvitationExperience } from "@/components/invitation/InvitationExperience";
import { isConfigured } from "@/lib/server/env";
export default function Home() { return <InvitationExperience demo={!isConfigured()} />; }
