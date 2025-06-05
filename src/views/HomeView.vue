<template>
  <div class="home-view">
    <h1>Welcome to the Inmate and Unit Information Portal</h1>
    <p>Use the navigation links to search for inmates or browse correctional units.</p>
    <nav>
      <router-link to="/inmates">Search Inmates</router-link> |
      <router-link to="/units">Browse Units</router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
// No script needed for this simple static view
</script>

<style scoped>
.home-view {
  text-align: center;
  padding: 2rem;
}
.home-view nav {
  margin-top: 1.5rem;
}
.home-view nav a {
  margin: 0 0.5rem;
  font-size: 1.2rem;
}
</style>
