# 交換日記 iOS 앱 개발 요건서

> 작성일: 2025-12-25
> 플랫폼: iOS (Swift)
> 버전: MVP 1.0

---

## 1. 프로젝트 개요

### 1.1 앱 정보

| 항목 | 내용 |
|------|------|
| **앱 이름** | ずっと日記 (Zutto Nikki) - 가칭 |
| **컨셉** | "모든 관계를 위한 신뢰할 수 있는 교환일기" |
| **타겟** | 일본 10-30대, 커플, 가족, 친구 |
| **플랫폼** | iOS 16.0+ |
| **언어** | 일본어 (ja) |

### 1.2 핵심 가치

```
1. 데이터 영구 보증 (Shanfy와 정반대)
2. 다중 관계 지원 (커플+가족+친구)
3. 100% 푸시 알림
4. 프라이버시 중시
```

### 1.3 Shanfy 이탈자 타겟 메시지

```
"あなたの思い出、ずっと守ります"
(당신의 추억, 영원히 지킵니다)

❌ Shanfy: 갑작스런 삭제, 1,800엔 백업
✅ 우리: 영구 보관, 무료 백업, 투명한 운영
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
| **Realtime** | Supabase Realtime (읽음 확인) |
| **Push** | Apple Push Notification (APNs) |

### 2.3 외부 서비스

| 서비스 | 용도 | 단계 |
|--------|------|------|
| **Apple Sign-In** | 인증 | MVP |
| **APNs** | 푸시 알림 | MVP |
| **RevenueCat** | 구독 결제 | MVP |
| **Firebase Analytics** | 사용자 분석 | MVP |
| **Firebase Crashlytics** | 크래시 리포트 | MVP |

---

## 3. 기능 명세 (MVP)

### 3.1 기능 우선순위

| 우선순위 | 기능 | 설명 |
|----------|------|------|
| **P0** | 회원가입/로그인 | Apple Sign-In |
| **P0** | 일기장 생성 | 타입 선택, 초대 코드 |
| **P0** | 멤버 초대/참여 | 초대 링크/코드 |
| **P0** | 일기 작성 | 텍스트 + 사진 |
| **P0** | 푸시 알림 | 새 글 알림 |
| **P0** | 읽음 확인 | 실시간 표시 |
| **P1** | 질문 기능 | 오늘의 질문 |
| **P1** | 리마인더 | 작성 알림 |
| **P1** | 내보내기 | PDF 저장 |
| **P2** | 프리미엄 | 구독 결제 |

### 3.2 기능 상세

#### 3.2.1 인증

```swift
// Apple Sign-In 필수
- Apple ID로 로그인
- 프로필 설정 (닉네임, 프로필 사진)
- 로그아웃
- 계정 삭제 (모든 데이터 완전 삭제)
```

**요구사항**:
- Apple Sign-In 필수
- 계정 삭제 시 해당 사용자의 일기만 삭제 (일기장은 유지)
- APPI 준수 (데이터 삭제 권리)

#### 3.2.2 일기장 타입

| 타입 | 일본어 | 최대 인원 | 아이콘 |
|------|--------|----------|--------|
| 커플 | カップル | 2명 | 💕 |
| 가족 | 家族 | 10명 | 👨‍👩‍👧‍👦 |
| 친구 | 友達 | 10명 | 👫 |
| 익명 | 匿名 | 2명 | 🔗 |

#### 3.2.3 일기장 생성/참여 플로우

```
[생성 플로우]
1. 일기장 타입 선택
2. 일기장 이름 입력
3. 초대 코드/링크 생성
4. 상대방에게 공유

[참여 플로우]
1. 초대 코드 입력 또는 링크 클릭
2. 일기장 참여 확인
3. 참여 완료
```

#### 3.2.4 일기 작성

```
┌─────────────────────────────────┐
│ [✕ 閉じる]    日記     [投稿]   │
├─────────────────────────────────┤
│                                 │
│  2024年12月25日                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │  今日の質問 (任意)       │   │
│  │  「今年一番嬉しかった    │   │
│  │   ことは？」             │   │
│  │  [この質問で書く]        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   日記を書く...          │   │
│  │                         │   │
│  │                         │   │
│  │                         │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [📷 写真] [😊 スタンプ]        │
│                                 │
└─────────────────────────────────┘
```

**기능**:
- 텍스트 입력 (필수)
- 사진 첨부 (최대 4장)
- 오늘의 질문 (선택)
- 스탬프/이모지 (v1.1)

#### 3.2.5 일기장 화면

```
┌─────────────────────────────────┐
│ [←]   💕 二人の日記    [⚙️]    │
├─────────────────────────────────┤
│                                 │
│  ── 2024年12月25日 ──          │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👤 みさき                │   │
│  │ 今日はクリスマス！       │   │
│  │ 一緒にケーキ食べたね🎂   │   │
│  │ [📷 写真]               │   │
│  │ 23:30 ✓ 既読            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👤 ゆうき (私)           │   │
│  │ 最高のクリスマスだった！  │   │
│  │ 来年も一緒にいようね💕   │   │
│  │ 23:45                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ── 2024年12月24日 ──          │
│  ...                            │
│                                 │
├─────────────────────────────────┤
│        [今日の日記を書く]        │
└─────────────────────────────────┘
```

#### 3.2.6 푸시 알림

| 알림 유형 | 트리거 | 내용 |
|---------|--------|------|
| 새 일기 | 상대방 일기 작성 | "○○さんが日記を書きました" |
| 읽음 | 상대방이 읽음 | (알림 없음, 앱 내 표시만) |
| 리마인더 | 설정 시간 | "今日の日記を書きましょう" |

**푸시 알림 필수 구현**:
- APNs 연동
- 백그라운드 푸시
- 알림 권한 요청
- 알림 설정 (ON/OFF)

#### 3.2.7 데이터 안전 센터

```
┌─────────────────────────────────┐
│  🔒 データ安全センター           │
├─────────────────────────────────┤
│                                 │
│  ✅ 自動バックアップ: ON        │
│     最終: 2024-12-25 23:59     │
│                                 │
│  📤 エクスポート                │
│     [PDFで保存]                 │
│     [画像で保存]                │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  📜 私たちの約束                │
│                                 │
│  • データは絶対に削除しません   │
│  • サービス終了時は6ヶ月前に    │
│    お知らせします               │
│  • 終了後もダウンロード可能     │
│                                 │
└─────────────────────────────────┘
```

---

## 4. 화면 설계

### 4.1 화면 목록

| # | 화면 | 설명 |
|---|------|------|
| 1 | 스플래시 | 앱 로고 |
| 2 | 온보딩 | 앱 소개 + 데이터 안전 강조 |
| 3 | 로그인 | Apple Sign-In |
| 4 | 프로필 설정 | 닉네임, 사진 |
| 5 | 홈 | 일기장 목록 |
| 6 | 일기장 생성 | 타입 선택, 이름 |
| 7 | 초대 | 코드/링크 공유 |
| 8 | 일기장 상세 | 일기 타임라인 |
| 9 | 일기 작성 | 글 작성 |
| 10 | 일기 상세 | 글 보기 |
| 11 | 캘린더 | 월별 보기 |
| 12 | 설정 | 알림, 계정, 데이터 |
| 13 | 데이터 안전 센터 | 백업, 내보내기 |
| 14 | 프리미엄 | 구독 안내 |

### 4.2 네비게이션 구조

```
홈 (일기장 목록)
├── 일기장 생성 (모달)
│   └── 초대 공유
├── 일기장 상세
│   ├── 일기 작성 (모달)
│   ├── 일기 상세
│   ├── 캘린더
│   └── 설정 (일기장)
└── 설정 (앱)
    ├── 프로필
    ├── 알림
    ├── 데이터 안전 센터
    ├── 프리미엄
    └── 계정
```

### 4.3 주요 화면 와이어프레임

#### 홈 화면

```
┌─────────────────────────────────┐
│ ずっと日記          [+] [⚙️]   │
├─────────────────────────────────┤
│                                 │
│  マイ日記帳                     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 💕 みさきとの日記        │   │
│  │ 最後の日記: 今日 23:30   │   │
│  │ 🔴 新しい日記 1件        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👨‍👩‍👧 家族の日記           │   │
│  │ 最後の日記: 昨日         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👫 高校の友達            │   │
│  │ 最後の日記: 3日前        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│    + 新しい日記帳を作る         │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
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
  apple_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  push_token TEXT,
  settings JSONB DEFAULT '{
    "notification_new_entry": true,
    "notification_reminder": true,
    "reminder_time": "21:00"
  }'
);

-- 일기장
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('couple', 'family', 'friends', 'anonymous')),
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

-- 일기장 멤버
CREATE TABLE diary_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(diary_id, user_id)
);

-- 일기 항목
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  question TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 읽음 확인
CREATE TABLE entry_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id, user_id)
);

-- 인덱스
CREATE INDEX idx_entries_diary_created ON entries(diary_id, created_at DESC);
CREATE INDEX idx_diary_members_user ON diary_members(user_id);
CREATE INDEX idx_entry_reads_entry ON entry_reads(entry_id);

-- 초대 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Swift 모델

```swift
struct User: Codable, Identifiable {
    let id: UUID
    let appleId: String
    var email: String?
    var displayName: String
    var profileImageUrl: String?
    var isPremium: Bool
    var pushToken: String?
    var settings: UserSettings
}

struct UserSettings: Codable {
    var notificationNewEntry: Bool
    var notificationReminder: Bool
    var reminderTime: String
}

struct Diary: Codable, Identifiable {
    let id: UUID
    var name: String
    let type: DiaryType
    let inviteCode: String
    let createdBy: UUID
    let createdAt: Date
    var members: [DiaryMember]?
}

enum DiaryType: String, Codable, CaseIterable {
    case couple = "couple"
    case family = "family"
    case friends = "friends"
    case anonymous = "anonymous"

    var displayName: String {
        switch self {
        case .couple: return "カップル"
        case .family: return "家族"
        case .friends: return "友達"
        case .anonymous: return "匿名"
        }
    }

    var icon: String {
        switch self {
        case .couple: return "💕"
        case .family: return "👨‍👩‍👧‍👦"
        case .friends: return "👫"
        case .anonymous: return "🔗"
        }
    }

    var maxMembers: Int {
        switch self {
        case .couple, .anonymous: return 2
        case .family, .friends: return 10
        }
    }
}

struct Entry: Codable, Identifiable {
    let id: UUID
    let diaryId: UUID
    let userId: UUID?
    var content: String
    var question: String?
    var images: [String]
    let createdAt: Date
    var reads: [EntryRead]?
    var author: User?
}

struct EntryRead: Codable, Identifiable {
    let id: UUID
    let entryId: UUID
    let userId: UUID
    let readAt: Date
}
```

---

## 6. API 설계

### 6.1 Supabase RPC Functions

```sql
-- 일기장 참여
CREATE OR REPLACE FUNCTION join_diary(p_invite_code TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_diary_id UUID;
  v_member_count INT;
  v_max_members INT;
BEGIN
  -- 일기장 찾기
  SELECT id INTO v_diary_id FROM diaries WHERE invite_code = p_invite_code;
  IF v_diary_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- 멤버 수 확인
  SELECT COUNT(*) INTO v_member_count FROM diary_members WHERE diary_id = v_diary_id;
  SELECT CASE type
    WHEN 'couple' THEN 2
    WHEN 'anonymous' THEN 2
    ELSE 10
  END INTO v_max_members FROM diaries WHERE id = v_diary_id;

  IF v_member_count >= v_max_members THEN
    RAISE EXCEPTION 'Diary is full';
  END IF;

  -- 멤버 추가
  INSERT INTO diary_members (diary_id, user_id, role)
  VALUES (v_diary_id, p_user_id, 'member')
  ON CONFLICT (diary_id, user_id) DO NOTHING;

  RETURN v_diary_id;
END;
$$ LANGUAGE plpgsql;

-- 읽음 처리
CREATE OR REPLACE FUNCTION mark_as_read(p_entry_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO entry_reads (entry_id, user_id)
  VALUES (p_entry_id, p_user_id)
  ON CONFLICT (entry_id, user_id) DO UPDATE SET read_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Realtime 구독

```swift
// 새 일기 실시간 수신
func subscribeToNewEntries(diaryId: UUID) {
    supabase.realtime
        .channel("entries:\(diaryId)")
        .on("INSERT", filter: "diary_id=eq.\(diaryId)") { payload in
            // 새 일기 처리
            self.handleNewEntry(payload)
        }
        .subscribe()
}

// 읽음 확인 실시간 수신
func subscribeToReads(entryId: UUID) {
    supabase.realtime
        .channel("reads:\(entryId)")
        .on("INSERT", filter: "entry_id=eq.\(entryId)") { payload in
            // 읽음 표시 업데이트
            self.handleReadStatus(payload)
        }
        .subscribe()
}
```

### 6.3 Push Notification (APNs)

```swift
// Supabase Edge Function으로 푸시 발송
// supabase/functions/send-push/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { entry_id, diary_id, author_name } = await req.json()

  // 해당 일기장의 다른 멤버들 조회
  const { data: members } = await supabase
    .from('diary_members')
    .select('user_id, users(push_token, settings)')
    .eq('diary_id', diary_id)
    .neq('user_id', author_id)

  // APNs로 푸시 발송
  for (const member of members) {
    if (member.users.push_token && member.users.settings.notification_new_entry) {
      await sendAPNs(member.users.push_token, {
        title: "新しい日記",
        body: `${author_name}さんが日記を書きました`,
        data: { diary_id, entry_id }
      })
    }
  }

  return new Response(JSON.stringify({ success: true }))
})
```

---

## 7. 보안 요구사항

### 7.1 데이터 보호

| 항목 | 요구사항 |
|------|----------|
| **전송** | HTTPS/TLS 1.3 필수 |
| **저장** | Supabase RLS |
| **인증** | Apple Sign-In, JWT |
| **이미지** | Signed URL (1시간 만료) |
| **암호화** | AES-256 (v2.0) |

### 7.2 Supabase RLS 정책

```sql
-- 사용자는 자신의 데이터만 수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 일기장은 멤버만 접근
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view diary" ON diaries
  FOR SELECT USING (
    id IN (SELECT diary_id FROM diary_members WHERE user_id = auth.uid())
  );

-- 일기는 해당 일기장 멤버만 접근
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view entries" ON entries
  FOR SELECT USING (
    diary_id IN (SELECT diary_id FROM diary_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create entries in their diaries" ON entries
  FOR INSERT WITH CHECK (
    diary_id IN (SELECT diary_id FROM diary_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );
```

### 7.3 개인정보 보호 (APPI 준수)

| 항목 | 대응 |
|------|------|
| **프라이버시 정책** | 앱 내 + App Store |
| **데이터 수집 명시** | 온보딩에서 설명 |
| **계정 삭제** | 설정에서 완전 삭제 |
| **데이터 내보내기** | PDF/이미지 내보내기 |
| **제3자 제공** | 없음 (명시) |

### 7.4 앱 잠금

```swift
// Face ID / Touch ID
- 앱 잠금 옵션 (설정)
- 백그라운드 복귀 시 인증
- 스크린샷 방지 옵션 (프리미엄)
```

---

## 8. 결제 (RevenueCat)

### 8.1 구독 상품

| 상품 | 가격 | 기간 |
|------|------|------|
| **월간 프리미엄** | ¥380 | 1개월 |
| **커플 플랜** | ¥580 | 1개월 (2명) |
| **연간 프리미엄** | ¥2,980 | 12개월 (35% 할인) |

### 8.2 프리미엄 기능

| 기능 | 무료 | 프리미엄 |
|------|------|----------|
| 일기장 | 1개 | **무제한** |
| 일기 작성 | ✅ | ✅ |
| 푸시 알림 | ✅ | ✅ |
| 자동 백업 | ✅ | ✅ |
| 사진 첨부 | 1장 | **4장** |
| PDF 내보내기 | ❌ | **✅** |
| 앱 잠금 | ❌ | **✅** |
| 광고 | 있음 | **없음** |
| 테마 | 기본 | **프리미엄** |

---

## 9. 테스트 요구사항

### 9.1 단위 테스트

| 대상 | 커버리지 목표 |
|------|-------------|
| ViewModel | 80% |
| UseCase | 90% |
| Repository | 70% |

### 9.2 통합 테스트

| 시나리오 | 설명 |
|---------|------|
| 일기장 생성 → 초대 → 참여 | 전체 플로우 |
| 일기 작성 → 푸시 → 읽음 | 실시간 동작 |
| 로그인 → 삭제 | 계정 플로우 |

### 9.3 푸시 알림 테스트

- 포그라운드 수신
- 백그라운드 수신
- 알림 탭 → 해당 일기 이동
- 알림 OFF 시 미수신

---

## 10. 앱스토어 준비

### 10.1 앱 설명 (초안)

```
ずっと日記 - 大切な人との交換日記

【思い出を、ずっと守ります】
データは絶対に削除しません。
あなたの大切な日記を永久に保存します。

【カップル・家族・友達、みんなで】
💕 カップル日記
👨‍👩‍👧‍👦 家族日記
👫 友達グループ

【シンプルで使いやすい】
・毎日の質問で書きやすい
・新しい日記はすぐ通知
・既読もわかる

【安心のプライバシー】
・Face ID/Touch IDでロック
・自動バックアップ
・PDFエクスポート

---
プレミアム (¥380/月)
・無制限の日記帳
・写真4枚まで
・広告なし
・プレミアムテーマ
```

---

## 11. 개발 일정

### Phase 1: MVP (5주)

| 주차 | 작업 |
|------|------|
| **1주차** | 프로젝트 셋업, Supabase, Auth |
| **2주차** | 일기장 CRUD, 초대 시스템 |
| **3주차** | 일기 CRUD, 이미지 업로드 |
| **4주차** | 푸시 알림, 읽음 확인 (Realtime) |
| **5주차** | 설정, 테스트, 버그 수정 |

### Phase 2: 출시 준비 (1주)

| 작업 | 설명 |
|------|------|
| TestFlight | 베타 테스트 |
| 앱스토어 제출 | 심사 |
| ASO | "Shanfy 代わり" 키워드 |

### Phase 3: v1.1 (2주)

| 작업 | 설명 |
|------|------|
| RevenueCat | 프리미엄 |
| PDF 내보내기 | 데이터 안전 |
| 피드백 반영 | |

---

## 12. Shanfy 이탈자 확보 전략

### 12.1 ASO 키워드

```
- 交換日記 アプリ
- Shanfy 代わり
- カップル 日記
- 家族 日記
- データ 安全
```

### 12.2 마케팅 메시지

```
❌ "また消されるかも..."
✅ "ずっと日記なら、ずっと安心"

私たちの約束:
• データは絶対に削除しません
• サービス終了時は6ヶ月前にお知らせ
• 終了後もダウンロード可能
```

### 12.3 SNS 타겟팅

- Twitter: "Shanfy" 언급 사용자
- Instagram: 교환일기 해시태그
- App Store: 경쟁사 리뷰 모니터링

---

## 부록: 체크리스트

### 개발 전 체크리스트

- [ ] Apple Developer 계정
- [ ] Supabase 프로젝트
- [ ] APNs 인증서 설정
- [ ] RevenueCat 계정
- [ ] Firebase 프로젝트
- [ ] 프라이버시 정책 페이지

### 출시 전 체크리스트

- [ ] 푸시 알림 테스트 (실기기)
- [ ] Realtime 테스트
- [ ] TestFlight 베타
- [ ] 다양한 기기 테스트
- [ ] 스크린샷 준비
- [ ] "데이터 영구 보증" 명시
