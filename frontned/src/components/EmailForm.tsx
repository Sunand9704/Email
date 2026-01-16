import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus, Users, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getEmails, addEmail } from "./api";




interface EmailData {
  _id: string;
  email: string;
  createdAt: string;
}

const EmailForm = () => {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState("");
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading: isLoadingEmails } = useQuery({
    queryKey: ["emails"],
    queryFn: getEmails,
  });

  const addEmailMutation = useMutation({
    mutationFn: addEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      setInputValue("");
      setValidationError("");
      toast.success("Email tracking started!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to add email";
      setValidationError(msg);
      toast.error(msg);
    },
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const trimmedEmail = inputValue.trim().toLowerCase();

    if (!trimmedEmail) return setValidationError("Email is required");
    if (!validateEmail(trimmedEmail)) return setValidationError("Invalid email address");
    if (emails.some((e: EmailData) => e.email === trimmedEmail)) return setValidationError("Email already being tracked");

    addEmailMutation.mutate(trimmedEmail);
  };

  const isSubmitting = addEmailMutation.isPending;

  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="relative inline-flex mb-2">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
            <Mail className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Email Alerts
          </h1>
          <p className="text-muted-foreground font-medium">
            Automated notifications, delivered precisely.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Input
              type="email"
              placeholder="name@example.com"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setValidationError("");
              }}
              disabled={isSubmitting || isLoadingEmails}
              className="h-12 px-4 rounded-xl border-2 border-primary/10 bg-white/50 dark:bg-black/20 focus:border-primary/50 focus:ring-0 transition-all duration-300 placeholder:text-muted-foreground/50"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingEmails}
            className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95 whitespace-nowrap"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-destructive text-sm font-semibold px-2 animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4" />
            {validationError}
          </div>
        )}
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 lowercase tracking-wider">
            <Users className="w-4 h-4 text-primary" />
            <span>Active Subscriptions</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
            {emails.length} Total
          </span>
        </div>

        {isLoadingEmails ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Fetching your emails...</p>
          </div>
        ) : emails.length > 0 ? (
          <div className="grid gap-3">
            {emails.map((emailObj: EmailData, index: number) => {
              const createdDate = new Date(emailObj.createdAt);
              const targetDate = new Date(createdDate);
              targetDate.setDate(targetDate.getDate() + 30);

              const now = new Date();
              const diffTime = targetDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isExpired = diffDays <= 0;

              return (
                <div
                  key={emailObj._id}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:border-primary/30 hover:shadow-xl transition-all duration-500 animate-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/5 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-foreground truncate">{emailObj.email}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                        {isExpired ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Alert Delivered</span>
                        ) : (
                          <>Alert in <span className="text-amber-600 dark:text-amber-400 font-black">{diffDays}d</span> • {targetDate.toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isExpired && (
                    <div className="hidden sm:block text-[10px] font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-3xl border-2 border-dashed border-primary/10 bg-primary/5 animate-in zoom-in duration-700">
            <div className="p-4 rounded-full bg-white/50 backdrop-blur-lg">
              <Mail className="w-8 h-8 text-primary/40" />
            </div>
            <div className="max-w-[200px]">
              <p className="text-sm font-bold text-foreground">List is empty</p>
              <p className="text-xs text-muted-foreground">Start by adding an email above to track its status.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailForm;
