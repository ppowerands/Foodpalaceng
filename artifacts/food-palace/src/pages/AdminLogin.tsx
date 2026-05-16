import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          authLogin(data.token, data.user);
          toast({ title: "Admin access granted" });
          setLocation("/admin/dashboard");
        },
        onError: (error: any) => {
          toast({ 
            title: "Access denied", 
            description: error?.message || "Invalid admin credentials",
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground text-center mt-2">Restricted access area</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@foodpalace.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Authenticating..." : "Login to Dashboard"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
