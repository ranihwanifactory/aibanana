import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 현재 작업 디렉토리에서 환경 변수를 로드합니다.
  // 세 번째 파라미터를 ''로 설정하여 접두사 없이 모든 환경 변수를 로드할 수 있게 합니다.
  // Fix: Cast process to any to resolve "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    define: {
      // 코드 내의 process.env.API_KEY를 실제 환경 변수 값으로 치환합니다.
      // Vercel에서 VITE_API_KEY 또는 API_KEY로 설정한 값을 우선순위에 따라 가져옵니다.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  }
})