import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일 디렉토리
  testDir: './e2e',

  // 각 테스트의 최대 실행 시간
  timeout: 30 * 1000,

  // 테스트 전체의 최대 실행 시간
  globalTimeout: 10 * 60 * 1000,

  // 실패시 재시도 횟수 (CI 환경에서는 2회)
  retries: process.env.CI ? 2 : 0,

  // 병렬 실행 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 테스트 리포터 설정
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // 공통 설정
  use: {
    // 기본 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 스크린샷은 실패시에만
    screenshot: 'only-on-failure',

    // 트레이스는 첫 재시도시에만
    trace: 'on-first-retry',

    // 뷰포트 크기
    viewport: { width: 1280, height: 720 },
  },

  // 프로젝트 설정 (브라우저)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 모바일 테스트
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // 개발 서버 자동 시작 설정
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
