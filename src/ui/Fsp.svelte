<script lang="ts">
  import { getUserById, getUserImage } from "../api";
  import { notify } from "../notifications";
  import ScheduleView from "./fsp/ScheduleView.svelte";
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

  interface NavItem {
    id: string;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { id: "home", label: "Home", icon: homeIcon },
    { id: "feedback", label: "Feedback", icon: chatIcon },
    { id: "homeworks", label: "Homeworks", icon: assignmentIcon },
    { id: "marks", label: "Marks", icon: doneAllIcon },
    { id: "clubs", label: "Clubs", icon: demographyIcon },
    { id: "events", label: "Events", icon: eventIcon },
    { id: "standing", label: "Standing", icon: personShieldIcon },
  ];

  let { userId }: { userId: string } = $props();

  let sidebarOpen = $state(false);
  let activeNav = $state("home");
  let name = $state("");
  let rollNumber = $state("");
  let avatar = $state<string | null>(null);
  let refreshKey = $state(0);
  let notifOpen = $state(false);
  let unreadCount = $state(0);

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
    refreshKey += 1;
  }

  function onNotifications() {
    notifOpen = !notifOpen;
  }

  function onNav(item: NavItem) {
    if (item.id === activeNav) return;
    if (item.id !== "home") {
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
        {@html menuIcon}
      </button>
    </div>
    <div class="header-right">
      <button class="icon-btn" aria-label="Refresh" onclick={refresh}>
        {@html refreshIcon}
      </button>
      <button
        class="icon-btn"
        class:has-badge={unreadCount > 0}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onclick={onNotifications}
      >
        {@html notificationsIcon}
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
      <ScheduleView studentId={userId} {refreshKey} />
    </main>
  </div>

  <NotificationsPanel
    {userId}
    open={notifOpen}
    onclose={() => (notifOpen = false)}
    onunread={(n) => (unreadCount = n)}
  />
</div>
