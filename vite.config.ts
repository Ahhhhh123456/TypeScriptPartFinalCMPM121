import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Cmpm-121-Final-Project/', // Replace <REPO_NAME> with your repository name

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    }
  }
});
