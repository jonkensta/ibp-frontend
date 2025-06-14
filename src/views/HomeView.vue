<template>
  <div class="text-center p-8">
    <h1 class="text-2xl font-bold mb-4">Welcome to the Inmate and Unit Information Portal</h1>
    <p class="mb-6">Use the navigation links to search for inmates or browse correctional units.</p>
    <nav class="space-x-4">
      <router-link to="/inmates" class="text-blue-600 hover:underline">Search Inmates</router-link>
      <router-link to="/units" class="text-blue-600 hover:underline">Browse Units</router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
// No script needed for this simple static view
</script>
