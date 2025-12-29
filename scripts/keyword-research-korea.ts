import { chromium } from 'playwright';
import * as fs from 'fs';

interface KeywordData {
  keyword: string;
  monthlySearches: string;
  threeMonthChange: string;
  yearOverYear: string;
  competition: string;
}

interface CategoryResult {
  category: string;
  mainKeyword: string;
  searchVolume: string;
  competition: string;
  relatedKeywords: KeywordData[];
  timestamp: string;
}

async function researchKoreanKeywords() {
  // 조사할 한국 키워드 목록 (검색량 높을 것으로 예상)
  const categories = [
    { name: '재테크', keyword: '재테크' },
    { name: '다이어트', keyword: '다이어트' },
    { name: '부업', keyword: '부업' },
    { name: '홈트레이닝', keyword: '홈트레이닝' },
    { name: '가계부', keyword: '가계부' },
    { name: '육아', keyword: '육아' },
    { name: '영어공부', keyword: '영어공부' },
    { name: '이직', keyword: '이직' }
  ];

  const results: CategoryResult[] = [];

  console.log('🚀 한국 시장 고검색량 키워드 조사 시작...\n');
  console.log(`총 ${categories.length}개 카테고리 조사 예정\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  try {
    console.log('📍 Google Ads 계정으로 이동 중...');
    await page.goto('https://ads.google.com/aw/content?ocid=7903909664&workspaceId=0&euid=1588983262&__u=7185699438&uscid=7903909664&__c=7034824736&authuser=1&subid=kr-ko-awhp-g-aw-c-home-signin-bgc%21o2-ahpm-0000000192-0000000001', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('\n========================================');
    console.log('✋ 수동으로 Google 계정 로그인을 완료해주세요');
    console.log('로그인 후 60초 대기합니다...');
    console.log('========================================\n');

    await page.waitForTimeout(60000);

    console.log('🔍 키워드 플래너로 이동 중...\n');
    await page.goto('https://ads.google.com/aw/keywordplanner/home', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    // 각 카테고리별로 조사
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 [${i + 1}/${categories.length}] "${category.keyword}" 조사 중...`);
      console.log('='.repeat(60));

      try {
        // 키워드 플래너 홈으로 이동
        await page.goto('https://ads.google.com/aw/keywordplanner/home', {
          waitUntil: 'networkidle',
          timeout: 60000
        });
        await page.waitForTimeout(2000);

        // "새 키워드 찾기" 클릭
        console.log('🔘 "새 키워드 찾기" 클릭 중...');
        const discoverSelectors = [
          'text=새 키워드 찾기',
          'h3:has-text("새 키워드 찾기")',
          ':text("새 키워드 찾기")'
        ];

        let clicked = false;
        for (const selector of discoverSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 3000 })) {
              await element.click();
              console.log('   ✅ 클릭 완료');
              clicked = true;
              await page.waitForTimeout(5000);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!clicked) {
          console.log('   ⚠️ 버튼을 찾을 수 없습니다. 다음 키워드로...');
          continue;
        }

        // 키워드 입력
        console.log(`⌨️  "${category.keyword}" 입력 중...`);
        const inputSelectors = [
          'input[placeholder*="배달"]',
          'input[placeholder*="제품"]',
          'input[type="text"]'
        ];

        let inputFilled = false;
        for (const selector of inputSelectors) {
          try {
            const inputs = page.locator(selector);
            const count = await inputs.count();

            for (let j = 0; j < count; j++) {
              const input = inputs.nth(j);
              if (await input.isVisible({ timeout: 2000 })) {
                await input.click();
                await page.waitForTimeout(500);
                await input.clear();
                await page.waitForTimeout(500);
                await input.fill(category.keyword);
                console.log('   ✅ 입력 완료');
                inputFilled = true;
                await page.waitForTimeout(2000);
                break;
              }
            }
            if (inputFilled) break;
          } catch (e) {
            continue;
          }
        }

        if (!inputFilled) {
          console.log('   ⚠️ 입력창을 찾을 수 없습니다. 다음 키워드로...');
          continue;
        }

        // "결과 보기" 클릭
        console.log('🔍 "결과 보기" 클릭 중...');
        const resultSelectors = [
          'button:has-text("결과 보기")',
          ':text("결과 보기")',
          'button:has-text("결과")'
        ];

        let resultsClicked = false;
        for (const selector of resultSelectors) {
          try {
            const buttons = page.locator(selector);
            const count = await buttons.count();

            for (let j = 0; j < count; j++) {
              const button = buttons.nth(j);
              if (await button.isVisible({ timeout: 2000 })) {
                await button.click();
                console.log('   ✅ 클릭 완료');
                resultsClicked = true;
                break;
              }
            }
            if (resultsClicked) break;
          } catch (e) {
            continue;
          }
        }

        if (resultsClicked) {
          console.log('⏳ 검색 결과 로딩 대기 중... (30초)');
          await page.waitForTimeout(30000);
        }

        // 페이지 데이터 수집
        console.log('📊 데이터 수집 중...');
        const pageText = await page.textContent('body') || '';
        console.log(`   수집 완료: ${pageText.length}자`);

        // 스크린샷 저장
        const screenshotPath = `keyword-research/screenshots/한국-${category.name}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   📸 스크린샷: ${screenshotPath}`);

        // 데이터 파싱
        const relatedKeywords: KeywordData[] = [];

        // 테이블에서 키워드 추출 (간단한 패턴)
        const keywordPattern = /([가-힣\s]{2,20})\s+(\d+[~\-–]\d+[만천백십]?)/g;
        const matches = [...pageText.matchAll(keywordPattern)];

        for (const match of matches.slice(0, 20)) {
          const kw = match[1].trim();
          const vol = match[2].trim();

          if (kw.length >= 2 && !kw.includes('키워드') && !kw.includes('검색')) {
            relatedKeywords.push({
              keyword: kw,
              monthlySearches: vol,
              threeMonthChange: '-',
              yearOverYear: '-',
              competition: '-'
            });
          }
        }

        // 메인 키워드 검색량 찾기
        let mainSearchVolume = '데이터 없음';
        const mainPattern = new RegExp(`${category.keyword}[\\s\\S]{0,200}?(\\d+[~\\-–]\\d+[만천]?)`, 'gi');
        const mainMatch = pageText.match(mainPattern);
        if (mainMatch && mainMatch[1]) {
          mainSearchVolume = mainMatch[1];
        }

        // 경쟁도 찾기
        let competition = '-';
        if (pageText.includes('낮음')) competition = '낮음';
        else if (pageText.includes('중간')) competition = '중간';
        else if (pageText.includes('높음')) competition = '높음';

        const result: CategoryResult = {
          category: category.name,
          mainKeyword: category.keyword,
          searchVolume: mainSearchVolume,
          competition: competition,
          relatedKeywords: relatedKeywords,
          timestamp: new Date().toISOString()
        };

        results.push(result);

        console.log(`✅ "${category.keyword}" 조사 완료!`);
        console.log(`   📈 검색량: ${mainSearchVolume}`);
        console.log(`   🎯 경쟁: ${competition}`);
        console.log(`   🔗 관련 키워드: ${relatedKeywords.length}개\n`);

      } catch (error) {
        console.log(`   ❌ 오류 발생: ${error}`);
        console.log(`   ⏭️  다음 키워드로 진행...\n`);
        continue;
      }

      // 다음 키워드를 위한 짧은 대기
      await page.waitForTimeout(2000);
    }

    // 종합 보고서 생성
    console.log('\n' + '='.repeat(60));
    console.log('📝 종합 보고서 생성 중...');
    console.log('='.repeat(60) + '\n');

    const markdown = generateComprehensiveReport(results);
    const reportPath = 'keyword-research/한국-고검색량키워드조사.md';

    // 디렉토리 확인
    if (!fs.existsSync('keyword-research/screenshots')) {
      fs.mkdirSync('keyword-research/screenshots', { recursive: true });
    }

    fs.writeFileSync(reportPath, markdown, 'utf-8');

    console.log('========================================');
    console.log('✅ 전체 조사 완료!');
    console.log('========================================');
    console.log(`📄 종합 보고서: ${reportPath}`);
    console.log(`📊 조사 완료: ${results.length}/${categories.length}개 카테고리`);
    console.log(`📸 스크린샷: keyword-research/screenshots/`);
    console.log('\n브라우저를 3분간 열어둡니다...\n');

    await page.waitForTimeout(180000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.waitForTimeout(180000);
  } finally {
    await browser.close();
  }
}

function generateComprehensiveReport(results: CategoryResult[]): string {
  const today = new Date().toISOString().split('T')[0];

  let md = `# 한국 시장 고검색량 키워드 조사 종합 보고서\n\n`;
  md += `조사일: ${today}\n`;
  md += `조사 도구: Google Keyword Planner (Playwright 자동화)\n`;
  md += `조사 대상: 검색량 높은 생활/비즈니스 키워드\n\n`;
  md += `---\n\n`;

  // 요약 테이블
  md += `## 조사 개요\n\n`;
  md += `| # | 카테고리 | 메인 키워드 | 월간 검색량 | 경쟁 | 관련 키워드 수 |\n`;
  md += `|---|---------|------------|-----------|------|---------------|\n`;

  results.forEach((r, i) => {
    md += `| ${i + 1} | ${r.category} | ${r.mainKeyword} | ${r.searchVolume} | ${r.competition} | ${r.relatedKeywords.length}개 |\n`;
  });

  md += `\n---\n\n`;

  // 각 카테고리 상세
  results.forEach((r, i) => {
    md += `## ${i + 1}. ${r.category} (${r.mainKeyword})\n\n`;
    md += `**메인 키워드 분석:**\n`;
    md += `- 월간 검색량: **${r.searchVolume}**\n`;
    md += `- 경쟁도: ${r.competition}\n`;
    md += `- 조사 시각: ${r.timestamp}\n\n`;

    if (r.relatedKeywords.length > 0) {
      md += `**관련 키워드 (상위 ${Math.min(20, r.relatedKeywords.length)}개):**\n\n`;
      md += `| 키워드 | 월간 검색량 |\n`;
      md += `|--------|------------|\n`;

      r.relatedKeywords.slice(0, 20).forEach(kw => {
        md += `| ${kw.keyword} | ${kw.monthlySearches} |\n`;
      });
    } else {
      md += `**관련 키워드:** 데이터 없음\n`;
    }

    md += `\n---\n\n`;
  });

  // 평가 및 다음 단계
  md += `## 평가 및 다음 단계\n\n`;
  md += `### 검색량 순위\n\n`;
  md += `> 상위 카테고리를 중심으로 비즈니스 아이디어 발굴\n\n`;

  md += `### 추가 조사 필요 항목\n\n`;
  md += `- [ ] 앱스토어 경쟁 분석 (각 카테고리별)\n`;
  md += `- [ ] 웹 경쟁 분석 (SEO, 광고)\n`;
  md += `- [ ] 수익화 모델 검토\n`;
  md += `- [ ] 개발 난이도 평가\n\n`;

  return md;
}

researchKoreanKeywords();
