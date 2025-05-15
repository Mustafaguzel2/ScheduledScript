"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "./dataTable";
import { columns } from "./columns";
import { useToast } from "../../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "../../components/ui/alert-dialog";
import { User } from "../../types/user";
import { Button } from "../../components/ui/button";
import LoadingAnimation from "../../components/loadingAnimation";
export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
    return <LoadingAnimation />;
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
    <div className="min-h-screen min-w-full">
      <DataTable columns={columns(isAdmin)} data={users} />
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
