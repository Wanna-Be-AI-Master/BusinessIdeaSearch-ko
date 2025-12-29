import { chromium } from 'playwright';
import * as fs from 'fs';

interface KeywordAnalysis {
  keyword: string;
  searchVolume: string;
  competition: string;
  googleResults: number;
  ratio: string; // 검색량 대비 결과 수 비율
  isBlueOcean: boolean;
}

interface CategoryAnalysis {
  category: string;
  mainKeyword: string;
  keywords: KeywordAnalysis[];
  blueOceanCount: number;
}

// 한국어 검색량 문자열을 숫자로 변환 (범위의 최소값 사용)
function parseKoreanSearchVolume(volumeStr: string): number {
  // "1만~10만", "1천~1만", "100~1천", "10~100" 등의 형식 처리
  const parts = volumeStr.split(/[~\-–]/);
  if (parts.length === 0) return 0;

  const firstPart = parts[0].trim();

  // 만 = 10,000
  if (firstPart.includes('만')) {
    const num = parseInt(firstPart.replace('만', ''));
    return isNaN(num) ? 0 : num * 10000;
  }
  // 천 = 1,000
  else if (firstPart.includes('천')) {
    const num = parseInt(firstPart.replace('천', ''));
    return isNaN(num) ? 0 : num * 1000;
  }
  // 백 = 100
  else if (firstPart.includes('백')) {
    const num = parseInt(firstPart.replace('백', ''));
    return isNaN(num) ? 0 : num * 100;
  }
  // 십 = 10
  else if (firstPart.includes('십')) {
    const num = parseInt(firstPart.replace('십', ''));
    return isNaN(num) ? 0 : num * 10;
  }
  // 순수 숫자
  else {
    const num = parseInt(firstPart);
    return isNaN(num) ? 0 : num;
  }
}

async function findBlueOceanKeywords() {
  // 조사할 한국 키워드 (검색량 높을 것으로 예상)
  const categories = [
    { name: '다이어트', keywords: ['다이어트', '다이어트 앱', '다이어트 식단'] },
    { name: '재테크', keywords: ['재테크', '재테크 앱', '주식 공부'] },
    { name: '이직', keywords: ['이직', '이직 준비', '이직 사이트'] },
    { name: '육아', keywords: ['육아', '육아 앱', '육아 일기'] },
    { name: '영어', keywords: ['영어 공부', '영어 공부 앱', '영어 회화'] },
    { name: '운동', keywords: ['홈트레이닝', '운동 기록', '운동 앱'] },
    { name: '가계부', keywords: ['가계부', '가계부 앱', '지출 관리'] },
    { name: '습관', keywords: ['습관 만들기', '습관 트래커', '루틴 관리'] }
  ];

  const results: CategoryAnalysis[] = [];

  console.log('🔍 블루오션 키워드 찾기 시작...\n');
  console.log('📋 단계 1: Keyword Planner에서 검색량 조사');
  console.log('📋 단계 2: Google 검색 결과 수 확인');
  console.log('📋 단계 3: 블루오션 키워드 분석\n');

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
    console.log('✋ Google 계정 로그인을 완료해주세요');
    console.log('로그인 후 60초 대기합니다...');
    console.log('========================================\n');

    await page.waitForTimeout(60000);

    // 각 카테고리별로 조사
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const categoryResult: CategoryAnalysis = {
        category: category.name,
        mainKeyword: category.keywords[0],
        keywords: [],
        blueOceanCount: 0
      };

      console.log(`\n${'='.repeat(70)}`);
      console.log(`🎯 [${i + 1}/${categories.length}] ${category.name} 카테고리 분석 중...`);
      console.log('='.repeat(70));

      for (const keyword of category.keywords) {
        console.log(`\n📌 "${keyword}" 분석 중...`);

        try {
          // STEP 1: Keyword Planner에서 검색량 조사
          console.log('  [1/2] Keyword Planner 조사...');

          await page.goto('https://ads.google.com/aw/keywordplanner/home', {
            waitUntil: 'networkidle',
            timeout: 60000
          });
          await page.waitForTimeout(2000);

          // "새 키워드 찾기" 클릭
          const discoverBtn = page.locator('text=새 키워드 찾기').first();
          if (await discoverBtn.isVisible({ timeout: 3000 })) {
            await discoverBtn.click();
            await page.waitForTimeout(3000);
          }

          // 키워드 입력
          const input = page.locator('input[placeholder*="배달"]').first();
          if (await input.isVisible({ timeout: 3000 })) {
            await input.click();
            await input.clear();
            await input.fill(keyword);
            await page.waitForTimeout(1000);
          }

          // "결과 보기" 클릭
          const resultBtn = page.locator('button:has-text("결과 보기")').first();
          if (await resultBtn.isVisible({ timeout: 3000 })) {
            await resultBtn.click();
            await page.waitForTimeout(15000); // 결과 로딩 대기
          }

          // 검색량 데이터 추출 - DOM에서 직접 추출
          let searchVolume = '데이터 없음';
          let competition = '-';

          try {
            // 테이블이 로드될 때까지 충분히 대기
            await page.waitForTimeout(5000);

            // 디버깅: 스크린샷 저장
            const debugScreenshot = `keyword-research/debug/debug-${keyword}.png`;
            await page.screenshot({ path: debugScreenshot, fullPage: false });

            // JavaScript를 페이지 내에서 실행하여 테이블 데이터 추출
            const tableData = await page.evaluate((kw) => {
              // 모든 테이블 행 찾기
              const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));

              for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td, th, [role="cell"], [role="gridcell"]'));
                const rowText = row.textContent || '';

                // 이 행에 키워드가 있는지 확인
                if (rowText.includes(kw)) {
                  // 각 셀의 텍스트 검사
                  for (const cell of cells) {
                    const cellText = cell.textContent || '';
                    // 검색량 패턴 찾기 (1만~10만, 1천~1만, 100~1천, 10~100)
                    const volumeMatch = cellText.match(/(\d+(?:[만천백십])?)\s*[~\-–]\s*(\d+(?:[만천백십])?)/);
                    if (volumeMatch) {
                      return {
                        volume: volumeMatch[0],
                        competition: rowText.includes('낮음') ? '낮음' : rowText.includes('중간') ? '중간' : rowText.includes('높음') ? '높음' : '-'
                      };
                    }
                  }
                }
              }

              // 키워드가 있는 행을 못 찾은 경우, 첫 번째 데이터 행 시도
              for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td, [role="cell"], [role="gridcell"]'));
                if (cells.length > 0) {
                  for (const cell of cells) {
                    const cellText = cell.textContent || '';
                    const volumeMatch = cellText.match(/(\d+(?:[만천백십])?)\s*[~\-–]\s*(\d+(?:[만천백십])?)/);
                    if (volumeMatch && !volumeMatch[0].match(/^\d{3}[\-~]\d{3}$/)) {
                      return {
                        volume: volumeMatch[0],
                        competition: row.textContent?.includes('낮음') ? '낮음' : row.textContent?.includes('중간') ? '중간' : row.textContent?.includes('높음') ? '높음' : '-'
                      };
                    }
                  }
                }
              }

              return { volume: null, competition: '-' };
            }, keyword);

            if (tableData.volume) {
              searchVolume = tableData.volume;
              competition = tableData.competition;
            }
          } catch (error) {
            console.log(`      ⚠️ 데이터 추출 중 오류: ${error}`);
          }

          console.log(`      ✓ 검색량: ${searchVolume}`);
          console.log(`      ✓ 경쟁: ${competition}`);

          // STEP 2: Google 웹 검색 결과 수 확인
          console.log('  [2/2] Google 검색 결과 수 확인...');

          // 새 탭 열기
          const searchPage = await context.newPage();
          await searchPage.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ko`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
          await searchPage.waitForTimeout(3000);

          // 검색 결과 수 추출
          const searchText = await searchPage.textContent('body') || '';
          let googleResults = 0;

          // "약 XXX개" 패턴 찾기
          const resultPattern = /약\s+([\d,]+)개/;
          const resultMatch = searchText.match(resultPattern);
          if (resultMatch) {
            googleResults = parseInt(resultMatch[1].replace(/,/g, ''));
          }

          await searchPage.close();

          console.log(`      ✓ Google 검색 결과: ${googleResults.toLocaleString()}개`);

          // 블루오션 판단
          let isBlueOcean = false;
          let ratio = '-';

          if (searchVolume !== '데이터 없음' && googleResults > 0) {
            // 검색량을 숫자로 변환 (범위의 최소값 사용)
            const volumeNum = parseKoreanSearchVolume(searchVolume);

            if (volumeNum > 0) {
              const ratioValue = googleResults / volumeNum;
              ratio = ratioValue.toFixed(2);

              // 블루오션 기준: 검색량 대비 결과 수가 적을 때
              if (ratioValue < 50 && competition === '낮음') {
                isBlueOcean = true;
              }
            }
          }

          const analysis: KeywordAnalysis = {
            keyword,
            searchVolume,
            competition,
            googleResults,
            ratio,
            isBlueOcean
          };

          categoryResult.keywords.push(analysis);
          if (isBlueOcean) {
            categoryResult.blueOceanCount++;
            console.log(`      🌊 블루오션 발견!`);
          }

          console.log(`  ✅ "${keyword}" 분석 완료\n`);

        } catch (error) {
          console.log(`  ❌ "${keyword}" 분석 실패: ${error}`);
          categoryResult.keywords.push({
            keyword,
            searchVolume: '오류',
            competition: '-',
            googleResults: 0,
            ratio: '-',
            isBlueOcean: false
          });
        }

        await page.waitForTimeout(2000);
      }

      results.push(categoryResult);
      console.log(`\n✅ ${category.name} 카테고리 완료 (블루오션: ${categoryResult.blueOceanCount}개)`);
    }

    // 종합 보고서 생성
    console.log('\n' + '='.repeat(70));
    console.log('📝 블루오션 종합 보고서 생성 중...');
    console.log('='.repeat(70) + '\n');

    const markdown = generateBlueOceanReport(results);
    const reportPath = 'keyword-research/한국-블루오션키워드.md';

    fs.writeFileSync(reportPath, markdown, 'utf-8');

    console.log('========================================');
    console.log('✅ 블루오션 키워드 조사 완료!');
    console.log('========================================');
    console.log(`📄 보고서: ${reportPath}`);
    console.log(`🌊 블루오션 발견: ${results.reduce((sum, r) => sum + r.blueOceanCount, 0)}개`);
    console.log(`📊 총 조사: ${results.reduce((sum, r) => sum + r.keywords.length, 0)}개 키워드`);
    console.log('\n브라우저를 2분간 열어둡니다...\n');

    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.waitForTimeout(120000);
  } finally {
    await browser.close();
  }
}

function generateBlueOceanReport(results: CategoryAnalysis[]): string {
  const today = new Date().toISOString().split('T')[0];

  let md = `# 한국 시장 블루오션 키워드 조사 보고서\n\n`;
  md += `조사일: ${today}\n`;
  md += `조사 방법: Google Keyword Planner + Google 검색 결과 수 비교\n`;
  md += `블루오션 기준: 검색량 많음 + 검색 결과 적음 + 경쟁 낮음\n\n`;
  md += `---\n\n`;

  // 블루오션 키워드 요약
  md += `## 🌊 블루오션 키워드 발견\n\n`;

  const blueOceanKeywords = results.flatMap(r =>
    r.keywords.filter(k => k.isBlueOcean)
  );

  if (blueOceanKeywords.length > 0) {
    md += `**총 ${blueOceanKeywords.length}개 블루오션 키워드 발견!**\n\n`;
    md += `| 키워드 | 검색량 | Google 결과 수 | 비율 | 경쟁 |\n`;
    md += `|--------|--------|---------------|------|------|\n`;

    blueOceanKeywords.forEach(k => {
      md += `| **${k.keyword}** | ${k.searchVolume} | ${k.googleResults.toLocaleString()}개 | ${k.ratio} | ${k.competition} |\n`;
    });
  } else {
    md += `> ⚠️ 블루오션 키워드가 발견되지 않았습니다. 기준을 조정하거나 다른 카테고리를 조사하세요.\n`;
  }

  md += `\n---\n\n`;

  // 카테고리별 상세 분석
  md += `## 📊 카테고리별 상세 분석\n\n`;

  results.forEach((r, i) => {
    md += `### ${i + 1}. ${r.category}\n\n`;
    md += `**블루오션: ${r.blueOceanCount}/${r.keywords.length}개**\n\n`;
    md += `| 키워드 | 검색량 | Google 결과 | 비율 | 경쟁 | 평가 |\n`;
    md += `|--------|--------|-------------|------|------|------|\n`;

    r.keywords.forEach(k => {
      const status = k.isBlueOcean ? '🌊 블루오션' : '-';
      md += `| ${k.keyword} | ${k.searchVolume} | ${k.googleResults.toLocaleString()}개 | ${k.ratio} | ${k.competition} | ${status} |\n`;
    });

    md += `\n`;
  });

  md += `---\n\n`;

  // 분석 및 제안
  md += `## 💡 분석 및 제안\n\n`;
  md += `### 블루오션 판단 기준\n\n`;
  md += `1. **검색량**: 1천 이상\n`;
  md += `2. **Google 결과 수**: 검색량 대비 50배 이하\n`;
  md += `3. **경쟁도**: 낮음\n\n`;

  md += `### 다음 단계\n\n`;
  md += `- [ ] 블루오션 키워드의 앱스토어 경쟁 분석\n`;
  md += `- [ ] 비즈니스 모델 검토\n`;
  md += `- [ ] MVP 기획\n`;
  md += `- [ ] 개발 난이도 평가\n\n`;

  return md;
}

findBlueOceanKeywords();
