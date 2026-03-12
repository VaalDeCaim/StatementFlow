"use client";

import { User, Trash2 } from "lucide-react";
import { useUser } from "@/lib/auth-context";
import { useBalance } from "@/lib/queries/use-balance";
import { useDeleteAccountMutation } from "@/lib/queries/use-auth";
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

export default function SettingsPage() {
  const { user, loading } = useUser();
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useBalance();
  const deleteAccount = useDeleteAccountMutation();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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
        <p className="mt-1 text-sm text-default-600">
          Your account details.
        </p>
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
            Deleting your account will permanently remove your profile, conversion
            history, uploaded files, and remaining balance ({coins} coins). This
            action cannot be undone.
          </p>
          <Button
            color="danger"
            variant="flat"
            className="self-start"
            startContent={<Trash2 className="h-4 w-4" />}
            onPress={() => setDeleteOpen(true)}
          >
            Delete account
          </Button>
        </CardBody>
      </Card>

      <Modal
        isOpen={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleteAccount.isLoading) {
            setDeleteOpen(false);
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
              This will permanently delete your StatementFlow account, including your
              profile, all conversion jobs and exports, and your remaining balance of{" "}
              <span className="font-semibold">{coins} coins</span>. This action cannot be
              undone.
            </p>
            <p className="text-xs text-default-500">
              If you&apos;re sure, click &quot;Delete account&quot; below. You will be
              signed out and your data will be removed from our systems.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setDeleteOpen(false);
                deleteAccount.reset();
              }}
              isDisabled={deleteAccount.isLoading}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => deleteAccount.mutate()}
              isLoading={deleteAccount.isLoading}
            >
              Delete account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
