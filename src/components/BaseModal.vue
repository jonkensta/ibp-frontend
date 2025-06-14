<template>
  <div
    v-if="show"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded shadow p-4" style="max-width: 24rem">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()
const emit = defineEmits(['close'])
</script>
