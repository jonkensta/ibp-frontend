<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="d-flex flex-column min-vh-100 bg-light">
    <header class="bg-white shadow">
      <div class="container d-flex align-items-center justify-content-between p-4">
        <h1 class="h4 fw-bold text-dark">IBP</h1>
        <nav class="d-flex gap-4">
          <RouterLink to="/" class="text-secondary text-decoration-none"> Home </RouterLink>
          <RouterLink to="/inmates" class="text-secondary text-decoration-none">
            Inmates
          </RouterLink>
          <RouterLink to="/units" class="text-secondary text-decoration-none"> Units </RouterLink>
        </nav>
      </div>
    </header>
    <main class="d-flex flex-column flex-grow-1 p-4 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>
