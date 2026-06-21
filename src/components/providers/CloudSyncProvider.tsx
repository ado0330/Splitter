"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { pullGroupsFromCloud, pushGroupToCloud } from "@/lib/sync";
import { supabase } from "@/lib/supabase";

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialLoad = useRef(true);
  const previousGroupsRef = useRef(useStore.getState().groups);
  
  // Expose an action to set groups directly for pulling
  const overwriteLocalGroups = (newGroups: any[]) => {
    previousGroupsRef.current = newGroups; // Prevent re-pushing what we just pulled
    useStore.setState({ groups: newGroups });
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      isInitialLoad.current = true;
      return;
    }

    async function initialSync() {
      setIsSyncing(true);
      try {
        const localGroups = useStore.getState().groups;
        
        // 1. Initial Migration: Push any local groups to cloud
        if (isInitialLoad.current && localGroups.length > 0) {
          console.log("Migrating local groups to cloud...");
          for (const group of localGroups) {
            await pushGroupToCloud(group, user!.id);
          }
        }
        
        // 2. Pull latest from cloud
        console.log("Pulling from cloud...");
        const cloudGroups = await pullGroupsFromCloud();
        overwriteLocalGroups(cloudGroups);
        
        isInitialLoad.current = false;
      } catch (error) {
        console.error("Initial sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    }

    initialSync();

    // 3. Set up Realtime subscriptions
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        async () => {
          const cloudGroups = await pullGroupsFromCloud();
          overwriteLocalGroups(cloudGroups);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        async () => {
          const cloudGroups = await pullGroupsFromCloud();
          overwriteLocalGroups(cloudGroups);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loading]);

  // 4. Watch for local changes and push
  useEffect(() => {
    const unsubscribe = useStore.subscribe(async (state) => {
      if (!user || isInitialLoad.current || isSyncing) return;
      
      const currentGroups = state.groups;
      const previousGroups = previousGroupsRef.current;
      
      // Find modified groups
      // This is a naive deep comparison by reference, Zustand creates new references for modified objects
      for (let i = 0; i < currentGroups.length; i++) {
        const curr = currentGroups[i];
        const prev = previousGroups.find(g => g.id === curr.id);
        
        if (curr !== prev) {
          // Push modified group
          try {
            await pushGroupToCloud(curr, user.id);
          } catch (e) {
            console.error("Failed to push group:", e);
          }
        }
      }
      
      // Handle deleted groups
      for (const prev of previousGroups) {
        if (!currentGroups.find(g => g.id === prev.id)) {
          // Delete from cloud
          try {
            await supabase.from('groups').delete().eq('id', prev.id);
          } catch (e) {
            console.error("Failed to delete group:", e);
          }
        }
      }
      
      previousGroupsRef.current = currentGroups;
    });

    return unsubscribe;
  }, [user, isSyncing]);

  return <>{children}</>;
}
