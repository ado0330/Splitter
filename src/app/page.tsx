"use client";

import { useStore } from "@/store/useStore";
import { GroupHome } from "@/components/group/GroupHome";
import { ExpenseDashboard } from "@/components/expenses/ExpenseDashboard";
import { useEffect, useState } from "react";

export default function Home() {
  const activeGroupId = useStore((state) => state.activeGroupId);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="max-w-md mx-auto min-h-[100dvh] bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 flex flex-col relative overflow-hidden transition-colors">
      {activeGroupId ? <ExpenseDashboard /> : <GroupHome />}
    </main>
  );
}
