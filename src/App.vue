<template>
  <div id="app-layout">
    <header>
      <nav class="main-nav">
        <router-link to="/">Home</router-link>
        <router-link to="/inmates">Inmates</router-link>
        <router-link to="/units">Units</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>&copy; {{ new Date().getFullYear() }} Inside Books Project</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this layout component
</script>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: var(--vt-c-black-soft); /* Or your theme's header background */
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-nav {
  display: flex;
  justify-content: center; /* Center navigation items */
  gap: 1.5rem; /* Space between links */
}

.main-nav a {
  color: var(--vt-c-text-dark-1); /* Light text for dark header */
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 4px;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.main-nav a:hover,
.main-nav a.router-link-exact-active {
  background-color: hsla(160, 100%, 37%, 1); /* Vue green for active/hover */
  color: var(--vt-c-white);
}

main {
  flex-grow: 1;
  padding: 1rem; /* Add some padding around the content area */
  max-width: 1280px;
  margin: 0 auto; /* Center content */
  width: 100%;
}

footer {
  text-align: center;
  padding: 1rem;
  background-color: var(--vt-c-black-mute); /* Or your theme's footer background */
  color: var(--vt-c-text-dark-2);
  font-size: 0.9rem;
  margin-top: auto; /* Push footer to the bottom */
}

/* Use existing variables from base.css if preferred */
@media (prefers-color-scheme: light) {
  header {
    background-color: var(--vt-c-white-soft);
  }
  .main-nav a {
    color: var(--vt-c-text-light-1);
  }
  .main-nav a:hover,
  .main-nav a.router-link-exact-active {
    background-color: hsla(160, 100%, 37%, 0.2);
    color: var(--vt-c-text-light-1);
  }
  footer {
    background-color: var(--vt-c-white-mute);
    color: var(--vt-c-text-light-2);
  }
}
</style>
