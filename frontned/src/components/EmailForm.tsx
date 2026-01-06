import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus, Users, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getEmails, addEmail } from "./api";


const MAX_EMAILS = 3;

interface EmailData {
  _id: string;
  email: string;
  createdAt: string;
}

const EmailForm = () => {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState("");
  const queryClient = useQueryClient();

  // Fetch emails from backend
  const { data: emails = [], isLoading: isLoadingEmails } = useQuery({
    queryKey: ["emails"],
    queryFn: getEmails,
  });

  // Add email mutation
  const addEmailMutation = useMutation({
    mutationFn: addEmail,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      setInputValue("");
      setValidationError("");
      toast.success("Email added successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to add email";
      setValidationError(msg);
      toast.error(msg);
    },
  });

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const trimmedEmail = inputValue.trim().toLowerCase();

    if (!trimmedEmail) {
      setValidationError("Please enter an email address");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    // Check duplicate locally for immediate feedback (optional, backend also checks)
    if (emails.some((e: EmailData) => e.email === trimmedEmail)) {
      setValidationError("This email has already been added");
      return;
    }

    if (emails.length >= MAX_EMAILS) {
      setValidationError(`Maximum of ${MAX_EMAILS} emails allowed`);
      return;
    }

    addEmailMutation.mutate(trimmedEmail);
  };

  const isMaxReached = emails.length >= MAX_EMAILS;
  const isSubmitting = addEmailMutation.isPending;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-in zoom-in duration-500">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Email Collection
        </h1>
        <p className="text-muted-foreground">
          Add up to {MAX_EMAILS} email addresses
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setValidationError("");
            }}
            disabled={isMaxReached || isSubmitting || isLoadingEmails}
            className="flex-1"
          />
          <Button type="submit" disabled={isMaxReached || isSubmitting || isLoadingEmails}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            Add
          </Button>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-destructive text-sm animate-in slide-in-from-top-1 duration-300">
            <AlertCircle className="w-4 h-4" />
            {validationError}
          </div>
        )}

        {isMaxReached && !validationError && (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg animate-in fade-in duration-500">
            <AlertCircle className="w-4 h-4" />
            Maximum limit of {MAX_EMAILS} emails reached
          </div>
        )}
      </form>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {isLoadingEmails ? "Loading..." : `${emails.length} of ${MAX_EMAILS} emails added`}
          </span>
        </div>

        {isLoadingEmails ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : emails.length > 0 ? (
          <ul className="space-y-2">
            {emails.map((emailObj: EmailData, index: number) => (
              <li
                key={emailObj._id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <span className="text-foreground">{emailObj.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            No emails added yet
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailForm;
