<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import { getUserById, getUserImage } from "../api";
  import { notify } from "../notifications";
  import ScheduleView from "./fsp/ScheduleView.svelte";
  import MarksView from "./fsp/MarksView.svelte";
  import FeedbackView from "./fsp/FeedbackView.svelte";
  import HomeworksView from "./fsp/HomeworksView.svelte";
  import NotificationsPanel from "./fsp/NotificationsPanel.svelte";
  import {
    ACCENTS,
    DARK_FLAVORS,
    FLAVOR_OPTIONS,
    applyTheme,
    theme,
  } from "../theme.svelte";
  import EventsView from "./fsp/EventsView.svelte";
  import StandingView from "./fsp/StandingView.svelte";
  import ClubsView from "./fsp/ClubsView.svelte";

  const NAV_IDS = [
    "home",
    "feedback",
    "homeworks",
    "marks",
    "clubs",
    "events",
    "standing",
  ] as const;
  type PageId = (typeof NAV_IDS)[number];

  interface NavItem {
    id: PageId;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "feedback", label: "Feedback", icon: "chat" },
    { id: "homeworks", label: "Homeworks", icon: "assignment" },
    { id: "marks", label: "Marks", icon: "done_all" },
    { id: "clubs", label: "Clubs", icon: "group" },
    { id: "events", label: "Events", icon: "event" },
    { id: "standing", label: "Standing", icon: "shield_person" },
  ];

  let { userId }: { userId: string } = $props();

  const FONT_URL =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";
  if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
  }

  let sidebarOpen = $state(
    !window.matchMedia("(max-width: 768px)").matches,
  );
  let activeNav = $state<PageId>("home");
  let name = $state("");
  let rollNumber = $state("");
  let avatar = $state<string | null>(null);
  let notifOpen = $state(false);
  let unreadCount = $state(0);
  let scheduleDate = $state("");

  interface PageRef {
    refresh(): void;
  }
  interface SchedulePageRef extends PageRef {
    goTo(delta: number): void;
    goToday(): void;
  }
  let pages: Partial<Record<PageId, PageRef>> & {
    home?: SchedulePageRef;
    feedback?: FeedbackView;
    homeworks?: HomeworksView;
    events?: EventsView;
    standing?: StandingView;
    clubs?: ClubsView;
  } = {};
  let settingsOpen = $state(false);
  let settingsBtn: HTMLButtonElement | undefined = $state();
  let settingsPop: HTMLDivElement | undefined = $state();

  $effect(() => {
    void theme.flavor;
    void theme.accent;
    applyTheme();
  });

  $effect(() => {
    if (!settingsOpen) return;
    const rootNode = settingsBtn?.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) return;
    function onKeydown(e: Event) {
      if ((e as KeyboardEvent).key === "Escape") settingsOpen = false;
    }
    function onPointerdown(e: Event) {
      if (!(e.target instanceof Node)) return;
      const pop = settingsPop;
      if (pop && pop.contains(e.target)) return;
      const btn = settingsBtn;
      if (btn && btn.contains(e.target)) return;
      settingsOpen = false;
    }
    rootNode.addEventListener("keydown", onKeydown);
    rootNode.addEventListener("pointerdown", onPointerdown);
    return () => {
      rootNode.removeEventListener("keydown", onKeydown);
      rootNode.removeEventListener("pointerdown", onPointerdown);
    };
  });

  $effect(() => {
    const id = userId;
    getUserById(id)
      .then((user) => {
        name = user.name;
        rollNumber = user.rollNumber;
      })
      .catch(() => {
        notify("Failed to load profile", "error");
      });

    getUserImage(id).then((image) => {
      if (image) avatar = image;
    });
  });

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function refresh() {
    pages[activeNav]?.refresh();
  }

  function onNotifications() {
    notifOpen = !notifOpen;
  }

  function onNav(item: NavItem) {
    if (item.id === activeNav) return;
    const enabled: PageId[] = ["home", "feedback", "homeworks", "marks", "clubs", "events", "standing"];
    if (!enabled.includes(item.id)) {
      notify(`${item.label} coming soon`, "info");
      return;
    }
    activeNav = item.id;
  }
</script>

<div class="shell">
  <header class="header">
    <div class="header-left">
      <button class="icon-btn" aria-label="Toggle menu" onclick={toggleSidebar}>
        <span class="material-symbols-rounded" aria-hidden="true">menu</span>
      </button>
      <div class="header-nav">
        {#if activeNav === "home"}
          <button class="toolbar-btn" onclick={() => pages.home?.goToday()}>
            Today
          </button>
          <button
            class="toolbar-btn toolbar-nav"
            aria-label="Previous"
            onclick={() => pages.home?.goTo(-1)}
          >
            ‹
          </button>
          <button
            class="toolbar-btn toolbar-nav"
            aria-label="Next"
            onclick={() => pages.home?.goTo(1)}
          >
            ›
          </button>
          <span class="schedule-date">{scheduleDate}</span>
        {/if}
      </div>
    </div>
    <div class="header-right">
      <div class="settings-wrap">
        <button
          class="icon-btn"
          class:active={settingsOpen}
          bind:this={settingsBtn}
          aria-label="Appearance settings"
          aria-expanded={settingsOpen}
          onclick={() => (settingsOpen = !settingsOpen)}
        >
          <span class="material-symbols-rounded" aria-hidden="true">settings</span>
        </button>
        {#if settingsOpen}
          <div class="settings-pop" bind:this={settingsPop} role="dialog" aria-label="Appearance settings">
            <p class="settings-title">Theme</p>
            <div class="settings-flavors" role="radiogroup" aria-label="Flavor">
              {#each FLAVOR_OPTIONS as option (option)}
                <button
                  class="settings-flavor"
                  class:selected={theme.flavor === option}
                  role="radio"
                  aria-checked={theme.flavor === option}
                  onclick={() => theme.setFlavor(option)}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              {/each}
            </div>
            {#if theme.flavor === "system"}
              <p class="settings-title">Dark flavor</p>
              <div
                class="settings-flavors trio"
                role="radiogroup"
                aria-label="Dark flavor"
              >
                {#each DARK_FLAVORS as dark (dark)}
                  <button
                    class="settings-flavor"
                    class:selected={theme.systemDark === dark}
                    role="radio"
                    aria-checked={theme.systemDark === dark}
                    onclick={() => theme.setSystemDark(dark)}
                  >
                    {dark[0].toUpperCase() + dark.slice(1)}
                  </button>
                {/each}
              </div>
            {/if}
            <p class="settings-title">Accent</p>
            <div class="settings-accents" role="radiogroup" aria-label="Accent color">
              {#each ACCENTS as accent (accent)}
                <button
                  class="accent-dot"
                  class:selected={theme.accent === accent}
                  style={`background: var(--${accent});`}
                  role="radio"
                  aria-checked={theme.accent === accent}
                  aria-label={accent}
                  title={accent}
                  onclick={() => theme.setAccent(accent)}
                ></button>
              {/each}
            </div>
            <hr class="settings-sep" />
            <p class="settings-title">About</p>
            <div class="about">
              <span class="about-name">fsp-quality-of-life</span>
              <span class="about-detail">
                v{__BUILD__.version} · {__BUILD__.commit}
              </span>
              <a
                class="about-link"
                href="https://github.com/thetommylong/fsp-improved/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
              >
                AGPL-3.0-only
              </a>
            </div>
          </div>
        {/if}
      </div>
      <button class="icon-btn" aria-label="Refresh" onclick={refresh}>
        <span class="material-symbols-rounded" aria-hidden="true">refresh</span>
      </button>
      <button
        class="icon-btn"
        class:has-badge={unreadCount > 0}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onclick={onNotifications}
      >
        <span class="material-symbols-rounded" aria-hidden="true">notifications</span>
        {#if unreadCount > 0}
          <span class="badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        {/if}
      </button>
    </div>
  </header>

  <div class="content">
    <div
      class="scrim"
      class:visible={sidebarOpen}
      role="presentation"
      aria-hidden={!sidebarOpen}
      onclick={toggleSidebar}
      onkeydown={(e) => { if (e.key === "Escape" && sidebarOpen) toggleSidebar(); }}
    ></div>

    <aside
      class="sidebar"
      class:collapsed={!sidebarOpen}
      aria-hidden={!sidebarOpen}
      inert={!sidebarOpen}
    >
      <div class="profile">
        {#if avatar}
          <img class="avatar" src={avatar} alt="{name || 'User'} avatar" />
        {:else}
          <div class="avatar"></div>
        {/if}
        <p class="profile-name">{name || "..."}</p>
        <p class="profile-roll">{rollNumber}</p>
      </div>

      <nav class="nav" aria-label="Main navigation">
        {#each navItems as item (item.id)}
          <button
            class="nav-item"
            class:active={activeNav === item.id}
            aria-current={activeNav === item.id ? "page" : undefined}
            onclick={() => onNav(item)}
          >
            <span class="nav-icon material-symbols-rounded" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        {/each}
      </nav>
    </aside>

<main class="main">
      {#if activeNav === "homeworks"}
        <HomeworksView studentId={userId} bind:this={pages.homeworks} />
      {:else if activeNav === "feedback"}
        <FeedbackView studentId={userId} bind:this={pages.feedback} />
      {:else if activeNav === "marks"}
        <MarksView studentId={userId} bind:this={pages.marks} />
      {:else if activeNav === "events"}
        <EventsView studentId={userId} bind:this={pages.events} />
      {:else if activeNav === "standing"}
        <StandingView studentId={userId} bind:this={pages.standing} />
      {:else if activeNav === "clubs"}
        <ClubsView studentId={userId} bind:this={pages.clubs} />
      {:else}
        <ScheduleView
          studentId={userId}
          bind:dateLabel={scheduleDate}
          bind:this={pages.home}
        />
      {/if}
    </main>
  </div>

  <NotificationsPanel
    {userId}
    open={notifOpen}
    onclose={() => (notifOpen = false)}
    onunread={(n) => (unreadCount = n)}
  />
</div>
