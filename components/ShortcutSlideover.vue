<script setup lang="ts">
import { useMagicKeys } from '@vueuse/core'

const isOpen = ref(false)
const { meta_k /* keys you want to monitor */ } = useMagicKeys()

watch(meta_k, (v) => {
  if (v)
    isOpen.value = !isOpen.value
})
</script>

<template>
  <div>
    <button class="flex flex-col items-start space-y-2" @click="isOpen = true">
      <kbd class="inline-flex flex-row items-center space-x-2">
        <Icon
          name="solar:command-outline"
        />
        <span>+</span>
        <span>k</span>
      </kbd>
      <span class="text-xs font-medium tracking-wide text-zinc-700 uppercase ">Open shortcuts</span>
    </button>

    <USlideover
      v-model="isOpen"
      :ui="{
        overlay: {
          base: 'fixed inset-0 transition-opacity',
          background: 'dark:bg-zinc-200/75 dark:dark:bg-zinc-900/75',
          transition: {
            enter: 'ease-in-out duration-500',
            enterFrom: 'opacity-0',
            enterTo: 'opacity-100',
            leave: 'ease-in-out duration-500',
            leaveFrom: 'opacity-100',
            leaveTo: 'opacity-0',
          },
        },
      }"
    >
      <UCard
        class="flex flex-col flex-1"
        :ui="{
          body: {
            base: 'flex-1',
          },
          background: 'bg-white dark:dark:bg-zinc-800',
          rounded: 'rounded-none',
          ring: '',
          divide: 'divide-y divide-zinc-100 dark:divide-zinc-700' }"
      >
        <template #header>
          <button
            @click="isOpen = false"
          >
            Close
          </button>
        </template>

        <div class="h-full space-y-8">
          <strong>Keyboard Shortcuts</strong>

          <ul class="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-700 text-sm">
            <li class="flex flex-row items-center justify-between py-2">
              <kbd class="inline-flex flex-row items-center gap-2">
                <Icon
                  name="solar:command-outline"
                />
                <span>+</span>
                <span>k</span>
              </kbd>
              <span>Open shortcuts</span>
            </li>
            <li class="flex flex-row items-center justify-between py-2">
              <kbd class="inline-flex flex-row items-center gap-2">
                <Icon
                  name="solar:command-outline"
                />
                <span>+</span>
                <Icon name="solar:backspace-bold" /></kbd>
              <span>Clear board</span>
            </li>
            <li class="flex flex-row items-center justify-between py-2">
              <kbd class="inline-flex flex-row items-center gap-2">
                <Icon
                  name="solar:command-outline"
                />
                <span>+</span>
                <span>i</span>
              </kbd>
              <span>Import JSON</span>
            </li>
            <li class="flex flex-row items-center justify-between py-2">
              <kbd class="inline-flex flex-row items-center gap-2">
                <Icon
                  name="solar:command-outline"
                />
                <span>+</span>
                <span>e</span>
              </kbd>
              <span>Export JSON</span>
            </li>
          </ul>
        </div>
      </UCard>
    </USlideover>
  </div>
</template>
