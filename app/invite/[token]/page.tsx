import { InvitationExperience } from "@/components/invitation/InvitationExperience";

export default async function PersonalInvitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InvitationExperience token={token} />;
}
