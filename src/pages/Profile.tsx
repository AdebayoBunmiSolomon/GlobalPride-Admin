import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation } from "react-router-dom";
import { Pencil, ShieldCheck } from "lucide-react";

import { WebAppAvatar } from "@/components/Avatar";
import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { mockAdmin } from "@/data/mock";
import { profileSchema, type ProfileValues } from "@/schemas/account";

export const Profile = () => {
  const location = useLocation();
  // Account Settings links here with `{ edit: true }` to open the form directly.
  const [editing, setEditing] = useState(Boolean(location.state?.edit));
  const [profile, setProfile] = useState(mockAdmin);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: { name: profile.name, email: profile.email },
  });

  const startEditing = () => {
    reset({ name: profile.name, email: profile.email });
    setEditing(true);
  };

  // TODO: send to the API once the profile endpoint is available.
  const onSubmit = async (values: ProfileValues) => {
    setProfile({ ...profile, ...values });
    setEditing(false);
  };

  return (
    <div className="max-w-3xl">
      <WebAppPageHeader
        title="Profile"
        description="View and manage your administrator profile information."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Profile" }]}
      />

      <WebAppCard
        divided
        title="Profile Information"
        description="Your administrator details as shown across the Admin Console."
      >
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <WebAppAvatar name={profile.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <WebAppBadge
              variant="primary"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              className="mt-2"
            >
              {profile.role}
            </WebAppBadge>
          </div>
        </div>

        {editing ? (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <WebAppInput
              id="fullName"
              label="Full Name"
              required
              error={errors.name?.message}
              {...register("name")}
            />
            <WebAppInput
              id="email"
              type="email"
              label="Email"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <WebAppInput
              id="role"
              label="Role"
              value={profile.role}
              disabled
              helperText="The administrator role cannot be changed from this page."
            />

            <div className="flex justify-end gap-3 pt-2">
              <WebAppButton variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </WebAppButton>
              <WebAppButton type="submit" disabled={isSubmitting}>
                Save Changes
              </WebAppButton>
            </div>
          </form>
        ) : (
          <>
            <WebAppDetailList
              className="mt-2"
              items={[
                { label: "Full Name", value: profile.name },
                { label: "Email", value: profile.email },
                { label: "Role", value: profile.role },
              ]}
            />
            <WebAppButton
              className="mt-4"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={startEditing}
            >
              Edit Profile
            </WebAppButton>
          </>
        )}
      </WebAppCard>
    </div>
  );
};
