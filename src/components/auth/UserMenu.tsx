import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User as UserIcon, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UserMenu() {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSending(true);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (error) {
      console.error(error);
      alert("Failed to send login link.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />;
  }

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger 
          render={
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full h-8 px-3 text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            />
          }
        >
          Sign In
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl text-center">Sign In</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button 
              onClick={signInWithGoogle} 
              variant="outline"
              className="w-full h-12 rounded-xl text-base font-medium shadow-sm bg-white dark:bg-zinc-900"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500 font-bold">Or continue with email</span>
              </div>
            </div>

            {sent ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium text-center">
                Check your email for the login link!
              </div>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none text-base"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isSending || !email}
                  className="w-full h-12 rounded-xl text-base shadow-none font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isSending ? "Sending..." : "Send Magic Link"}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        <UserIcon className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-100 dark:border-zinc-800 p-2">
        <div className="flex flex-col space-y-1 px-2 py-1.5">
          <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">Account</p>
          <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
            {user.email || 'Signed in'}
          </p>
        </div>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
        <DropdownMenuItem 
          onClick={signOut}
          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-300 rounded-lg cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
