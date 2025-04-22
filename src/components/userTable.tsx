"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "./dataTable";
import { columns } from "./columns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "@/components/editUserDialog";

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = () => {
      const memberCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("isMember="));

      if (memberCookie) {
        try {
          const cookieValue = memberCookie.split("=")[1];
          const decodedCookie = decodeURIComponent(cookieValue);
          const memberData = JSON.parse(decodedCookie);
          setIsAdmin(!!memberData);
        } catch (error) {
          console.error("Failed to parse session cookie:", error);
          setIsAdmin(false);
        }
      } else {
        console.warn("Session cookie not found.");
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users/get-users");
        if (!response.ok) throw new Error("Failed to load users.");
        const data = await response.json();
        console.log(data.users);
        setUsers(data.users);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (userData: {
    cn: string;
    sAMAccountName: string;
    groups: string[];
    userPrincipalName: string;
  }) => {
    try {
      const response = await fetch("/api/users/edit-user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...userData,
          userPrincipalName: userToEdit?.userPrincipalName || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Failed to edit user",
          description: errorData.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "User edited successfully",
      });
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.sAMAccountName === userData.sAMAccountName
            ? { ...u, ...userData }
            : u
        )
      );
    } catch (error) {
      console.error("Error editing user:", error);
      toast({
        title: "Error editing user",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleDeleteUser = (event: CustomEvent<User>) => {
      setUserToDelete(event.detail);
      setIsDeleteDialogOpen(true);
    };

    window.addEventListener("deleteUser", handleDeleteUser as EventListener);

    return () => {
      window.removeEventListener(
        "deleteUser",
        handleDeleteUser as EventListener
      );
    };
  }, []);

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/users/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.sAMAccountName }),
      });

      if (!response.ok) throw new Error("Failed to delete user.");

      setUsers((prevUsers) =>
        prevUsers.filter(
          (u) => u.sAMAccountName !== userToDelete.sAMAccountName
        )
      );
      toast({
        title: "User deleted",
        description: `${userToDelete.cn} has been successfully deleted.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete user.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center mx-auto">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!users.length) {
    return <div className="text-center">No users found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns(isAdmin, handleEditUser)}
        data={users}
        isAdmin={isAdmin}
      />
      <EditUserDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        user={userToEdit}
        onSubmit={handleEditSubmit}
      />
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.cn}? This action is
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
