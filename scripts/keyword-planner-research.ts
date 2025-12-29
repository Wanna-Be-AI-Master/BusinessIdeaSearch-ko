import { chromium } from 'playwright';
import * as fs from 'fs';

interface KeywordData {
  keyword: string;
  monthlySearches: string;
  threeMonthChange: string;
  yearOverYear: string;
  competition: string;
}

interface RelatedKeyword {
  keyword: string;
  monthlySearches: string;
  threeMonthChange: string;
  yearOverYear: string;
  competition: string;
}

async function researchKeywords() {
  const userKeywords = [
    '행정 수속',
    '민원 신청',
    '신청서 작성',
    '행정 절차 간소화',
    '온라인 민원',
    '정부 서류 작성',
    '행정 업무 자동화',
    '민원24 대체'
  ];

  const userResults: KeywordData[] = [];
  const relatedResults: RelatedKeyword[] = [];

  console.log('🚀 한국 시장 키워드 조사 시작...\n');
  console.log('조사 키워드:', userKeywords.join(', '));
  console.log('\n');

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
    console.log('');
    console.log('⚠️ 중요: 로그인 완료 후 키워드 플래너 페이지가');
    console.log('         표시될 때까지 대기해주세요.');
    console.log('========================================\n');

    await page.waitForTimeout(60000);

    console.log('🔍 현재 페이지 확인 중...\n');

    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}\n`);

    // 키워드 플래너 홈으로 이동 (아직 로그인 페이지인 경우를 위해)
    if (!currentUrl.includes('keywordplanner')) {
      console.log('키워드 플래너로 이동 중...\n');
      await page.goto('https://ads.google.com/aw/keywordplanner/home', {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      await page.waitForTimeout(5000);
    }

    console.log('📸 현재 페이지 스크린샷 저장...');
    await page.screenshot({ path: 'keyword-planner-start.png', fullPage: true });
    console.log('   저장 완료: keyword-planner-start.png\n');

    console.log('📝 자동으로 키워드를 조사합니다...\n');

    // "새 키워드 찾기" 카드/버튼 찾기
    console.log('🔘 "새 키워드 찾기" 클릭 중...');

    const discoverButtonSelectors = [
      'text=새 키워드 찾기',
      'h3:has-text("새 키워드 찾기")',
      'div:has-text("새 키워드 찾기")',
      ':text("새 키워드 찾기")',
      'a:has-text("새 키워드")'
    ];

    let clicked = false;
    for (const selector of discoverButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          console.log('   ✅ "새 키워드 찾기" 클릭 완료');
          clicked = true;
          await page.waitForTimeout(5000);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!clicked) {
      console.log('   ⚠️ "새 키워드 찾기" 버튼을 찾을 수 없습니다.');
      console.log('   📸 디버그 스크린샷 저장...');
      await page.screenshot({ path: 'debug-cannot-find-button.png', fullPage: true });
    }

    // 키워드 입력창 찾기 (모달 내부의 input 필드)
    console.log('\n⌨️  키워드 입력창 찾는 중...');
    const keywordText = userKeywords.join('\n');

    const inputSelectors = [
      'input[placeholder*="배달"]',
      'input[placeholder*="음식"]',
      'input[placeholder*="제품"]',
      'input[placeholder*="키워드"]',
      'input[type="text"]'
    ];

    let inputFilled = false;
    for (const selector of inputSelectors) {
      try {
        const inputs = page.locator(selector);
        const count = await inputs.count();

        for (let i = 0; i < count; i++) {
          const input = inputs.nth(i);
          if (await input.isVisible({ timeout: 2000 })) {
            // 입력창을 클릭하여 포커스
            await input.click();
            await page.waitForTimeout(500);

            // 기존 내용 제거
            await input.clear();
            await page.waitForTimeout(500);

            // 키워드 입력
            await input.fill(keywordText);
            console.log(`   ✅ ${userKeywords.length}개 키워드 입력 완료`);
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
      console.log('   ⚠️ 키워드 입력창을 찾을 수 없습니다.');
      console.log('   📸 디버그 스크린샷 저장...');
      await page.screenshot({ path: 'debug-cannot-find-input.png', fullPage: true });
    }

    // 지역 설정 (대한민국)
    console.log('\n🌍 지역 설정 확인 중...');
    const locationText = await page.textContent('body');
    if (locationText?.includes('대한민국') || locationText?.includes('한국')) {
      console.log('   ✅ 지역이 대한민국으로 설정되어 있습니다.');
    } else {
      console.log('   ⚠️ 지역을 수동으로 대한민국으로 설정해주세요.');
    }

    // "결과 보기" 버튼 클릭
    console.log('\n🔍 "결과 보기" 버튼 찾는 중...');

    const getResultsSelectors = [
      'button:has-text("결과 보기")',
      ':text("결과 보기")',
      'button:has-text("결과")',
      'button:has-text("보기")',
      'button[type="submit"]'
    ];

    let resultsClicked = false;
    for (const selector of getResultsSelectors) {
      try {
        const buttons = page.locator(selector);
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            console.log('   ✅ "결과 보기" 클릭 완료');
            resultsClicked = true;
            break;
          }
        }

        if (resultsClicked) break;
      } catch (e) {
        continue;
      }
    }

    if (!resultsClicked) {
      console.log('   ⚠️ "결과 보기" 버튼을 찾을 수 없습니다.');
      console.log('   📸 디버그 스크린샷 저장...');
      await page.screenshot({ path: 'debug-cannot-find-results-button.png', fullPage: true });
    }

    if (resultsClicked) {
      console.log('\n⏳ 검색 결과 로딩 대기 중... (최대 30초)');
      await page.waitForTimeout(30000);

      // 추가 로딩 확인
      const tableVisible = await page.locator('table, [role="table"], [role="grid"]').first()
        .isVisible({ timeout: 10000 }).catch(() => false);

      if (tableVisible) {
        console.log('   ✅ 검색 결과 테이블 로딩 완료');
      } else {
        console.log('   ⚠️ 테이블을 찾을 수 없지만 데이터 추출 시도합니다...');
      }
    }

    console.log('\n📊 페이지 데이터를 읽어옵니다...\n');

    // 페이지의 모든 텍스트 가져오기
    const pageText = await page.textContent('body') || '';

    console.log('✅ 페이지 데이터 수집 완료');
    console.log(`   총 ${pageText.length}자의 텍스트 수집\n`);

    // 스크린샷 저장
    await page.screenshot({ path: 'keyword-planner-results.png', fullPage: true });
    console.log('📸 스크린샷 저장: keyword-planner-results.png\n');

    // 데이터 파싱
    console.log('🔬 데이터 추출 중...\n');

    for (const keyword of userKeywords) {
      console.log(`📌 "${keyword}" 분석 중...`);

      const data: KeywordData = {
        keyword,
        monthlySearches: '데이터 없음',
        threeMonthChange: '-',
        yearOverYear: '-',
        competition: '-'
      };

      // 검색량 패턴 찾기 (다양한 형식 지원)
      const volumePatterns = [
        new RegExp(`${keyword}[\\s\\S]{0,500}?(\\d+[.,\\s]*\\d*\\s*[-~–—]\\s*\\d+[.,\\s]*\\d*[만천백십]?)`, 'gi'),
        new RegExp(`${keyword}[\\s\\S]{0,500}?(\\d+[만천]\\s*[-~–—]\\s*\\d+[만천])`, 'gi'),
        new RegExp(`${keyword}[\\s\\S]{0,500}?(\\d+\\s*[-~–—]\\s*\\d+)`, 'gi')
      ];

      for (const pattern of volumePatterns) {
        const matches = pageText.match(pattern);
        if (matches && matches[1]) {
          data.monthlySearches = matches[1].trim();
          break;
        }
      }

      // 변동률 패턴 찾기
      const changePattern = new RegExp(`${keyword}[\\s\\S]{0,500}?([-+]?\\d+%|[-+]?\\d+\\.\\d+%)`, 'gi');
      const changeMatches = pageText.match(changePattern);
      if (changeMatches) {
        const percentages = changeMatches.filter(m => m.includes('%'));
        if (percentages.length >= 1) data.threeMonthChange = percentages[0];
        if (percentages.length >= 2) data.yearOverYear = percentages[1];
      }

      // 경쟁도 찾기
      const competitionPatterns = ['낮음', '중간', '높음', '낮은', '중간 정도', '높은'];
      for (const comp of competitionPatterns) {
        const compRegex = new RegExp(`${keyword}[\\s\\S]{0,300}?(${comp})`, 'gi');
        const compMatch = pageText.match(compRegex);
        if (compMatch) {
          data.competition = comp;
          break;
        }
      }

      userResults.push(data);
      console.log(`   월간 검색량: ${data.monthlySearches}`);
      console.log(`   3개월 변동: ${data.threeMonthChange}`);
      console.log(`   전년 대비: ${data.yearOverYear}`);
      console.log(`   경쟁: ${data.competition}\n`);
    }

    // 관련 키워드 추출 시도
    console.log('🔎 관련 키워드 추출 중...\n');

    // 테이블에서 다른 키워드 찾기
    const relatedKeywordPattern = /([가-힣\s]{2,20})\s+(\d+[.,\s]*\d*\s*[-~–—]\s*\d+[.,\s]*\d*[만천]?)/g;
    const relatedMatches = [...pageText.matchAll(relatedKeywordPattern)];

    const seenKeywords = new Set(userKeywords);
    for (const match of relatedMatches.slice(0, 10)) {
      const keyword = match[1].trim();
      const volume = match[2].trim();

      if (!seenKeywords.has(keyword) && keyword.length >= 3) {
        seenKeywords.add(keyword);
        relatedResults.push({
          keyword,
          monthlySearches: volume,
          threeMonthChange: '-',
          yearOverYear: '-',
          competition: '-'
        });

        if (relatedResults.length >= 5) break;
      }
    }

    if (relatedResults.length > 0) {
      console.log(`✅ ${relatedResults.length}개 관련 키워드 발견\n`);
    } else {
      console.log('⚠️ 관련 키워드를 찾을 수 없습니다. 수동 확인 필요.\n');
    }

    // 마크다운 생성
    const markdown = generateMarkdown(userResults, relatedResults, userKeywords);
    const filename = 'keyword-research/한국-01-생활불편해결.md';

    // 디렉토리 확인
    if (!fs.existsSync('keyword-research')) {
      fs.mkdirSync('keyword-research');
    }

    fs.writeFileSync(filename, markdown, 'utf-8');

    console.log('========================================');
    console.log('✅ 키워드 조사 완료!');
    console.log('========================================');
    console.log(`📄 결과 파일: ${filename}`);
    console.log('\n💡 다음 단계:');
    console.log('   1. 생성된 문서를 열어서 확인');
    console.log('   2. 브라우저에서 정확한 검색량 확인');
    console.log('   3. "수동 확인 필요" 부분을 실제 데이터로 업데이트');
    console.log('   4. 관련 키워드 아이디어 섹션 작성\n');

    console.log('브라우저를 5분간 열어둡니다. 데이터를 확인하세요.\n');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.waitForTimeout(300000);
  } finally {
    await browser.close();
  }
}

function generateMarkdown(
  userResults: KeywordData[],
  relatedResults: RelatedKeyword[],
  userKeywords: string[]
): string {
  const today = new Date().toISOString().split('T')[0];

  let md = `# 생활 불편 해결 카테고리 키워드 조사\n\n`;
  md += `조사일: ${today}\n`;
  md += `지역: 한국\n`;
  md += `언어: 한국어\n\n`;

  md += `## 검색 키워드\n`;
  userKeywords.forEach(kw => {
    md += `- ${kw}\n`;
  });

  md += `\n## 조사 결과\n\n`;
  md += `### 사용자 제공 키워드\n\n`;
  md += `| 키워드 | 월간 검색량 | 3개월 변동 | 전년 대비 | 경쟁 |\n`;
  md += `|--------|------------|-----------|----------|------|\n`;

  userResults.forEach(r => {
    md += `| ${r.keyword} | ${r.monthlySearches} | ${r.threeMonthChange} | ${r.yearOverYear} | ${r.competition} |\n`;
  });

  md += `\n### 관련 키워드 아이디어\n\n`;
  md += `> ⚠️ **수동 작업 필요**: 브라우저의 키워드 플래너에서 제안된 관련 키워드를 확인하고\n`;
  md += `> 아래 테이블에 직접 추가해주세요.\n\n`;
  md += `| 키워드 | 월간 검색량 | 3개월 변동 | 전년 대비 | 경쟁 |\n`;
  md += `|--------|------------|-----------|----------|------|\n`;

  if (relatedResults.length > 0) {
    relatedResults.forEach(r => {
      md += `| ${r.keyword} | ${r.monthlySearches} | ${r.threeMonthChange} | ${r.yearOverYear} | ${r.competition} |\n`;
    });
  } else {
    md += `| (브라우저에서 확인 후 여기에 추가) | - | - | - | - |\n`;
  }

  md += `\n## 분석\n\n`;
  md += `- **총 키워드 수**: ${userResults.length}개 (사용자 제공)\n`;
  md += `- **데이터 상태**: 수동 확인 및 업데이트 필요\n\n`;

  md += `### 평가\n\n`;
  md += `> ⚠️ **작업 중**: 이 섹션은 정확한 검색량 데이터 확인 후 작성해주세요.\n\n`;
  md += `평가 항목:\n`;
  md += `- [ ] 검색량이 월 1,000회 이상인 키워드 확인\n`;
  md += `- [ ] 검색량 트렌드 분석 (증가/감소/유지)\n`;
  md += `- [ ] 경쟁도 분석\n`;
  md += `- [ ] 비즈니스 기회 평가\n\n`;

  md += `## 다음 단계\n\n`;
  md += `1. ✅ 키워드 플래너에서 정확한 데이터 확인\n`;
  md += `2. ⬜ 이 문서의 "수동 확인 필요" 부분을 실제 데이터로 업데이트\n`;
  md += `3. ⬜ 관련 키워드 아이디어 섹션 작성\n`;
  md += `4. ⬜ 분석 및 평가 섹션 완성\n`;
  md += `5. ⬜ 경쟁 서비스 조사 (네이버, 구글, 앱스토어)\n`;

  return md;
}

researchKeywords();
