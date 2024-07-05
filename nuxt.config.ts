// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/plausible',
  ],
  plausible: {
    // Prevent tracking on localhost
    ignoredHostnames: ['localhost'],
    domain: '',
    autoOutboundTracking: true,
    apiHost: '',
  },
})
