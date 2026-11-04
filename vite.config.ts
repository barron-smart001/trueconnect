import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks cache across deploys; app code changes far more often.
        // The character class [/\\] matches both POSIX and Windows path separators.
        codeSplitting: {
          groups: [
            { name: 'supabase', test: /node_modules[/\\]@supabase/ },
            { name: 'motion', test: /node_modules[/\\](framer-motion|motion-dom|motion-utils)/ },
            { name: 'react', test: /node_modules[/\\](react|react-dom|react-router|react-router-dom|scheduler)[/\\]/ },
          ],
        },
      },
    },
  },
})
