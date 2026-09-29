# 팀 협업 워크플로우

Owner → Driver → Reviewer 순환 구조로 작업이 진행됩니다.

---

## 전체 흐름

```
Owner (방향 설정)
  ↓
Driver (구현 실행)
  ↓
Reviewer (품질 검토)
  ↓
승인 → 다음 단계
반려 → Driver 재작업 (필요시 Owner 재확인)
```

---

## 단계별 작업

### 1단계 - Owner: 요구사항 정의
- Spec 세션을 열고 Requirements 작성
- "무엇을, 왜 만드는가"를 명확히 기술
- Driver에게 작업 시작 신호 전달

### 2단계 - Driver: 설계 및 구현
- Spec의 Design & Tasks 단계 실행
- Kiro에게 구체적 작업 지시
- 구현 완료 후 Reviewer에게 검토 요청

### 3단계 - Reviewer: 품질 검토
- Supervised 모드로 변경사항 hunk 단위 검토
- 요구사항 충족 여부 확인
- **승인:** 다음 단계 진행
- **반려:** 구체적 피드백과 함께 Driver에게 반환

---

## Kiro 세션 타입 활용

| 상황 | 세션 타입 |
|------|----------|
| 요구사항 정리, 설계 논의 | Vibe (대화형) |
| 실제 기능 구현 | Spec (구조화) |
| 버그 수정, 빠른 수정 | Vibe |
| 큰 기능 단위 개발 | Spec |

---

## Git 브랜치 전략

```
main          ← Reviewer 승인된 코드만 머지
  └─ feature/* ← Driver가 작업하는 브랜치
```

- Driver는 항상 feature 브랜치에서 작업
- Reviewer 승인 후 main에 머지
- Owner는 main 기준으로 방향 검토

---

## 협업 원칙

- **결정권은 항상 사람에게:** Kiro의 제안은 참고용, 최종 결정은 각 역할 담당자가 함
- **역할 경계 존중:** Driver가 요구사항을 임의로 변경하지 않음, Owner가 구현 세부사항에 개입 최소화
- **Reviewer는 게이트:** 품질 기준 미달 시 다음 단계로 진행하지 않음
- **Kiro 컨텍스트 공유:** `.kiro/` 폴더를 Git에 포함해 모든 팀원이 동일한 규칙 적용
