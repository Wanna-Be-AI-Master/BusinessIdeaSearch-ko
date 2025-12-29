import { Page, BrowserContext } from 'playwright';

// 상수 정의
export const CONSTANTS = {
  TIMEOUTS: {
    LOGIN_WAIT: 60000,
    PAGE_LOAD: 60000,
    ELEMENT_VISIBLE: 3000,
    RESULTS_LOAD: 15000,
    TABLE_LOAD: 5000,
    SHORT_WAIT: 1000,
    MEDIUM_WAIT: 2000,
    LONG_WAIT: 3000,
  },
  SELECTORS: {
    DISCOVER_BUTTON: 'text=새 키워드 찾기',
    KEYWORD_INPUT: 'input[placeholder*="배달"]',
    RESULTS_BUTTON: 'button:has-text("결과 보기")',
    TABLE_ROWS: 'tr, [role="row"]',
    TABLE_CELLS: 'td, th, [role="cell"], [role="gridcell"]',
  },
  URLS: {
    KEYWORD_PLANNER_HOME: 'https://ads.google.com/aw/keywordplanner/home',
    GOOGLE_SEARCH: (keyword: string) =>
      `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ko`,
  },
  BLUE_OCEAN: {
    RATIO_THRESHOLD: 50,
    MIN_SEARCH_VOLUME: 1000,
  },
};

// 한국어 검색량 문자열을 숫자로 변환
export function parseKoreanSearchVolume(volumeStr: string): number {
  const multipliers: Record<string, number> = {
    '만': 10000,
    '천': 1000,
    '백': 100,
    '십': 10,
  };

  const parts = volumeStr.split(/[~\-–]/);
  if (parts.length === 0) return 0;

  const firstPart = parts[0].trim();

  for (const [unit, multiplier] of Object.entries(multipliers)) {
    if (firstPart.includes(unit)) {
      const num = parseInt(firstPart.replace(unit, ''));
      return isNaN(num) ? 0 : num * multiplier;
    }
  }

  const num = parseInt(firstPart);
  return isNaN(num) ? 0 : num;
}

// Keyword Planner에서 키워드 조사
export async function searchKeywordInPlanner(
  page: Page,
  keyword: string
): Promise<void> {
  const { SELECTORS, TIMEOUTS, URLS } = CONSTANTS;

  // Keyword Planner 홈으로 이동
  await page.goto(URLS.KEYWORD_PLANNER_HOME, {
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.PAGE_LOAD,
  });
  await page.waitForTimeout(TIMEOUTS.MEDIUM_WAIT);

  // "새 키워드 찾기" 클릭
  const discoverBtn = page.locator(SELECTORS.DISCOVER_BUTTON).first();
  if (await discoverBtn.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })) {
    await discoverBtn.click();
    await page.waitForTimeout(TIMEOUTS.LONG_WAIT);
  }

  // 키워드 입력
  const input = page.locator(SELECTORS.KEYWORD_INPUT).first();
  if (await input.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })) {
    await input.click();
    await input.clear();
    await input.fill(keyword);
    await page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  // "결과 보기" 클릭
  const resultBtn = page.locator(SELECTORS.RESULTS_BUTTON).first();
  if (await resultBtn.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })) {
    await resultBtn.click();
    await page.waitForTimeout(TIMEOUTS.RESULTS_LOAD);
  }
}

// 페이지에서 검색량 데이터 추출
export async function extractSearchVolume(
  page: Page,
  keyword: string
): Promise<{ volume: string; competition: string }> {
  await page.waitForTimeout(CONSTANTS.TIMEOUTS.TABLE_LOAD);

  const tableData = await page.evaluate((kw) => {
    const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
    const volumePattern = /(\d+(?:[만천백십])?)\s*[~\-–]\s*(\d+(?:[만천백십])?)/;

    // 키워드가 포함된 행에서 찾기
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td, th, [role="cell"], [role="gridcell"]'));
      const rowText = row.textContent || '';

      if (rowText.includes(kw)) {
        for (const cell of cells) {
          const cellText = cell.textContent || '';
          const volumeMatch = cellText.match(volumePattern);
          if (volumeMatch) {
            return {
              volume: volumeMatch[0],
              competition: rowText.includes('낮음') ? '낮음' :
                          rowText.includes('중간') ? '중간' :
                          rowText.includes('높음') ? '높음' : '-'
            };
          }
        }
      }
    }

    // 첫 번째 데이터 행에서 찾기
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td, [role="cell"], [role="gridcell"]'));
      if (cells.length > 0) {
        for (const cell of cells) {
          const cellText = cell.textContent || '';
          const volumeMatch = cellText.match(volumePattern);
          if (volumeMatch && !volumeMatch[0].match(/^\d{3}[\-~]\d{3}$/)) {
            return {
              volume: volumeMatch[0],
              competition: row.textContent?.includes('낮음') ? '낮음' :
                          row.textContent?.includes('중간') ? '중간' :
                          row.textContent?.includes('높음') ? '높음' : '-'
            };
          }
        }
      }
    }

    return { volume: null, competition: '-' };
  }, keyword);

  return {
    volume: tableData.volume || '데이터 없음',
    competition: tableData.competition
  };
}

// Google 검색 결과 수 추출
export async function getGoogleResultsCount(
  context: BrowserContext,
  keyword: string
): Promise<number> {
  const searchPage = await context.newPage();

  try {
    await searchPage.goto(CONSTANTS.URLS.GOOGLE_SEARCH(keyword), {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await searchPage.waitForTimeout(CONSTANTS.TIMEOUTS.LONG_WAIT);

    const searchText = await searchPage.textContent('body') || '';
    const resultPattern = /약\s+([\d,]+)개/;
    const resultMatch = searchText.match(resultPattern);

    if (resultMatch) {
      return parseInt(resultMatch[1].replace(/,/g, ''));
    }
    return 0;
  } finally {
    await searchPage.close();
  }
}

// 블루오션 판단
export function isBlueOcean(
  searchVolume: string,
  googleResults: number,
  competition: string
): { isBlueOcean: boolean; ratio: string } {
  const { RATIO_THRESHOLD } = CONSTANTS.BLUE_OCEAN;

  if (searchVolume === '데이터 없음' || googleResults === 0) {
    return { isBlueOcean: false, ratio: '-' };
  }

  const volumeNum = parseKoreanSearchVolume(searchVolume);
  if (volumeNum === 0) {
    return { isBlueOcean: false, ratio: '-' };
  }

  const ratioValue = googleResults / volumeNum;
  const ratio = ratioValue.toFixed(2);

  const blueOcean = ratioValue < RATIO_THRESHOLD && competition === '낮음';

  return { isBlueOcean: blueOcean, ratio };
}
