<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow-md">
      <div class="container mx-auto flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">IBP</h1>
        <nav class="flex space-x-4">
          <RouterLink to="/" class="text-gray-600 dark:text-gray-300 hover:underline">
            Home
          </RouterLink>
          <RouterLink to="/inmates" class="text-gray-600 dark:text-gray-300 hover:underline">
            Inmates
          </RouterLink>
          <RouterLink to="/units" class="text-gray-600 dark:text-gray-300 hover:underline">
            Units
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex-1 p-8 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
