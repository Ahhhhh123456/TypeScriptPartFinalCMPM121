import { defineConfig } from 'vite';

export default defineConfig({
  base: '/TypeScriptPartFinalCMPM121-TEST/', // Replace <REPO_NAME> with your repository name

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    }
  }
});