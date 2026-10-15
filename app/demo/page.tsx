import { InvitationExperience } from "@/components/invitation/InvitationExperience";

export default async function DemoInvitation({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams;
  return <InvitationExperience key={params.preview === "1" ? "preview" : "invitation"} demo preview={params.preview === "1"} />;
}
