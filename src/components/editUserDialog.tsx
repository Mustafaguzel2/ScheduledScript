import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types/user";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (userData: {
    cn: string;
    sAMAccountName: string;
    groups: string[];
    userPrincipalName: string;
  }) => void;
}

export function EditUserDialog({
  isOpen,
  onClose,
  user,
  onSubmit,
}: EditUserDialogProps) {
  const [cn, setCn] = useState("");
  const [sAMAccountName, setSAMAccountName] = useState("");
  const [groups, setGroups] = useState("");
  const [userPrincipalName, setUserPrincipalName] = useState("");

  useEffect(() => {
    if (user) {
      setCn(user.cn);
      setSAMAccountName(user.sAMAccountName);
      setUserPrincipalName(user.userPrincipalName);
      setGroups(user.groups.join(", "));
    }
  }, [user]);

  const handleSubmit = () => {
    if (!cn || !sAMAccountName) {
      toast({
        title: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      cn,
      sAMAccountName,
      groups: groups.split(",").map((group) => group.trim()),
      userPrincipalName,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Edit User</DialogTitle>
        <div className="space-y-4">
          <Input
            placeholder="First Name"
            value={cn}
            onChange={(e) => setCn(e.target.value)}
            required
          />
          <Input
            placeholder="Username"
            value={sAMAccountName}
            onChange={(e) => setSAMAccountName(e.target.value)}
            required
          />
          <div className="flex flex-row gap-2">
            <Input
              placeholder="User Principal Name"
              value={userPrincipalName}
              readOnly
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  User Principal Name is automatically generated. Cannot be
                  changed.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            placeholder="Groups (comma separated)"
            value={groups}
            onChange={(e) => setGroups(e.target.value)}
          />
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
