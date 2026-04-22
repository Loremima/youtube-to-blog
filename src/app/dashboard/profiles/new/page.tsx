import ProfileForm from "@/components/ProfileForm";

export default function NewProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New style profile</h1>
      <ProfileForm mode="create" />
    </div>
  );
}
