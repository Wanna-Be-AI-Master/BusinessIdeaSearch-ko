import { chromium } from 'playwright';

async function loginToKeywordPlanner() {
  // 일반 브라우저 실행 (자동화 감지 우회)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  const keywords = [
    '행정 수속 앱',
    '민원 신청 앱',
    '신청서 작성 앱',
    '행정 절차 간소화',
    '온라인 민원',
    '정부 서류 작성',
    '행정 업무 자동화',
    '민원24 대체'
  ];

  try {
    // 키워드 플래너로 바로 이동 (로그인 페이지로 리다이렉트됨)
    console.log('키워드 플래너로 이동 중...');
    await page.goto('https://ads.google.com/aw/keywordplanner/home', { waitUntil: 'networkidle' });

    console.log('');
    console.log('========================================');
    console.log('브라우저가 열렸습니다!');
    console.log('수동으로 Google 로그인을 진행해주세요.');
    console.log('로그인 완료 후 30초 대기합니다...');
    console.log('========================================');

    // 로그인 대기
    await page.waitForTimeout(30000);

    console.log('\n🔍 키워드 조사를 시작합니다...\n');

    // 키워드 조사 시작
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\n[${i + 1}/${keywords.length}] "${keyword}" 조사 중...`);

      try {
        // 키워드 플래너 홈으로 이동
        await page.goto('https://ads.google.com/aw/keywordplanner/home', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // "새 키워드 발견하기" 버튼 찾기 및 클릭
        const discoverButton = page.locator('text="새 키워드 발견하기", button:has-text("발견")').first();
        if (await discoverButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await discoverButton.click();
          await page.waitForTimeout(2000);
        }

        // 키워드 입력창 찾기
        const inputSelectors = [
          'textarea[aria-label*="키워드"]',
          'textarea[placeholder*="제품"]',
          'textarea',
          'input[type="text"]'
        ];

        let inputFilled = false;
        for (const selector of inputSelectors) {
          try {
            const input = page.locator(selector).first();
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
              await input.clear();
              await input.fill(keyword);
              console.log(`   ✓ 키워드 입력 완료`);
              inputFilled = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!inputFilled) {
          console.log(`   ⚠️  입력창을 찾을 수 없습니다`);
          continue;
        }

        await page.waitForTimeout(1000);

        // "결과 가져오기" 버튼 클릭
        const getResultsButton = page.locator('button:has-text("결과"), button:has-text("검색")').first();
        if (await getResultsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await getResultsButton.click();
          console.log(`   ✓ 결과 가져오기 클릭`);

          // 결과 테이블이 로딩될 때까지 대기 (최대 15초)
          console.log(`   ⏳ 검색량 결과 로딩 대기 중...`);
          await page.waitForTimeout(15000);

          // 추가 확인: 테이블이나 그래프가 나타났는지 확인
          const resultLoaded = await page.locator('table, [role="table"], canvas').first().isVisible({ timeout: 5000 }).catch(() => false);
          if (resultLoaded) {
            console.log(`   ✅ 검색량 결과 로딩 완료`);
          } else {
            console.log(`   ⚠️  결과 로딩 확인 실패 (스크린샷은 저장)`);
          }
        }

        // 스크린샷 저장 (전체 페이지)
        const filename = `keyword-results-${keyword.replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`   ✓ 스크린샷 저장: ${filename}`);

        console.log(`   ✅ "${keyword}" 조사 완료`);

      } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
      }

      // 다음 키워드를 위한 대기
      await page.waitForTimeout(2000);
    }

    console.log('\n========================================');
    console.log('✅ 모든 키워드 조사 완료!');
    console.log('========================================');
    console.log('스크린샷을 확인하고 검색량 데이터를 분석하세요.');
    console.log('\n브라우저를 5분간 열어둡니다...\n');

    // 브라우저를 5분간 열어둠
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('오류 발생:', error);
    await page.waitForTimeout(600000);
  } finally {
    await browser.close();
  }
}

loginToKeywordPlanner();
