# 片付け iOS 앱 개발 요건서

> 작성일: 2025-12-25
> 플랫폼: iOS (Swift)
> 버전: MVP 1.0

---

## 1. 프로젝트 개요

### 1.1 앱 정보

| 항목 | 내용 |
|------|------|
| **앱 이름** | へらす (Herasu) - 가칭 |
| **컨셉** | "물건을 줄이고, 삶을 늘리는 앱" |
| **타겟** | 일본 20-40대, 미니멀리스트, 정리 희망자 |
| **플랫폼** | iOS 16.0+ |
| **언어** | 일본어 (ja) |

### 1.2 핵심 가치

```
1. 심플한 일일 정리 기록
2. 동기부여 (연속 일수, 뱃지)
3. 버림 분석 인사이트 (v2.0)
4. 프라이버시 중시 (SNS 최소화)
```

---

## 2. 기술 스택

### 2.1 iOS 개발

| 구분 | 기술 |
|------|------|
| **언어** | Swift 5.9+ |
| **UI** | SwiftUI |
| **최소 버전** | iOS 16.0 |
| **아키텍처** | MVVM + Clean Architecture |
| **의존성 관리** | Swift Package Manager |

### 2.2 백엔드

| 구분 | 기술 |
|------|------|
| **BaaS** | Supabase |
| **Database** | PostgreSQL |
| **Auth** | Supabase Auth (Apple Sign-In) |
| **Storage** | Supabase Storage (이미지) |
| **Edge Functions** | Deno (통계 계산) |

### 2.3 외부 서비스

| 서비스 | 용도 | 단계 |
|--------|------|------|
| **Apple Sign-In** | 인증 | MVP |
| **RevenueCat** | 구독 결제 | MVP |
| **Firebase Analytics** | 사용자 분석 | MVP |
| **Firebase Crashlytics** | 크래시 리포트 | MVP |
| **OpenAI API** | AI 분석 | v2.0 |

---

## 3. 기능 명세 (MVP)

### 3.1 기능 우선순위

| 우선순위 | 기능 | 설명 |
|----------|------|------|
| **P0** | 회원가입/로그인 | Apple Sign-In |
| **P0** | 일일 정리 기록 | 사진 + 카테고리 + 이유 |
| **P0** | 대시보드 | 연속 일수, 이번 달 통계 |
| **P0** | 기록 목록 | 타임라인, 캘린더 뷰 |
| **P1** | 리마인더 | 로컬 푸시 알림 |
| **P1** | 게이미피케이션 | 뱃지, 연속 보상 |
| **P1** | 설정 | 알림, 계정 관리 |
| **P2** | 프리미엄 | 구독 결제 |

### 3.2 기능 상세

#### 3.2.1 인증

```swift
// Apple Sign-In 필수
- Apple ID로 로그인
- 익명 사용 옵션 (로컬 저장만)
- 로그아웃
- 계정 삭제 (GDPR/APPI 준수)
```

**요구사항**:
- Apple Sign-In 필수 (App Store 가이드라인)
- 익명 모드: Supabase 없이 로컬 CoreData만 사용
- 계정 삭제 시 모든 데이터 완전 삭제

#### 3.2.2 일일 정리 기록

```
[기록 플로우]
1. 사진 촬영/선택 (선택)
2. 카테고리 선택 (필수)
3. 버린 이유 선택 (필수)
4. 처리 방법 선택 (필수)
5. 메모 입력 (선택)
6. 저장
```

**카테고리** (아이콘):
| 카테고리 | 일본어 | 아이콘 |
|---------|--------|--------|
| 의류 | 衣類 | 👕 |
| 서적 | 本・雑誌 | 📚 |
| 잡화 | 雑貨 | 🏠 |
| 가전 | 家電 | 📱 |
| 서류 | 書類 | 📄 |
| 기타 | その他 | 📦 |

**버린 이유**:
| 이유 | 일본어 |
|------|--------|
| 사용 안 함 | 使わなくなった |
| 고장/파손 | 壊れた |
| 유행 지남 | 流行遅れ |
| 충동구매 | 衝動買いだった |
| 중복 소유 | 重複している |
| 기타 | その他 |

**처리 방법**:
| 방법 | 일본어 |
|------|--------|
| 버림 | 捨てる |
| 판매 | 売る |
| 기부 | 寄付 |
| 재활용 | リサイクル |

#### 3.2.3 대시보드

```
┌─────────────────────────────────┐
│  🔥 連続 7日目！                │
│  今月 23個 片付け               │
│                                 │
│  [カテゴリ別 円グラフ]          │
│                                 │
│  最近の片付け                   │
│  ├─ 青いジーンズ (衣類) 12/24   │
│  ├─ 小説本 (本) 12/24          │
│  └─ マグカップ (雑貨) 12/23     │
└─────────────────────────────────┘
```

**표시 정보**:
- 연속 일수 (🔥 이모지)
- 이번 달 정리 개수
- 카테고리별 비율 (파이 차트)
- 최근 기록 (3-5개)

#### 3.2.4 기록 목록

**뷰 모드**:
1. **타임라인**: 날짜별 스크롤
2. **캘린더**: 월별 달력 (기록 있는 날 표시)
3. **갤러리**: 사진 그리드

**필터**:
- 카테고리별
- 기간별 (이번 주, 이번 달, 전체)

#### 3.2.5 게이미피케이션

**뱃지 시스템**:
| 뱃지 | 조건 | 아이콘 |
|------|------|--------|
| 첫 걸음 | 첫 기록 | 🌱 |
| 1주일 연속 | 7일 연속 | 🔥 |
| 1개월 연속 | 30일 연속 | ⭐ |
| 100개 달성 | 누적 100개 | 🏆 |
| 미니멀리스트 | 누적 365개 | 👑 |

**연속 일수**:
- 하루 1개 이상 기록 시 유지
- 자정(JST) 기준 리셋
- 놓친 경우 "부활" 기회 (프리미엄)

---

## 4. 화면 설계

### 4.1 화면 목록

| # | 화면 | 설명 |
|---|------|------|
| 1 | 스플래시 | 앱 로고 |
| 2 | 온보딩 | 앱 소개 (3페이지) |
| 3 | 로그인 | Apple Sign-In |
| 4 | 홈 (대시보드) | 메인 화면 |
| 5 | 기록 추가 | 정리 기록 입력 |
| 6 | 기록 목록 | 타임라인/캘린더 |
| 7 | 기록 상세 | 기록 보기/수정/삭제 |
| 8 | 뱃지 | 획득 뱃지 목록 |
| 9 | 통계 | 상세 통계 (v2.0) |
| 10 | 설정 | 알림, 계정, 프리미엄 |
| 11 | 프리미엄 | 구독 안내/결제 |

### 4.2 네비게이션 구조

```
TabBar
├── 홈 (대시보드)
├── 기록 목록
├── [+] 기록 추가 (모달)
├── 뱃지
└── 설정
```

### 4.3 주요 화면 와이어프레임

#### 홈 화면

```
┌─────────────────────────────────┐
│ へらす              [⚙️ 設定]   │
├─────────────────────────────────┤
│                                 │
│     🔥 連続 7日目！              │
│                                 │
│  ┌─────────────────────────┐   │
│  │   今月の片付け            │   │
│  │      23個                 │   │
│  │   [===グラフ===]          │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   [+ 今日の片付けを記録]  │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ─────────────────────────────  │
│  最近の片付け                   │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 📷  │ │ 📷  │ │ 📷  │      │
│  │ジーンズ││ 小説 ││マグカップ│    │
│  └─────┘ └─────┘ └─────┘      │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [➕] [🏅] [⚙️]       │
└─────────────────────────────────┘
```

#### 기록 추가 화면

```
┌─────────────────────────────────┐
│ [✕ 閉じる]    記録     [保存]   │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    [📷 写真を撮る]       │   │
│  │    [🖼️ アルバムから選ぶ]  │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  カテゴリ *                     │
│  [👕] [📚] [🏠] [📱] [📄] [📦] │
│                                 │
│  手放した理由 *                 │
│  [使わなくなった] [壊れた]      │
│  [流行遅れ] [衝動買い] [重複]   │
│                                 │
│  処理方法 *                     │
│  [捨てる] [売る] [寄付] [リサイクル] │
│                                 │
│  メモ (任意)                    │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 5. 데이터 모델

### 5.1 Supabase 스키마

```sql
-- 사용자
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_id TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  streak_count INTEGER DEFAULT 0,
  last_record_date DATE,
  settings JSONB DEFAULT '{}'
);

-- 정리 기록
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  disposal_method TEXT NOT NULL,
  memo TEXT,
  image_url TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뱃지
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- 인덱스
CREATE INDEX idx_records_user_date ON records(user_id, recorded_at DESC);
CREATE INDEX idx_records_user_category ON records(user_id, category);
```

### 5.2 로컬 저장 (CoreData) - 익명 모드

```swift
// Record Entity
@objc(RecordEntity)
public class RecordEntity: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var category: String
    @NSManaged public var reason: String
    @NSManaged public var disposalMethod: String
    @NSManaged public var memo: String?
    @NSManaged public var imageData: Data?
    @NSManaged public var recordedAt: Date
    @NSManaged public var createdAt: Date
}
```

### 5.3 Swift 모델

```swift
struct User: Codable, Identifiable {
    let id: UUID
    var appleId: String?
    var email: String?
    var displayName: String?
    var isPremium: Bool
    var premiumExpiresAt: Date?
    var streakCount: Int
    var lastRecordDate: Date?
}

struct Record: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let category: Category
    let reason: Reason
    let disposalMethod: DisposalMethod
    var memo: String?
    var imageUrl: String?
    let recordedAt: Date
    let createdAt: Date
}

enum Category: String, Codable, CaseIterable {
    case clothing = "clothing"
    case books = "books"
    case miscellaneous = "miscellaneous"
    case electronics = "electronics"
    case documents = "documents"
    case other = "other"

    var displayName: String {
        switch self {
        case .clothing: return "衣類"
        case .books: return "本・雑誌"
        case .miscellaneous: return "雑貨"
        case .electronics: return "家電"
        case .documents: return "書類"
        case .other: return "その他"
        }
    }

    var icon: String {
        switch self {
        case .clothing: return "👕"
        case .books: return "📚"
        case .miscellaneous: return "🏠"
        case .electronics: return "📱"
        case .documents: return "📄"
        case .other: return "📦"
        }
    }
}
```

---

## 6. API 설계

### 6.1 Supabase RPC Functions

```sql
-- 연속 일수 업데이트
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_streak INTEGER;
BEGIN
  SELECT last_record_date, streak_count INTO v_last_date, v_streak
  FROM users WHERE id = p_user_id;

  IF v_last_date = v_today - 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_last_date < v_today - 1 THEN
    v_streak := 1;
  END IF;

  UPDATE users
  SET streak_count = v_streak, last_record_date = v_today
  WHERE id = p_user_id;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- 월별 통계
CREATE OR REPLACE FUNCTION get_monthly_stats(p_user_id UUID, p_year INT, p_month INT)
RETURNS TABLE(category TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.category, COUNT(*) as count
  FROM records r
  WHERE r.user_id = p_user_id
    AND EXTRACT(YEAR FROM r.recorded_at) = p_year
    AND EXTRACT(MONTH FROM r.recorded_at) = p_month
  GROUP BY r.category;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Swift API Client

```swift
class SupabaseClient {
    static let shared = SupabaseClient()

    private let client: SupabaseClient

    // Auth
    func signInWithApple(idToken: String) async throws -> User
    func signOut() async throws
    func deleteAccount() async throws

    // Records
    func createRecord(_ record: Record) async throws -> Record
    func getRecords(from: Date, to: Date) async throws -> [Record]
    func deleteRecord(id: UUID) async throws

    // Stats
    func getMonthlyStats(year: Int, month: Int) async throws -> [CategoryStat]
    func updateStreak() async throws -> Int

    // Badges
    func getBadges() async throws -> [Badge]
    func checkAndAwardBadges() async throws -> [Badge]
}
```

---

## 7. 보안 요구사항

### 7.1 데이터 보호

| 항목 | 요구사항 |
|------|----------|
| **전송** | HTTPS/TLS 1.3 필수 |
| **저장** | Supabase RLS (Row Level Security) |
| **인증** | Apple Sign-In, JWT 토큰 |
| **이미지** | Signed URL (1시간 만료) |

### 7.2 Supabase RLS 정책

```sql
-- 사용자는 자신의 데이터만 접근
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own records" ON records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own badges" ON badges
  FOR SELECT USING (auth.uid() = user_id);
```

### 7.3 개인정보 보호 (APPI 준수)

| 항목 | 대응 |
|------|------|
| **프라이버시 정책** | 앱 내 + App Store 링크 |
| **데이터 수집 명시** | 앱 추적 투명성 (ATT) |
| **계정 삭제** | 설정에서 완전 삭제 가능 |
| **데이터 내보내기** | JSON 형식 다운로드 (v2.0) |

---

## 8. 결제 (RevenueCat)

### 8.1 구독 상품

| 상품 | 가격 | 기간 |
|------|------|------|
| **월간 프리미엄** | ¥280 | 1개월 |
| **연간 프리미엄** | ¥2,200 | 12개월 (35% 할인) |

### 8.2 프리미엄 기능

| 기능 | 무료 | 프리미엄 |
|------|------|----------|
| 일일 기록 | ✅ | ✅ |
| 연속 일수 | ✅ | ✅ |
| 기록 보관 | 30일 | **무제한** |
| 통계 | 기본 | **상세** |
| 뱃지 | ✅ | ✅ |
| 광고 | 있음 | **없음** |
| 연속 부활 | ❌ | **✅** |
| 클라우드 백업 | ❌ | **✅** |

### 8.3 RevenueCat 연동

```swift
import RevenueCat

class PurchaseManager {
    static let shared = PurchaseManager()

    func configure() {
        Purchases.configure(withAPIKey: "your_api_key")
    }

    func checkPremiumStatus() async -> Bool {
        let customerInfo = try? await Purchases.shared.customerInfo()
        return customerInfo?.entitlements["premium"]?.isActive ?? false
    }

    func purchase(package: Package) async throws {
        let result = try await Purchases.shared.purchase(package: package)
        // Handle result
    }

    func restorePurchases() async throws {
        let customerInfo = try await Purchases.shared.restorePurchases()
        // Handle restored purchases
    }
}
```

---

## 9. 테스트 요구사항

### 9.1 단위 테스트

| 대상 | 커버리지 목표 |
|------|-------------|
| ViewModel | 80% |
| UseCase | 90% |
| Repository | 70% |

### 9.2 UI 테스트

| 시나리오 | 설명 |
|---------|------|
| 온보딩 | 3페이지 완료 |
| 로그인 | Apple Sign-In 플로우 |
| 기록 추가 | 전체 플로우 |
| 기록 삭제 | 스와이프 삭제 |

### 9.3 성능 요구사항

| 항목 | 기준 |
|------|------|
| 앱 시작 시간 | < 2초 |
| 화면 전환 | < 0.3초 |
| 이미지 로딩 | < 1초 |
| 메모리 사용 | < 150MB |

---

## 10. 앱스토어 준비

### 10.1 필수 항목

| 항목 | 상태 |
|------|------|
| App Store Connect 계정 | 필요 |
| 앱 아이콘 (1024x1024) | 디자인 필요 |
| 스크린샷 (6.7", 6.5", 5.5") | 필요 |
| 프라이버시 정책 URL | 필요 |
| 앱 설명 (일본어) | 필요 |

### 10.2 앱 설명 (초안)

```
へらす - 毎日1つ、モノを手放すアプリ

【シンプルに記録】
写真を撮って、カテゴリと理由を選ぶだけ。
毎日の片付けを簡単に記録できます。

【続けるモチベーション】
連続日数カウンターとバッジで、
片付け習慣をゲーム感覚で続けられます。

【プライバシー重視】
SNS機能なし。あなただけの記録です。
匿名モードも選べます。

---
プレミアム (¥280/月)
・無制限の記録保存
・詳細な統計
・広告なし
・クラウドバックアップ
```

---

## 11. 개발 일정

### Phase 1: MVP (4주)

| 주차 | 작업 |
|------|------|
| **1주차** | 프로젝트 셋업, Supabase 연동, Auth |
| **2주차** | 기록 CRUD, 이미지 업로드 |
| **3주차** | 대시보드, 통계, 게이미피케이션 |
| **4주차** | 설정, 테스트, 버그 수정 |

### Phase 2: 출시 준비 (1주)

| 작업 | 설명 |
|------|------|
| TestFlight | 베타 테스트 |
| 앱스토어 제출 | 심사 대응 |
| 마케팅 자료 | 스크린샷, 설명 |

### Phase 3: v1.1 (2주)

| 작업 | 설명 |
|------|------|
| RevenueCat | 프리미엄 결제 |
| 피드백 반영 | 사용자 의견 |
| 버그 수정 | 크래시 대응 |

---

## 12. 리스크 및 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| App Store 심사 거절 | 중 | 가이드라인 준수, 프라이버시 정책 |
| Supabase 장애 | 낮음 | 로컬 캐시, 오프라인 모드 |
| 사용자 확보 어려움 | 중 | ASO 최적화, SNS 마케팅 |
| 리텐션 낮음 | 중 | 푸시 알림, 게이미피케이션 강화 |

---

## 부록: 체크리스트

### 개발 전 체크리스트

- [ ] Apple Developer 계정 ($99/년)
- [ ] Supabase 프로젝트 생성
- [ ] RevenueCat 계정 생성
- [ ] Firebase 프로젝트 생성
- [ ] 앱 아이콘 디자인
- [ ] 프라이버시 정책 페이지 작성

### 출시 전 체크리스트

- [ ] TestFlight 베타 테스트
- [ ] 크래시 리포트 확인
- [ ] 다크 모드 대응
- [ ] 다양한 기기 테스트 (iPhone SE ~ Pro Max)
- [ ] 스크린샷 준비
- [ ] 앱스토어 설명 작성
- [ ] 프라이버시 정책 URL 등록
