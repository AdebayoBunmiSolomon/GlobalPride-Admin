import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { Info, Lock, Pencil } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppInput } from "@/components/Input";
import { WebAppModal } from "@/components/Modal";
import { WebAppPageHeader } from "@/components/PageHeader";
import { mockAdmin } from "@/data/mock";
import { useSettings } from "@/hooks/useSettings";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/account";

const emptyPasswords: ChangePasswordValues = { current: "", next: "", confirm: "" };

export const AccountSettings = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const requireStrongPasswords = useSettings((state) => state.security.requireStrongPasswords);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: yupResolver(changePasswordSchema, { context: { requireStrongPasswords } }),
    defaultValues: emptyPasswords,
  });

  const closeModal = () => {
    setModalOpen(false);
    reset(emptyPasswords);
  };

  // TODO: send to the API once the change-password endpoint is available.
  const onSubmit = async (values: ChangePasswordValues) => {
    void values;
    closeModal();
  };

  return (
    <div className="max-w-3xl space-y-4">
      <WebAppPageHeader
        title="Account Settings"
        description="Manage your administrator account preferences and security."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Account Settings" }]}
      />

      <WebAppCard
        divided
        title="Account Information"
        description="Your personal administrator account details."
      >
        <WebAppDetailList
          className="-mt-2"
          items={[
            { label: "Full Name", value: mockAdmin.name },
            { label: "Email", value: mockAdmin.email },
            { label: "Role", value: mockAdmin.role },
          ]}
        />
        <WebAppButton
          variant="outline"
          className="mt-4"
          leftIcon={<Pencil className="h-4 w-4" />}
          onClick={() => navigate("/profile", { state: { edit: true } })}
        >
          Edit Profile
        </WebAppButton>
      </WebAppCard>

      <WebAppCard
        divided
        title="Password & Security"
        description="Update the password used to sign in to the Admin Console."
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Password</p>
            <p className="text-xs text-gray-500">
              Choose a strong password you do not use anywhere else.
            </p>
          </div>
          <WebAppButton
            leftIcon={<Lock className="h-4 w-4" />}
            onClick={() => setModalOpen(true)}
          >
            Change Password
          </WebAppButton>
        </div>
      </WebAppCard>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-stone-50 px-4 py-3 text-xs text-gray-600">
        <Info className="h-4 w-4 shrink-0 text-gray-400" />
        Platform-wide Admin Console security policies are managed in Dashboard &gt; Settings &gt; Security.
      </div>

      <WebAppModal open={modalOpen} onClose={closeModal} title="Change Password">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <WebAppInput
            id="currentPassword"
            type="password"
            label="Current Password"
            autoComplete="current-password"
            required
            error={errors.current?.message}
            {...register("current")}
          />
          <WebAppInput
            id="newPassword"
            type="password"
            label="New Password"
            autoComplete="new-password"
            required
            error={errors.next?.message}
            {...register("next")}
          />
          <WebAppInput
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            autoComplete="new-password"
            required
            error={errors.confirm?.message}
            helperText={
              requireStrongPasswords
                ? "Must be at least 8 characters and include uppercase, lowercase and a number."
                : "Must be at least 8 characters."
            }
            {...register("confirm")}
          />

          <div className="flex justify-end gap-3 pt-2">
            <WebAppButton variant="outline" onClick={closeModal}>
              Cancel
            </WebAppButton>
            <WebAppButton type="submit" disabled={isSubmitting}>
              Change Password
            </WebAppButton>
          </div>
        </form>
      </WebAppModal>
    </div>
  );
};
