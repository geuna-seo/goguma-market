// 기능 스위치 (Feature Flag)
// 만들어 둔 기능을 지우지 않고 잠시 끄거나 켤 때 써요. true / false 만 바꾸면 돼요.

// 동네 인증 (STEP 3)
// 지금은 카카오 API 키 없이 쓰려고 꺼 뒀어요. 꺼져 있으면:
//   - 동네 인증 없이 누구나 글을 쓸 수 있어요
//   - 헤더의 📍 버튼, 목록의 "우리 동네" 탭, 상세의 동네 표시가 숨겨져요
// 다시 켜려면: 이 값을 true 로 바꾸고, .env.local·Vercel 에 KAKAO_REST_API_KEY 를 넣고,
//   004_market_neighborhood.sql 의 "인증한 사람만 글쓰기" 정책을 DB 에 다시 적용하세요.
export const NEIGHBORHOOD_ENABLED = false;
