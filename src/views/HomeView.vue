<template>
  <div class="text-center p-4">
    <h1 class="h4 fw-bold mb-4">Welcome to the Inmate and Unit Information Portal</h1>
    <p class="mb-6">Use the navigation links to search for inmates or browse correctional units.</p>
    <nav class="d-flex gap-4">
      <router-link to="/inmates" class="text-primary text-decoration-none"
        >Search Inmates</router-link
      >
      <router-link to="/units" class="text-primary text-decoration-none">Browse Units</router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
// No script needed for this simple static view
</script>
