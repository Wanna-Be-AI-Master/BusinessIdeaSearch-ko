import { chromium } from 'playwright';

async function loginToKeywordPlanner() {
  // 새로운 프로필로 브라우저 열기
  const context = await chromium.launchPersistentContext('./chrome-profile', {
    headless: false,
    slowMo: 100,
    channel: 'chrome',
    viewport: { width: 1280, height: 720 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 키워드 플래너로 바로 이동 (로그인 페이지로 리다이렉트됨)
    console.log('키워드 플래너로 이동 중...');
    await page.goto('https://ads.google.com/aw/keywordplanner/home');

    console.log('');
    console.log('========================================');
    console.log('브라우저가 열렸습니다!');
    console.log('수동으로 Google 로그인을 진행해주세요.');
    console.log('로그인 후 키워드 플래너를 사용하세요.');
    console.log('========================================');

    // 브라우저를 열어둠 (10분)
    await page.waitForTimeout(600000);

  } catch (error) {
    console.error('오류 발생:', error);
    await page.waitForTimeout(600000);
  } finally {
    await context.close();
  }
}

loginToKeywordPlanner();
