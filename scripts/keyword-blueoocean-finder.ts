import { chromium } from 'playwright';
import * as fs from 'fs';
import {
  CONSTANTS,
  searchKeywordInPlanner,
  extractSearchVolume,
  getGoogleResultsCount,
  isBlueOcean,
} from './utils/keyword-utils';

interface KeywordAnalysis {
  keyword: string;
  searchVolume: string;
  competition: string;
  googleResults: number;
  ratio: string;
  isBlueOcean: boolean;
}

interface CategoryAnalysis {
  category: string;
  mainKeyword: string;
  keywords: KeywordAnalysis[];
  blueOceanCount: number;
}

// 카테고리 정의
const CATEGORIES = [
  { name: '다이어트', keywords: ['다이어트', '다이어트 앱', '다이어트 식단'] },
  { name: '재테크', keywords: ['재테크', '재테크 앱', '주식 공부'] },
  { name: '이직', keywords: ['이직', '이직 준비', '이직 사이트'] },
  { name: '육아', keywords: ['육아', '육아 앱', '육아 일기'] },
  { name: '영어', keywords: ['영어 공부', '영어 공부 앱', '영어 회화'] },
  { name: '운동', keywords: ['홈트레이닝', '운동 기록', '운동 앱'] },
  { name: '가계부', keywords: ['가계부', '가계부 앱', '지출 관리'] },
  { name: '습관', keywords: ['습관 만들기', '습관 트래커', '루틴 관리'] },
];

// 키워드 분석
async function analyzeKeyword(
  page: any,
  context: any,
  keyword: string
): Promise<KeywordAnalysis> {
  console.log(`\n📌 "${keyword}" 분석 중...`);
  console.log('  [1/2] Keyword Planner 조사...');

  let searchVolume = '데이터 없음';
  let competition = '-';
  let googleResults = 0;

  try {
    // Keyword Planner에서 검색
    await searchKeywordInPlanner(page, keyword);

    // 검색량 데이터 추출
    const volumeData = await extractSearchVolume(page, keyword);
    searchVolume = volumeData.volume;
    competition = volumeData.competition;

    console.log(`      ✓ 검색량: ${searchVolume}`);
    console.log(`      ✓ 경쟁: ${competition}`);
  } catch (error) {
    console.log(`      ⚠️ Keyword Planner 조사 실패: ${error}`);
  }

  try {
    // Google 검색 결과 수 확인
    console.log('  [2/2] Google 검색 결과 수 확인...');
    googleResults = await getGoogleResultsCount(context, keyword);
    console.log(`      ✓ Google 검색 결과: ${googleResults.toLocaleString()}개`);
  } catch (error) {
    console.log(`  ❌ "${keyword}" 분석 실패: ${error}`);
  }

  // 블루오션 판단
  const blueOceanResult = isBlueOcean(searchVolume, googleResults, competition);

  if (blueOceanResult.isBlueOcean) {
    console.log('      🌊 블루오션 발견!');
  }

  console.log(`  ✅ "${keyword}" 분석 완료\n`);

  return {
    keyword,
    searchVolume,
    competition,
    googleResults,
    ratio: blueOceanResult.ratio,
    isBlueOcean: blueOceanResult.isBlueOcean,
  };
}

// 카테고리 분석
async function analyzeCategory(
  page: any,
  context: any,
  category: typeof CATEGORIES[0],
  index: number,
  total: number
): Promise<CategoryAnalysis> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎯 [${index + 1}/${total}] ${category.name} 카테고리 분석 중...`);
  console.log('='.repeat(70));

  const categoryResult: CategoryAnalysis = {
    category: category.name,
    mainKeyword: category.keywords[0],
    keywords: [],
    blueOceanCount: 0,
  };

  for (const keyword of category.keywords) {
    const analysis = await analyzeKeyword(page, context, keyword);
    categoryResult.keywords.push(analysis);

    if (analysis.isBlueOcean) {
      categoryResult.blueOceanCount++;
    }

    await page.waitForTimeout(CONSTANTS.TIMEOUTS.MEDIUM_WAIT);
  }

  console.log(`\n✅ ${category.name} 카테고리 완료 (블루오션: ${categoryResult.blueOceanCount}개)`);
  return categoryResult;
}

// 보고서 생성
function generateReport(results: CategoryAnalysis[]): string {
  const today = new Date().toISOString().split('T')[0];
  const blueOceanKeywords = results.flatMap(r => r.keywords.filter(k => k.isBlueOcean));

  let md = `# 한국 시장 블루오션 키워드 조사 보고서\n\n`;
  md += `조사일: ${today}\n`;
  md += `조사 방법: Google Keyword Planner + Google 검색 결과 수 비교\n`;
  md += `블루오션 기준: 검색량 많음 + 검색 결과 적음 + 경쟁 낮음\n\n`;
  md += `---\n\n`;

  // 블루오션 키워드 요약
  md += `## 🌊 블루오션 키워드 발견\n\n`;

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
  md += `2. **Google 결과 수**: 검색량 대비 ${CONSTANTS.BLUE_OCEAN.RATIO_THRESHOLD}배 이하\n`;
  md += `3. **경쟁도**: 낮음\n\n`;

  md += `### 다음 단계\n\n`;
  md += `- [ ] 블루오션 키워드의 앱스토어 경쟁 분석\n`;
  md += `- [ ] 비즈니스 모델 검토\n`;
  md += `- [ ] MVP 기획\n`;
  md += `- [ ] 개발 난이도 평가\n\n`;

  return md;
}

// 메인 함수
async function main() {
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
      '--no-default-browser-check',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
  });

  const page = await context.newPage();
  const results: CategoryAnalysis[] = [];

  try {
    // Google Ads 로그인
    console.log('📍 Google Ads 계정으로 이동 중...');
    await page.goto(
      'https://ads.google.com/aw/content?ocid=7903909664&workspaceId=0&euid=1588983262&__u=7185699438&uscid=7903909664&__c=7034824736&authuser=1&subid=kr-ko-awhp-g-aw-c-home-signin-bgc%21o2-ahpm-0000000192-0000000001',
      {
        waitUntil: 'domcontentloaded',
        timeout: CONSTANTS.TIMEOUTS.PAGE_LOAD,
      }
    );

    console.log('\n========================================');
    console.log('✋ Google 계정 로그인을 완료해주세요');
    console.log('로그인 후 60초 대기합니다...');
    console.log('========================================\n');

    await page.waitForTimeout(CONSTANTS.TIMEOUTS.LOGIN_WAIT);

    // 각 카테고리 분석
    for (let i = 0; i < CATEGORIES.length; i++) {
      const categoryResult = await analyzeCategory(
        page,
        context,
        CATEGORIES[i],
        i,
        CATEGORIES.length
      );
      results.push(categoryResult);
    }

    // 보고서 생성
    console.log('\n' + '='.repeat(70));
    console.log('📝 블루오션 종합 보고서 생성 중...');
    console.log('='.repeat(70) + '\n');

    const markdown = generateReport(results);
    const reportPath = 'keyword-research/한국-블루오션키워드.md';

    fs.writeFileSync(reportPath, markdown, 'utf-8');

    const totalBlueOcean = results.reduce((sum, r) => sum + r.blueOceanCount, 0);
    const totalKeywords = results.reduce((sum, r) => sum + r.keywords.length, 0);

    console.log('========================================');
    console.log('✅ 블루오션 키워드 조사 완료!');
    console.log('========================================');
    console.log(`📄 보고서: ${reportPath}`);
    console.log(`🌊 블루오션 발견: ${totalBlueOcean}개`);
    console.log(`📊 총 조사: ${totalKeywords}개 키워드`);
    console.log('\n브라우저를 2분간 열어둡니다...\n');

    await page.waitForTimeout(120000);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.waitForTimeout(120000);
  } finally {
    await browser.close();
  }
}

main();
