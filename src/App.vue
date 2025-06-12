<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <aside class="w-64 bg-white dark:bg-gray-800 shadow-md">
      <div class="p-4">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">IBP</h1>
      </div>
      <nav class="mt-4">
        <RouterLink
          to="/"
          class="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >Home</RouterLink
        >
        <RouterLink
          to="/inmates"
          class="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >Inmates</RouterLink
        >
        <RouterLink
          to="/units"
          class="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >Units</RouterLink
        >
      </nav>
    </aside>
    <main class="flex-1 p-8 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
