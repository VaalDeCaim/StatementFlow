"use client";

import {User, Trash2} from "lucide-react";
import {useUser} from "@/lib/auth-context";
import {useBalance} from "@/lib/queries/use-balance";
import {
  useDeleteAccountMutation,
  useRequestEmailOtpMutation,
} from "@/lib/queries/use-auth";
import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Alert,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {InputOtp} from "@heroui/input-otp";

const CODE_LENGTH = 6;

export default function SettingsPage() {
  const {user, loading} = useUser();
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
  } = useBalance();
  const deleteAccount = useDeleteAccountMutation();
  const requestOtp = useRequestEmailOtpMutation();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [otpOpen, setOtpOpen] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [otpSent, setOtpSent] = React.useState(false);
  /** OTP to send to backend when user confirms delete (verified server-side). */
  const [pendingDeleteOtp, setPendingDeleteOtp] = React.useState<string | null>(
    null,
  );

  if (loading || balanceLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Spinner size="lg" color="default" label="Loading profile…" />
      </div>
    );
  }

  if (!user || balanceError) {
    return (
      <Alert
        color="danger"
        title="Error"
        description="Failed to load profile."
        className="max-w-xl"
      />
    );
  }

  const coins = balanceData?.coins ?? 0;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-default-600">Your account details.</p>
      </div>

      <Card className="border border-default-200">
        <CardHeader className="flex items-center gap-2">
          <User className="h-4 w-4 text-default-500" />
          <span className="text-sm font-semibold uppercase tracking-wider text-default-500">
            Profile
          </span>
        </CardHeader>
        <CardBody className="pt-0">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-default-500">Name</dt>
              <dd className="font-medium text-foreground">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-default-500">Email</dt>
              <dd className="font-medium text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-default-500">Balance</dt>
              <dd className="font-medium text-foreground">{coins} coins</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card className="border border-danger-200 bg-danger-50/40">
        <CardHeader className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-danger-500" />
            <span className="text-sm font-semibold uppercase tracking-wider text-danger-600">
              Danger zone
            </span>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          <p className="text-xs text-default-600">
            Deleting your account will permanently remove your profile,
            conversion history, uploaded files, and remaining balance ({coins}{" "}
            coins). This action cannot be undone.
          </p>
          <Button
            color="danger"
            variant="flat"
            className="self-start"
            startContent={<Trash2 className="h-4 w-4" />}
            onPress={() => {
              setOtpSent(false);
              setOtpCode("");
              setOtpError(null);
              setOtpOpen(true);
            }}
          >
            Delete account
          </Button>
        </CardBody>
      </Card>

      {/* Step 1: Email OTP verification */}
      <Modal
        isOpen={otpOpen}
        onOpenChange={(open) => {
          if (!open && !deleteAccount.isPending) {
            setOtpOpen(false);
            setOtpSent(false);
            setOtpCode("");
            setOtpError(null);
            requestOtp.reset();
          }
        }}
        hideCloseButton
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Verify your email
          </ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-sm text-default-600">
              To continue with account deletion, we&apos;ll send a 6-digit code
              to{" "}
              <span className="font-medium text-foreground">{user?.email}</span>
              . Enter it below.
            </p>
            {!otpSent ? (
              <div className="flex justify-end gap-2 pb-2">
                <Button
                  variant="flat"
                  onPress={() => {
                    setOtpOpen(false);
                    setOtpError(null);
                    requestOtp.reset();
                  }}
                  isDisabled={requestOtp.isPending}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    if (!user?.email) return;
                    setOtpError(null);
                    requestOtp.mutate(user.email, {
                      onSuccess: () => setOtpSent(true),
                      onError: (err) =>
                        setOtpError(err.message ?? "Failed to send code"),
                    });
                  }}
                  isLoading={requestOtp.isPending}
                  isDisabled={requestOtp.isPending}
                >
                  Send code
                </Button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (otpCode.length !== CODE_LENGTH) return;
                  setOtpError(null);
                  setPendingDeleteOtp(otpCode);
                  setOtpOpen(false);
                  setOtpSent(false);
                  setOtpCode("");
                  setDeleteOpen(true);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <label className="text-xs font-medium text-default-700">
                    Verification code
                  </label>
                  <InputOtp
                    length={CODE_LENGTH}
                    value={otpCode}
                    onValueChange={(value) => {
                      setOtpCode(value);
                      setOtpError(null);
                    }}
                    autoFocus
                    autoComplete="one-time-code"
                    isInvalid={!!otpError}
                  />
                  {otpError && (
                    <p className="text-xs text-danger" role="alert">
                      {otpError}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="flat"
                    onPress={() => {
                      setOtpOpen(false);
                      setOtpSent(false);
                      setOtpCode("");
                      setOtpError(null);
                      setPendingDeleteOtp(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="bordered"
                      onPress={() => {
                        if (!user?.email) return;
                        setOtpError(null);
                        setOtpCode("");
                        requestOtp.mutate(user.email, {
                          onSuccess: () => {},
                          onError: (err) =>
                            setOtpError(err.message ?? "Failed to resend code"),
                        });
                      }}
                      isLoading={requestOtp.isPending}
                      isDisabled={requestOtp.isPending}
                    >
                      Resend code
                    </Button>
                    <Button
                      type="submit"
                      color="primary"
                      isDisabled={otpCode.length !== CODE_LENGTH}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Step 2: Confirm account deletion */}
      <Modal
        isOpen={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleteAccount.isPending) {
            setDeleteOpen(false);
            setPendingDeleteOtp(null);
            deleteAccount.reset();
          }
        }}
        hideCloseButton
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirm account deletion
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              This will permanently delete your StatementFlow account, including
              your profile, all conversion jobs and exports, and your remaining
              balance of <span className="font-semibold">{coins} coins</span>.
              This action cannot be undone.
            </p>
            <p className="text-xs text-default-500">
              If you&apos;re sure, click &quot;Delete account&quot; below. You
              will be signed out and your data will be removed from our systems.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setDeleteOpen(false);
                setPendingDeleteOtp(null);
                deleteAccount.reset();
              }}
              isDisabled={deleteAccount.isPending}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => {
                if (pendingDeleteOtp) {
                  deleteAccount.mutate(pendingDeleteOtp, {
                    onError: () => {
                      setPendingDeleteOtp(null);
                      setDeleteOpen(false);
                      setOtpSent(true);
                      setOtpCode("");
                      setOtpOpen(true);
                      setOtpError(
                        "Invalid or expired code. Request a new code and try again.",
                      );
                    },
                  });
                }
              }}
              isLoading={deleteAccount.isPending}
              isDisabled={deleteAccount.isPending || !pendingDeleteOtp}
            >
              Delete account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
