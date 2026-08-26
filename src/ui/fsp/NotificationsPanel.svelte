<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import {
    getAllNotificationTypes,
    getNotificationsByRecords,
    markNotificationAsRead,
  } from "../../api";
  import type { Notification, NotificationsResult } from "../../types/fsp";

  let {
    userId,
    open,
    onclose,
    onunread,
  }: {
    userId: string;
    open: boolean;
    onclose: () => void;
    onunread?: (count: number) => void;
  } = $props();

  let loading = $state(false);
  let result = $state<NotificationsResult | null>(null);
  let error = $state(false);
  let typeCodes = $state<Map<string, string>>(new Map());

  let loadedOnce = false;

  async function load() {
    if (loading) return;
    loading = true;
    error = false;
    try {
      const [res, types] = await Promise.all([
        getNotificationsByRecords(userId, 30),
        typeCodes.size === 0
          ? getAllNotificationTypes()
          : Promise.resolve(null),
      ]);
      result = res;
      if (types) {
        typeCodes = new Map(
          types.map((t) => [t.notificationTypeId, t.code]),
        );
      }
      onunread?.(res.numberOfUnreadNotifications);
      loadedOnce = true;
    } catch {
      if (!loadedOnce) {
        error = true;
      }
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void userId;
    void load();
  });

  $effect(() => {
    if (open && loadedOnce) {
      void load();
    }
  });

  function typeCode(n: Notification): string {
    return typeCodes.get(n.notificationTypeId) ?? "";
  }

  const marking = new Set<string>();

  async function markRead(n: Notification) {
    if (n.isRead || marking.has(n.notificationId)) return;
    marking.add(n.notificationId);
    n.isRead = true;
    try {
      await markNotificationAsRead(n.notificationId);
      if (result) {
        result.numberOfUnreadNotifications = Math.max(
          0,
          result.numberOfUnreadNotifications - 1,
        );
        onunread?.(result.numberOfUnreadNotifications);
      }
    } catch {
      n.isRead = false;
    } finally {
      marking.delete(n.notificationId);
    }
  }

  function relTime(iso: string): string {
    const then = new Date(iso).getTime();
    const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }
</script>

{#if open}
  <div
    class="notif-backdrop"
    role="presentation"
    onclick={onclose}
    onkeydown={(e) => { if (e.key === "Escape") onclose(); }}
  >
    <div
      class="notif-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="notif-header">
        <span class="notif-title">Notifications</span>
        {#if result}
          <span class="notif-unread">{result.numberOfUnreadNotifications} unread</span>
        {/if}
        <button
          type="button"
          class="notif-close"
          aria-label="Close"
          onclick={onclose}
        >
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
        </button>
      </div>

      <div class="notif-list">
        {#if loading && !result}
          <p class="notif-status">Loading…</p>
        {:else if error}
          <p class="notif-status">Failed to load notifications</p>
        {:else if result && result.notifications.length === 0}
          <p class="notif-status">No notifications</p>
        {:else if result}
          {#each result.notifications as n (n.notificationId)}
            <button
              type="button"
              class="notif-item"
              class:unread={!n.isRead}
              class:clickable={!n.isRead}
              disabled={n.isRead}
              aria-label={n.isRead ? n.title : `Mark as read: ${n.title}`}
              onclick={() => markRead(n)}
            >
              <div class="notif-item-top">
                {#if typeCode(n)}
                  <span class="notif-type">{typeCode(n)}</span>
                {/if}
                <span class="notif-time">{relTime(n.createdDate)}</span>
                {#if !n.isRead}
                  <span class="notif-dot" aria-hidden="true"></span>
                {/if}
              </div>
              <p class="notif-item-title">{n.title}</p>
              <p class="notif-item-content">{n.content}</p>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
