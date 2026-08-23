<script lang="ts">
  import { getUserById, getUserImage } from "../api";
  import { notify } from "../notifications";
  import { svgIcon } from "../svgIcon";
  import ScheduleView from "./fsp/ScheduleView.svelte";
  import MarksView from "./fsp/MarksView.svelte";
  import FeedbackView from "./fsp/FeedbackView.svelte";
  import HomeworksView from "./fsp/HomeworksView.svelte";
  import NotificationsPanel from "./fsp/NotificationsPanel.svelte";
  import menuIcon from "../assets/icons/menu.svg?raw";
  import refreshIcon from "../assets/icons/refresh.svg?raw";
  import notificationsIcon from "../assets/icons/notifications.svg?raw";
  import homeIcon from "../assets/icons/home.svg?raw";
  import chatIcon from "../assets/icons/chat.svg?raw";
  import assignmentIcon from "../assets/icons/assignment.svg?raw";
  import doneAllIcon from "../assets/icons/done_all.svg?raw";
  import demographyIcon from "../assets/icons/demography.svg?raw";
  import eventIcon from "../assets/icons/event.svg?raw";
  import personShieldIcon from "../assets/icons/person_shield.svg?raw";
  import settingsIcon from "../assets/icons/settings.svg?raw";
  import {
    ACCENTS,
    DARK_FLAVORS,
    FLAVOR_OPTIONS,
    applyTheme,
    theme,
  } from "../theme.svelte";
  import EventsView from "./fsp/EventsView.svelte";

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
    { id: "home", label: "Home", icon: svgIcon(homeIcon) },
    { id: "feedback", label: "Feedback", icon: svgIcon(chatIcon) },
    { id: "homeworks", label: "Homeworks", icon: svgIcon(assignmentIcon) },
    { id: "marks", label: "Marks", icon: svgIcon(doneAllIcon) },
    { id: "clubs", label: "Clubs", icon: svgIcon(demographyIcon) },
    { id: "events", label: "Events", icon: svgIcon(eventIcon) },
    { id: "standing", label: "Standing", icon: svgIcon(personShieldIcon) },
  ];

  let { userId }: { userId: string } = $props();

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
    const enabled: PageId[] = ["home", "feedback", "homeworks", "marks", "events"];
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
        {@html svgIcon(menuIcon)}
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
          {@html svgIcon(settingsIcon)}
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
          </div>
        {/if}
      </div>
      <button class="icon-btn" aria-label="Refresh" onclick={refresh}>
        {@html svgIcon(refreshIcon)}
      </button>
      <button
        class="icon-btn"
        class:has-badge={unreadCount > 0}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onclick={onNotifications}
      >
        {@html svgIcon(notificationsIcon)}
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
      onclick={toggleSidebar}
    ></div>

    <aside
      class="sidebar"
      class:collapsed={!sidebarOpen}
      aria-hidden={!sidebarOpen}
    >
      <div class="profile">
        {#if avatar}
          <img class="avatar" src={avatar} alt="" />
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
            onclick={() => onNav(item)}
          >
            <span class="nav-icon">{@html item.icon}</span>
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
