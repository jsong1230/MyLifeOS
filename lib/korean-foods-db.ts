/**
 * 한식 내장 영양성분 데이터베이스
 * 출처: 식품의약품안전처 식품영양성분 DB / 농촌진흥청 국가표준식품성분표
 * 1인분 기준 영양정보 (칼로리 kcal, 단백질/탄수화물/지방 g)
 */

export interface KoreanFoodEntry {
  id: string
  name: string           // 한글 음식명
  aliases?: string[]     // 별명/표기 변형 (검색 매칭용)
  calories: number       // kcal / 1인분
  protein: number        // g / 1인분
  carbs: number          // g / 1인분
  fat: number            // g / 1인분
  serving_size: string   // 1인분 표시 문자열
  serving_size_g: number // 1인분 그램
}

export const KOREAN_FOODS_DB: KoreanFoodEntry[] = [
  // ──────────────── 밥류 ────────────────
  { id: 'kr-001', name: '흰쌀밥', aliases: ['밥', '쌀밥', '공기밥'], calories: 313, protein: 5.0, carbs: 69.5, fat: 0.4, serving_size: '1공기 (210g)', serving_size_g: 210 },
  { id: 'kr-002', name: '잡곡밥', aliases: ['현미잡곡밥', '오곡밥'], calories: 294, protein: 6.0, carbs: 62.0, fat: 1.5, serving_size: '1공기 (210g)', serving_size_g: 210 },
  { id: 'kr-003', name: '현미밥', aliases: ['현미'], calories: 280, protein: 5.5, carbs: 59.0, fat: 1.2, serving_size: '1공기 (210g)', serving_size_g: 210 },
  { id: 'kr-004', name: '볶음밥', aliases: ['계란볶음밥', '새우볶음밥'], calories: 540, protein: 14.0, carbs: 78.0, fat: 17.5, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-005', name: '김치볶음밥', aliases: ['김치밥'], calories: 520, protein: 12.0, carbs: 80.0, fat: 15.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-006', name: '비빔밥', calories: 650, protein: 22.0, carbs: 95.0, fat: 15.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-007', name: '오므라이스', calories: 570, protein: 16.0, carbs: 70.0, fat: 22.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-008', name: '쌈밥', aliases: ['쌈', '쌈정식'], calories: 580, protein: 28.0, carbs: 72.0, fat: 18.0, serving_size: '1인분 (400g)', serving_size_g: 400 },
  { id: 'kr-009', name: '주먹밥', aliases: ['삼각밥'], calories: 290, protein: 6.0, carbs: 58.0, fat: 3.5, serving_size: '2개 (200g)', serving_size_g: 200 },
  { id: 'kr-010', name: '돌솥비빔밥', aliases: ['돌솥밥'], calories: 680, protein: 24.0, carbs: 95.0, fat: 18.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },

  // ──────────────── 국/찌개류 ────────────────
  { id: 'kr-011', name: '된장찌개', aliases: ['된장국'], calories: 100, protein: 7.0, carbs: 8.0, fat: 3.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-012', name: '김치찌개', aliases: ['김치국'], calories: 120, protein: 8.0, carbs: 8.0, fat: 5.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-013', name: '순두부찌개', aliases: ['순두부', '순두부국'], calories: 150, protein: 11.0, carbs: 7.0, fat: 7.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-014', name: '미역국', aliases: ['미역', '생일국'], calories: 50, protein: 4.0, carbs: 3.0, fat: 1.5, serving_size: '1그릇 (300g)', serving_size_g: 300 },
  { id: 'kr-015', name: '콩나물국', aliases: ['콩나물'], calories: 30, protein: 3.0, carbs: 3.0, fat: 0.5, serving_size: '1그릇 (300g)', serving_size_g: 300 },
  { id: 'kr-016', name: '육개장', aliases: ['육개장국'], calories: 160, protein: 16.0, carbs: 10.0, fat: 6.0, serving_size: '1그릇 (350g)', serving_size_g: 350 },
  { id: 'kr-017', name: '부대찌개', aliases: ['존슨탕', '부대전골'], calories: 450, protein: 20.0, carbs: 40.0, fat: 18.0, serving_size: '1인분 (450g)', serving_size_g: 450 },
  { id: 'kr-018', name: '감자탕', aliases: ['뼈해장국', '등뼈탕'], calories: 400, protein: 28.0, carbs: 22.0, fat: 18.0, serving_size: '1인분 (450g)', serving_size_g: 450 },
  { id: 'kr-019', name: '청국장찌개', aliases: ['청국장'], calories: 120, protein: 9.0, carbs: 9.0, fat: 4.5, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-020', name: '해물순두부찌개', aliases: ['해물순두부'], calories: 160, protein: 14.0, carbs: 8.0, fat: 6.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-021', name: '갈비탕', aliases: ['소갈비탕'], calories: 380, protein: 32.0, carbs: 12.0, fat: 20.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-022', name: '설렁탕', aliases: ['설농탕'], calories: 320, protein: 30.0, carbs: 18.0, fat: 12.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-023', name: '삼계탕', aliases: ['닭한마리', '계삼탕'], calories: 800, protein: 62.0, carbs: 38.0, fat: 30.0, serving_size: '1마리 (800g)', serving_size_g: 800 },
  { id: 'kr-024', name: '해장국', aliases: ['선지해장국', '뼈해장국'], calories: 350, protein: 28.0, carbs: 20.0, fat: 14.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-025', name: '동태찌개', aliases: ['동태탕'], calories: 110, protein: 14.0, carbs: 5.0, fat: 3.5, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-026', name: '콩비지찌개', aliases: ['콩비지', '비지찌개'], calories: 130, protein: 8.0, carbs: 10.0, fat: 5.0, serving_size: '1인분 (300g)', serving_size_g: 300 },

  // ──────────────── 고기/구이류 ────────────────
  { id: 'kr-027', name: '삼겹살', aliases: ['오겹살'], calories: 630, protein: 28.0, carbs: 0.0, fat: 56.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-028', name: '불고기', aliases: ['소불고기', '돼지불고기'], calories: 340, protein: 28.0, carbs: 15.0, fat: 15.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-029', name: '닭볶음탕', aliases: ['닭도리탕', '닭조림'], calories: 450, protein: 38.0, carbs: 30.0, fat: 15.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-030', name: '갈비찜', aliases: ['찜갈비', '소갈비찜'], calories: 520, protein: 35.0, carbs: 22.0, fat: 28.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-031', name: '제육볶음', aliases: ['두루치기', '돼지고기볶음', '제육'], calories: 450, protein: 28.0, carbs: 15.0, fat: 28.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-032', name: '닭갈비', aliases: ['춘천닭갈비'], calories: 480, protein: 42.0, carbs: 35.0, fat: 14.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-033', name: '보쌈', aliases: ['수육', '족발'], calories: 380, protein: 30.0, carbs: 2.0, fat: 26.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-034', name: '돼지국밥', aliases: ['국밥'], calories: 520, protein: 28.0, carbs: 58.0, fat: 16.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-035', name: '소고기뭇국', aliases: ['뭇국', '소고기국'], calories: 120, protein: 12.0, carbs: 8.0, fat: 5.0, serving_size: '1그릇 (300g)', serving_size_g: 300 },
  { id: 'kr-036', name: '오삼불고기', aliases: ['오징어삼겹살볶음'], calories: 520, protein: 30.0, carbs: 20.0, fat: 32.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-037', name: '꽃등심', aliases: ['등심스테이크', '등심구이'], calories: 430, protein: 36.0, carbs: 0.0, fat: 30.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-038', name: '닭가슴살', aliases: ['닭살'], calories: 165, protein: 31.0, carbs: 0.0, fat: 3.5, serving_size: '1개 (100g)', serving_size_g: 100 },

  // ──────────────── 생선/해산물 ────────────────
  { id: 'kr-039', name: '고등어구이', aliases: ['고등어', '고등어조림'], calories: 270, protein: 27.0, carbs: 0.0, fat: 17.0, serving_size: '1마리반 (150g)', serving_size_g: 150 },
  { id: 'kr-040', name: '조기구이', aliases: ['조기', '굴비'], calories: 185, protein: 28.0, carbs: 0.0, fat: 7.5, serving_size: '1마리 (150g)', serving_size_g: 150 },
  { id: 'kr-041', name: '꽁치구이', aliases: ['꽁치'], calories: 285, protein: 28.0, carbs: 0.0, fat: 18.0, serving_size: '1마리 (150g)', serving_size_g: 150 },
  { id: 'kr-042', name: '갈치구이', aliases: ['갈치', '갈치조림'], calories: 200, protein: 27.0, carbs: 0.0, fat: 9.5, serving_size: '1토막 (150g)', serving_size_g: 150 },
  { id: 'kr-043', name: '낙지볶음', aliases: ['낙지', '낙지덮밥'], calories: 230, protein: 30.0, carbs: 15.0, fat: 4.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-044', name: '오징어볶음', aliases: ['오징어', '오징어채볶음'], calories: 220, protein: 25.0, carbs: 14.0, fat: 6.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-045', name: '해물파전', aliases: ['파전', '해물전'], calories: 350, protein: 18.0, carbs: 35.0, fat: 14.0, serving_size: '1장 (200g)', serving_size_g: 200 },
  { id: 'kr-046', name: '황태구이', aliases: ['황태', '황태해장국'], calories: 180, protein: 36.0, carbs: 2.0, fat: 3.0, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-047', name: '새우볶음', aliases: ['새우요리', '마늘새우'], calories: 180, protein: 22.0, carbs: 8.0, fat: 6.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-048', name: '굴국밥', aliases: ['굴국'], calories: 480, protein: 20.0, carbs: 58.0, fat: 12.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },

  // ──────────────── 반찬류 ────────────────
  { id: 'kr-049', name: '김치', aliases: ['배추김치', '깍두기'], calories: 20, protein: 1.5, carbs: 2.5, fat: 0.3, serving_size: '1접시 (70g)', serving_size_g: 70 },
  { id: 'kr-050', name: '깍두기', aliases: ['무김치'], calories: 25, protein: 1.0, carbs: 4.5, fat: 0.3, serving_size: '1접시 (70g)', serving_size_g: 70 },
  { id: 'kr-051', name: '계란프라이', aliases: ['달걀프라이', '계란'], calories: 90, protein: 6.5, carbs: 0.5, fat: 7.0, serving_size: '1개 (55g)', serving_size_g: 55 },
  { id: 'kr-052', name: '계란말이', aliases: ['달걀말이', '지단'], calories: 175, protein: 12.0, carbs: 2.0, fat: 13.0, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-053', name: '두부조림', aliases: ['두부', '두부구이'], calories: 120, protein: 9.0, carbs: 5.0, fat: 7.0, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-054', name: '시금치나물', aliases: ['시금치무침', '시금치'], calories: 55, protein: 3.5, carbs: 4.0, fat: 2.5, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-055', name: '콩나물무침', aliases: ['콩나물볶음', '콩나물'], calories: 35, protein: 3.0, carbs: 3.0, fat: 1.0, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-056', name: '멸치볶음', aliases: ['마른멸치볶음', '멸치'], calories: 110, protein: 13.0, carbs: 6.5, fat: 4.0, serving_size: '1접시 (40g)', serving_size_g: 40 },
  { id: 'kr-057', name: '버섯볶음', aliases: ['버섯나물', '버섯'], calories: 65, protein: 3.5, carbs: 6.0, fat: 3.0, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-058', name: '감자볶음', aliases: ['감자조림', '감자채볶음'], calories: 100, protein: 2.0, carbs: 17.0, fat: 3.0, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-059', name: '잡채', aliases: ['당면잡채'], calories: 320, protein: 8.0, carbs: 52.0, fat: 9.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-060', name: '연근조림', aliases: ['연근'], calories: 110, protein: 2.5, carbs: 19.0, fat: 2.5, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-061', name: '도라지무침', aliases: ['도라지나물', '도라지'], calories: 50, protein: 1.5, carbs: 8.5, fat: 1.5, serving_size: '1접시 (60g)', serving_size_g: 60 },
  { id: 'kr-062', name: '호박볶음', aliases: ['애호박볶음', '호박나물'], calories: 60, protein: 2.0, carbs: 7.5, fat: 2.5, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-063', name: '무생채', aliases: ['무나물', '무채'], calories: 30, protein: 1.0, carbs: 6.0, fat: 0.3, serving_size: '1접시 (70g)', serving_size_g: 70 },
  { id: 'kr-064', name: '북어무침', aliases: ['북어채무침', '황태무침'], calories: 100, protein: 16.0, carbs: 3.0, fat: 3.0, serving_size: '1접시 (60g)', serving_size_g: 60 },
  { id: 'kr-065', name: '시래기나물', aliases: ['시래기'], calories: 60, protein: 3.5, carbs: 8.0, fat: 2.0, serving_size: '1접시 (80g)', serving_size_g: 80 },

  // ──────────────── 면/분식류 ────────────────
  { id: 'kr-066', name: '라면', aliases: ['봉지라면', '신라면'], calories: 530, protein: 12.0, carbs: 77.0, fat: 17.5, serving_size: '1봉 (120g 건면)', serving_size_g: 500 },
  { id: 'kr-067', name: '짜장면', aliases: ['자장면', '짜장'], calories: 600, protein: 18.0, carbs: 96.0, fat: 15.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-068', name: '짬뽕', aliases: ['해물짬뽕'], calories: 530, protein: 26.0, carbs: 76.0, fat: 12.0, serving_size: '1그릇 (550g)', serving_size_g: 550 },
  { id: 'kr-069', name: '냉면', aliases: ['물냉면', '비빔냉면', '평양냉면'], calories: 560, protein: 18.0, carbs: 100.0, fat: 8.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-070', name: '칼국수', aliases: ['들깨칼국수', '바지락칼국수'], calories: 450, protein: 18.0, carbs: 85.0, fat: 5.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-071', name: '김밥', aliases: ['참치김밥', '야채김밥'], calories: 380, protein: 12.0, carbs: 65.0, fat: 7.0, serving_size: '1줄 (230g)', serving_size_g: 230 },
  { id: 'kr-072', name: '떡볶이', aliases: ['떡뽁이', '로제떡볶이'], calories: 380, protein: 8.0, carbs: 75.0, fat: 5.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-073', name: '순대', aliases: ['순대볶음'], calories: 280, protein: 15.0, carbs: 25.0, fat: 11.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-074', name: '튀김', aliases: ['해물튀김', '야채튀김', '새우튀김'], calories: 380, protein: 10.0, carbs: 30.0, fat: 24.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-075', name: '우동', aliases: ['일본우동', '해물우동'], calories: 430, protein: 14.0, carbs: 82.0, fat: 4.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-076', name: '잔치국수', aliases: ['국수', '소면국수'], calories: 380, protein: 12.0, carbs: 72.0, fat: 4.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-077', name: '수제비', aliases: ['팥수제비', '들깨수제비'], calories: 420, protein: 12.0, carbs: 80.0, fat: 5.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-078', name: '비빔국수', aliases: ['비빔냉국수', '쫄면'], calories: 450, protein: 12.0, carbs: 82.0, fat: 9.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-079', name: '콩국수', aliases: ['콩국물'], calories: 435, protein: 18.0, carbs: 65.0, fat: 10.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-080', name: '라볶이', aliases: ['라면떡볶이'], calories: 520, protein: 12.0, carbs: 92.0, fat: 12.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-081', name: '컵라면', aliases: ['컵누들'], calories: 300, protein: 7.0, carbs: 42.0, fat: 12.0, serving_size: '1개 (65g 건면)', serving_size_g: 250 },

  // ──────────────── 패스트푸드/간식류 ────────────────
  { id: 'kr-082', name: '치킨', aliases: ['후라이드치킨', '양념치킨', '반마리'], calories: 890, protein: 55.0, carbs: 42.0, fat: 52.0, serving_size: '반마리 (350g)', serving_size_g: 350 },
  { id: 'kr-083', name: '피자 한 조각', aliases: ['피자', '슬라이스피자'], calories: 290, protein: 14.0, carbs: 35.0, fat: 10.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-084', name: '햄버거', aliases: ['버거'], calories: 500, protein: 26.0, carbs: 43.0, fat: 24.0, serving_size: '1개 (200g)', serving_size_g: 200 },
  { id: 'kr-085', name: '삼각김밥', aliases: ['삼각'], calories: 195, protein: 5.0, carbs: 40.0, fat: 2.0, serving_size: '1개 (100g)', serving_size_g: 100 },
  { id: 'kr-086', name: '붕어빵', aliases: ['잉어빵', '타코야끼'], calories: 180, protein: 4.5, carbs: 34.0, fat: 3.5, serving_size: '2개 (100g)', serving_size_g: 100 },
  { id: 'kr-087', name: '호떡', aliases: ['씨앗호떡'], calories: 230, protein: 4.0, carbs: 36.0, fat: 8.0, serving_size: '1개 (100g)', serving_size_g: 100 },
  { id: 'kr-088', name: '어묵', aliases: ['오뎅', '어묵탕', '어묵국'], calories: 100, protein: 6.5, carbs: 10.0, fat: 3.5, serving_size: '2꼬치 (80g)', serving_size_g: 80 },
  { id: 'kr-089', name: '핫도그', aliases: ['미국핫도그', '밀떡핫도그'], calories: 280, protein: 8.0, carbs: 32.0, fat: 13.0, serving_size: '1개 (120g)', serving_size_g: 120 },
  { id: 'kr-090', name: '떡', aliases: ['송편', '인절미', '가래떡'], calories: 220, protein: 3.5, carbs: 50.0, fat: 0.6, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-091', name: '식빵', aliases: ['토스트', '빵'], calories: 265, protein: 8.5, carbs: 50.0, fat: 4.3, serving_size: '3장 (100g)', serving_size_g: 100 },
  { id: 'kr-092', name: '샌드위치', aliases: ['햄샌드위치', '에그샌드위치'], calories: 360, protein: 14.0, carbs: 42.0, fat: 14.0, serving_size: '1개 (150g)', serving_size_g: 150 },
  { id: 'kr-093', name: '도넛', aliases: ['도너츠', '글레이즈도넛'], calories: 290, protein: 5.0, carbs: 40.0, fat: 12.0, serving_size: '1개 (90g)', serving_size_g: 90 },
  { id: 'kr-094', name: '크로아상', aliases: ['크루아상', '버터크루아상'], calories: 280, protein: 5.5, carbs: 28.0, fat: 16.5, serving_size: '1개 (75g)', serving_size_g: 75 },
  { id: 'kr-095', name: '탕수육', aliases: ['깐풍기'], calories: 480, protein: 22.0, carbs: 42.0, fat: 22.0, serving_size: '1인분 (250g)', serving_size_g: 250 },

  // ──────────────── 과일/채소 ────────────────
  { id: 'kr-096', name: '사과', aliases: ['애플'], calories: 104, protein: 0.4, carbs: 26.0, fat: 0.4, serving_size: '1개 (200g)', serving_size_g: 200 },
  { id: 'kr-097', name: '바나나', aliases: ['banana'], calories: 109, protein: 1.3, carbs: 27.5, fat: 0.3, serving_size: '1개 (120g)', serving_size_g: 120 },
  { id: 'kr-098', name: '귤', aliases: ['감귤', '오렌지'], calories: 46, protein: 0.7, carbs: 11.5, fat: 0.2, serving_size: '1개 (80g)', serving_size_g: 80 },
  { id: 'kr-099', name: '딸기', aliases: ['생딸기'], calories: 35, protein: 0.8, carbs: 8.0, fat: 0.3, serving_size: '10개 (100g)', serving_size_g: 100 },
  { id: 'kr-100', name: '포도', aliases: ['청포도', '거봉'], calories: 69, protein: 0.7, carbs: 17.5, fat: 0.2, serving_size: '1포기 (100g)', serving_size_g: 100 },
  { id: 'kr-101', name: '토마토', aliases: ['방울토마토', '대추토마토'], calories: 36, protein: 1.4, carbs: 7.0, fat: 0.3, serving_size: '1개 (150g)', serving_size_g: 150 },
  { id: 'kr-102', name: '수박', aliases: ['watermelon'], calories: 86, protein: 1.4, carbs: 20.0, fat: 0.4, serving_size: '1쪽 (300g)', serving_size_g: 300 },
  { id: 'kr-103', name: '배', aliases: ['한국배', '신고배'], calories: 98, protein: 0.6, carbs: 25.0, fat: 0.2, serving_size: '1/2개 (200g)', serving_size_g: 200 },
  { id: 'kr-104', name: '복숭아', aliases: ['황도', '천도복숭아'], calories: 90, protein: 1.5, carbs: 21.0, fat: 0.3, serving_size: '1개 (180g)', serving_size_g: 180 },
  { id: 'kr-105', name: '키위', aliases: ['키위프루트', '참다래'], calories: 58, protein: 0.9, carbs: 14.5, fat: 0.3, serving_size: '1개 (90g)', serving_size_g: 90 },
  { id: 'kr-106', name: '감', aliases: ['단감', '홍시', '곶감'], calories: 120, protein: 0.8, carbs: 30.0, fat: 0.2, serving_size: '1개 (200g)', serving_size_g: 200 },
  { id: 'kr-107', name: '고구마', aliases: ['군고구마', '찐고구마'], calories: 175, protein: 2.5, carbs: 41.0, fat: 0.2, serving_size: '1개 (150g)', serving_size_g: 150 },
  { id: 'kr-108', name: '감자', aliases: ['찐감자', '삶은감자'], calories: 130, protein: 3.0, carbs: 30.0, fat: 0.2, serving_size: '1개 (150g)', serving_size_g: 150 },

  // ──────────────── 음료/기타 ────────────────
  { id: 'kr-109', name: '아메리카노', aliases: ['블랙커피', '에스프레소', '커피'], calories: 10, protein: 0.5, carbs: 2.0, fat: 0.0, serving_size: '1잔 (350ml)', serving_size_g: 350 },
  { id: 'kr-110', name: '카페라떼', aliases: ['라떼', '카페라', '카페라테'], calories: 180, protein: 7.0, carbs: 18.0, fat: 8.0, serving_size: '1잔 (350ml)', serving_size_g: 350 },
  { id: 'kr-111', name: '우유', aliases: ['흰우유', '저지방우유'], calories: 125, protein: 6.5, carbs: 9.5, fat: 6.5, serving_size: '1컵 (200ml)', serving_size_g: 200 },
  { id: 'kr-112', name: '두유', aliases: ['콩음료', '두유음료'], calories: 95, protein: 5.5, carbs: 10.5, fat: 3.5, serving_size: '1팩 (190ml)', serving_size_g: 190 },
  { id: 'kr-113', name: '오렌지주스', aliases: ['오렌지', '주스'], calories: 88, protein: 1.2, carbs: 21.0, fat: 0.3, serving_size: '1컵 (200ml)', serving_size_g: 200 },
  { id: 'kr-114', name: '맥주', aliases: ['생맥주', '캔맥주'], calories: 150, protein: 1.5, carbs: 12.5, fat: 0.0, serving_size: '1캔 (330ml)', serving_size_g: 330 },
  { id: 'kr-115', name: '소주', aliases: ['참이슬', '처음처럼'], calories: 130, protein: 0.0, carbs: 0.0, fat: 0.0, serving_size: '반병 (180ml)', serving_size_g: 180 },
  { id: 'kr-116', name: '막걸리', aliases: ['동동주', '탁주'], calories: 168, protein: 2.5, carbs: 20.0, fat: 0.0, serving_size: '1사발 (300ml)', serving_size_g: 300 },
  { id: 'kr-117', name: '녹차', aliases: ['차', '홍차'], calories: 3, protein: 0.3, carbs: 0.3, fat: 0.0, serving_size: '1잔 (200ml)', serving_size_g: 200 },
  { id: 'kr-118', name: '이온음료', aliases: ['스포츠음료', '게토레이', '포카리'], calories: 50, protein: 0.0, carbs: 12.5, fat: 0.0, serving_size: '1병 (500ml)', serving_size_g: 500 },
  { id: 'kr-119', name: '아이스크림', aliases: ['소프트아이스크림', '아이스크리', '바닐라아이스크림'], calories: 200, protein: 3.5, carbs: 26.0, fat: 9.5, serving_size: '1스쿱 (100g)', serving_size_g: 100 },
  { id: 'kr-120', name: '요거트', aliases: ['요구르트', '그릭요거트'], calories: 120, protein: 8.0, carbs: 14.0, fat: 3.5, serving_size: '1통 (150g)', serving_size_g: 150 },

  // ──────────────── 한식 특별 메뉴 ────────────────
  { id: 'kr-121', name: '돼지갈비', aliases: ['목살구이', '갈비'], calories: 480, protein: 32.0, carbs: 8.0, fat: 34.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-122', name: '쟁반짜장', aliases: ['사천짜장', '간짜장'], calories: 680, protein: 22.0, carbs: 105.0, fat: 18.0, serving_size: '1그릇 (550g)', serving_size_g: 550 },
  { id: 'kr-123', name: '족발', aliases: ['앞발', '뒷발', '족발보쌈'], calories: 420, protein: 32.0, carbs: 3.0, fat: 30.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-124', name: '순댓국', aliases: ['순대국밥'], calories: 450, protein: 22.0, carbs: 45.0, fat: 16.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-125', name: '곰탕', aliases: ['곰국', '도가니탕'], calories: 330, protein: 30.0, carbs: 15.0, fat: 14.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },

  // ──────────────── 죽류 ────────────────
  { id: 'kr-126', name: '흰죽', aliases: ['쌀죽', '미음', '죽'], calories: 150, protein: 3.0, carbs: 33.0, fat: 0.5, serving_size: '1그릇 (300g)', serving_size_g: 300 },
  { id: 'kr-127', name: '호박죽', aliases: ['단호박죽'], calories: 170, protein: 2.5, carbs: 38.0, fat: 1.0, serving_size: '1그릇 (300g)', serving_size_g: 300 },
  { id: 'kr-128', name: '팥죽', aliases: ['팥', '새알심죽'], calories: 300, protein: 7.0, carbs: 62.0, fat: 2.0, serving_size: '1그릇 (350g)', serving_size_g: 350 },
  { id: 'kr-129', name: '전복죽', aliases: ['해물죽', '전복'], calories: 250, protein: 12.0, carbs: 40.0, fat: 4.0, serving_size: '1그릇 (350g)', serving_size_g: 350 },
  { id: 'kr-130', name: '닭죽', aliases: ['닭고기죽', '계죽'], calories: 290, protein: 18.0, carbs: 40.0, fat: 5.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },

  // ──────────────── 덮밥류 ────────────────
  { id: 'kr-131', name: '소고기덮밥', aliases: ['규동', '쇠고기덮밥', '불고기덮밥'], calories: 640, protein: 25.0, carbs: 88.0, fat: 18.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-132', name: '참치마요덮밥', aliases: ['참치덮밥', '참치마요'], calories: 580, protein: 22.0, carbs: 80.0, fat: 16.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-133', name: '카츠동', aliases: ['돈까스덮밥', '가츠동'], calories: 690, protein: 28.0, carbs: 90.0, fat: 24.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-134', name: '연어덮밥', aliases: ['연어', '연어초밥'], calories: 560, protein: 30.0, carbs: 72.0, fat: 14.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-135', name: '마파두부덮밥', aliases: ['마파두부', '마파'], calories: 550, protein: 18.0, carbs: 76.0, fat: 18.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-136', name: '나물비빔덮밥', aliases: ['나물덮밥', '채소덮밥'], calories: 480, protein: 12.0, carbs: 88.0, fat: 8.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-137', name: '치킨덮밥', aliases: ['닭고기덮밥', '닭덮밥'], calories: 620, protein: 32.0, carbs: 80.0, fat: 18.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },

  // ──────────────── 국/찌개 추가 ────────────────
  { id: 'kr-138', name: '떡국', aliases: ['설날떡국', '떡만둣국'], calories: 450, protein: 12.0, carbs: 85.0, fat: 6.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-139', name: '만둣국', aliases: ['만두국', '물만두국'], calories: 480, protein: 16.0, carbs: 80.0, fat: 10.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-140', name: '알탕', aliases: ['명란탕', '대구탕'], calories: 180, protein: 20.0, carbs: 8.0, fat: 6.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-141', name: '닭개장', aliases: ['닭육개장'], calories: 200, protein: 22.0, carbs: 12.0, fat: 7.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-142', name: '북엇국', aliases: ['황태국', '북어탕'], calories: 80, protein: 12.0, carbs: 4.0, fat: 2.0, serving_size: '1그릇 (300g)', serving_size_g: 300 },

  // ──────────────── 전/부침류 ────────────────
  { id: 'kr-143', name: '김치전', aliases: ['김치부침개', '부침개'], calories: 320, protein: 8.0, carbs: 40.0, fat: 14.0, serving_size: '1장 (180g)', serving_size_g: 180 },
  { id: 'kr-144', name: '감자전', aliases: ['감자부침개', '감자요리'], calories: 280, protein: 6.0, carbs: 38.0, fat: 12.0, serving_size: '1장 (150g)', serving_size_g: 150 },
  { id: 'kr-145', name: '계란찜', aliases: ['달걀찜', '뚝배기계란찜'], calories: 150, protein: 12.0, carbs: 4.0, fat: 10.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-146', name: '녹두전', aliases: ['빈대떡', '녹두빈대떡'], calories: 350, protein: 14.0, carbs: 35.0, fat: 16.0, serving_size: '1장 (180g)', serving_size_g: 180 },
  { id: 'kr-147', name: '동그랑땡', aliases: ['전유어', '고기전'], calories: 220, protein: 14.0, carbs: 18.0, fat: 10.0, serving_size: '4개 (120g)', serving_size_g: 120 },

  // ──────────────── 반찬 추가 ────────────────
  { id: 'kr-148', name: '장조림', aliases: ['소고기장조림', '계란장조림'], calories: 185, protein: 22.0, carbs: 5.0, fat: 8.0, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-149', name: '깻잎무침', aliases: ['깻잎', '깻잎절임'], calories: 45, protein: 2.0, carbs: 5.0, fat: 2.0, serving_size: '1접시 (60g)', serving_size_g: 60 },
  { id: 'kr-150', name: '콩자반', aliases: ['콩조림', '검은콩조림'], calories: 130, protein: 7.0, carbs: 15.0, fat: 5.0, serving_size: '1접시 (60g)', serving_size_g: 60 },
  { id: 'kr-151', name: '어묵볶음', aliases: ['오뎅볶음', '어묵조림'], calories: 140, protein: 8.0, carbs: 14.0, fat: 5.0, serving_size: '1접시 (100g)', serving_size_g: 100 },
  { id: 'kr-152', name: '고사리나물', aliases: ['고사리무침', '고사리'], calories: 65, protein: 3.0, carbs: 7.0, fat: 3.0, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-153', name: '미역줄기볶음', aliases: ['미역볶음', '미역줄기'], calories: 30, protein: 2.0, carbs: 3.0, fat: 1.0, serving_size: '1접시 (60g)', serving_size_g: 60 },
  { id: 'kr-154', name: '나물무침', aliases: ['취나물', '봄나물'], calories: 55, protein: 2.5, carbs: 6.0, fat: 2.5, serving_size: '1접시 (80g)', serving_size_g: 80 },
  { id: 'kr-155', name: '마늘쫑볶음', aliases: ['마늘쫑', '마늘대볶음'], calories: 70, protein: 2.0, carbs: 9.0, fat: 3.0, serving_size: '1접시 (60g)', serving_size_g: 60 },

  // ──────────────── 일식류 ────────────────
  { id: 'kr-156', name: '초밥', aliases: ['스시', '스시세트', '초밥세트'], calories: 320, protein: 15.0, carbs: 55.0, fat: 5.0, serving_size: '8피스 (200g)', serving_size_g: 200 },
  { id: 'kr-157', name: '돈까스', aliases: ['돈가스', '카츠', '포크커틀릿'], calories: 550, protein: 26.0, carbs: 52.0, fat: 26.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-158', name: '라멘', aliases: ['일본라면', '쇼유라멘', '미소라멘'], calories: 550, protein: 20.0, carbs: 72.0, fat: 18.0, serving_size: '1그릇 (500g)', serving_size_g: 500 },
  { id: 'kr-159', name: '소바', aliases: ['메밀국수', '냉소바', '자루소바'], calories: 380, protein: 14.0, carbs: 72.0, fat: 4.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-160', name: '타코야키', aliases: ['타코야끼', '문어빵'], calories: 300, protein: 10.0, carbs: 32.0, fat: 14.0, serving_size: '6개 (150g)', serving_size_g: 150 },
  { id: 'kr-161', name: '나베', aliases: ['전골', '샤부샤부', '일본전골'], calories: 280, protein: 22.0, carbs: 16.0, fat: 10.0, serving_size: '1인분 (400g)', serving_size_g: 400 },
  { id: 'kr-162', name: '텐동', aliases: ['튀김덮밥', '새우튀김덮밥'], calories: 680, protein: 22.0, carbs: 90.0, fat: 24.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },

  // ──────────────── 양식류 ────────────────
  { id: 'kr-163', name: '스파게티', aliases: ['파스타', '토마토파스타', '스파게리'], calories: 550, protein: 18.0, carbs: 80.0, fat: 16.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-164', name: '크림파스타', aliases: ['까르보나라', '크림스파게티'], calories: 700, protein: 20.0, carbs: 78.0, fat: 32.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-165', name: '리조또', aliases: ['크림리조또', '버섯리조또'], calories: 580, protein: 16.0, carbs: 78.0, fat: 20.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-166', name: '샐러드', aliases: ['시저샐러드', '그린샐러드', '채소샐러드'], calories: 150, protein: 5.0, carbs: 15.0, fat: 8.0, serving_size: '1그릇 (200g)', serving_size_g: 200 },
  { id: 'kr-167', name: '스테이크', aliases: ['립아이', '안심스테이크', '등심스테이크'], calories: 450, protein: 38.0, carbs: 2.0, fat: 32.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-168', name: '오믈렛', aliases: ['오믈레트', '치즈오믈렛'], calories: 220, protein: 14.0, carbs: 4.0, fat: 17.0, serving_size: '1인분 (120g)', serving_size_g: 120 },
  { id: 'kr-169', name: '치킨샐러드', aliases: ['닭가슴살샐러드', '그릴드치킨샐러드'], calories: 280, protein: 25.0, carbs: 12.0, fat: 14.0, serving_size: '1그릇 (250g)', serving_size_g: 250 },
  { id: 'kr-170', name: '수프', aliases: ['크림수프', '호박수프', '토마토수프'], calories: 180, protein: 5.0, carbs: 20.0, fat: 9.0, serving_size: '1그릇 (250ml)', serving_size_g: 250 },

  // ──────────────── 디저트/간식 추가 ────────────────
  { id: 'kr-171', name: '치즈케이크', aliases: ['뉴욕치즈케이크', '케이크'], calories: 380, protein: 7.0, carbs: 38.0, fat: 22.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-172', name: '초콜릿케이크', aliases: ['초코케이크', '초콜릿'], calories: 420, protein: 6.0, carbs: 58.0, fat: 18.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-173', name: '마카롱', aliases: ['마카롱쿠키'], calories: 180, protein: 3.0, carbs: 28.0, fat: 6.0, serving_size: '2개 (50g)', serving_size_g: 50 },
  { id: 'kr-174', name: '팥빙수', aliases: ['빙수', '망고빙수', '딸기빙수'], calories: 450, protein: 8.0, carbs: 95.0, fat: 3.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-175', name: '찹쌀떡', aliases: ['모찌', '대복'], calories: 200, protein: 3.0, carbs: 46.0, fat: 1.0, serving_size: '2개 (100g)', serving_size_g: 100 },
  { id: 'kr-176', name: '와플', aliases: ['벨기에와플', '와플케이크'], calories: 300, protein: 6.0, carbs: 42.0, fat: 12.0, serving_size: '1개 (120g)', serving_size_g: 120 },
  { id: 'kr-177', name: '팬케이크', aliases: ['핫케이크', '팬케익'], calories: 280, protein: 7.0, carbs: 38.0, fat: 10.0, serving_size: '2장 (120g)', serving_size_g: 120 },
  { id: 'kr-178', name: '쿠키', aliases: ['초코칩쿠키', '버터쿠키'], calories: 180, protein: 2.5, carbs: 24.0, fat: 8.0, serving_size: '3개 (50g)', serving_size_g: 50 },

  // ──────────────── 건강식/다이어트식 ────────────────
  { id: 'kr-179', name: '귀리오트밀', aliases: ['오트밀', '귀리죽', '오트밀죽'], calories: 300, protein: 10.0, carbs: 54.0, fat: 5.0, serving_size: '1그릇 (250g)', serving_size_g: 250 },
  { id: 'kr-180', name: '아보카도', aliases: ['아보카도토스트'], calories: 240, protein: 3.0, carbs: 12.0, fat: 22.0, serving_size: '1개 (150g)', serving_size_g: 150 },
  { id: 'kr-181', name: '그래놀라', aliases: ['그래놀라바', '뮤즐리'], calories: 380, protein: 8.0, carbs: 62.0, fat: 12.0, serving_size: '1그릇 (100g)', serving_size_g: 100 },
  { id: 'kr-182', name: '단백질셰이크', aliases: ['프로틴셰이크', '프로틴', '단백질쉐이크'], calories: 150, protein: 25.0, carbs: 8.0, fat: 3.0, serving_size: '1잔 (250ml)', serving_size_g: 250 },
  { id: 'kr-183', name: '두부샐러드', aliases: ['두부야채샐러드'], calories: 130, protein: 9.0, carbs: 8.0, fat: 7.0, serving_size: '1그릇 (200g)', serving_size_g: 200 },

  // ──────────────── 즉석/편의식 ────────────────
  { id: 'kr-184', name: '즉석밥', aliases: ['햇반', '컵밥'], calories: 310, protein: 5.0, carbs: 68.0, fat: 0.5, serving_size: '1개 (210g)', serving_size_g: 210 },
  { id: 'kr-185', name: '만두', aliases: ['군만두', '물만두', '냉동만두', '찐만두'], calories: 380, protein: 14.0, carbs: 50.0, fat: 12.0, serving_size: '10개 (200g)', serving_size_g: 200 },
  { id: 'kr-186', name: '스팸', aliases: ['햄', '통조림햄'], calories: 300, protein: 12.0, carbs: 3.0, fat: 26.0, serving_size: '1/3캔 (100g)', serving_size_g: 100 },
  { id: 'kr-187', name: '참치캔', aliases: ['참치통조림', '참치'], calories: 150, protein: 26.0, carbs: 0.0, fat: 5.0, serving_size: '1캔 (100g)', serving_size_g: 100 },
  { id: 'kr-188', name: '도시락', aliases: ['편의점도시락', '도시락밥'], calories: 650, protein: 20.0, carbs: 90.0, fat: 20.0, serving_size: '1개 (350g)', serving_size_g: 350 },

  // ──────────────── 추가 인기 메뉴 ────────────────
  { id: 'kr-189', name: '두부김치', aliases: ['두부와김치'], calories: 280, protein: 16.0, carbs: 14.0, fat: 16.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-190', name: '김치볶음', aliases: ['묵은지볶음', '김치볶기'], calories: 120, protein: 4.0, carbs: 12.0, fat: 7.0, serving_size: '1접시 (120g)', serving_size_g: 120 },
  { id: 'kr-191', name: '된장국', aliases: ['된장미소국'], calories: 60, protein: 4.0, carbs: 6.0, fat: 2.0, serving_size: '1그릇 (200g)', serving_size_g: 200 },
  { id: 'kr-192', name: '소시지볶음', aliases: ['소시지', '비엔나소시지'], calories: 250, protein: 10.0, carbs: 8.0, fat: 20.0, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-193', name: '닭볶음', aliases: ['닭갈비볶음', '닭고기볶음'], calories: 380, protein: 32.0, carbs: 22.0, fat: 16.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-194', name: '카레라이스', aliases: ['카레', '인도카레', '일본카레'], calories: 620, protein: 16.0, carbs: 95.0, fat: 16.0, serving_size: '1인분 (450g)', serving_size_g: 450 },
  { id: 'kr-195', name: '덮밥소스', aliases: ['덮밥'], calories: 200, protein: 10.0, carbs: 20.0, fat: 8.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-196', name: '나물밥', aliases: ['곤드레밥', '취나물밥'], calories: 400, protein: 8.0, carbs: 80.0, fat: 5.0, serving_size: '1그릇 (350g)', serving_size_g: 350 },
  { id: 'kr-197', name: '닭한마리', aliases: ['닭볶음탕전골', '한마리닭'], calories: 700, protein: 65.0, carbs: 30.0, fat: 28.0, serving_size: '1인분 (400g)', serving_size_g: 400 },
  { id: 'kr-198', name: '뚝배기불고기', aliases: ['뚝불', '돌솥불고기'], calories: 480, protein: 32.0, carbs: 28.0, fat: 22.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-199', name: '수육', aliases: ['삶은고기', '보쌈수육'], calories: 320, protein: 28.0, carbs: 0.0, fat: 22.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-200', name: '어탕국수', aliases: ['어탕', '민물고기국수'], calories: 430, protein: 20.0, carbs: 65.0, fat: 8.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },

  // ──────────────── 한국 구이/외식 고기 ────────────────
  { id: 'kr-201', name: '항정살', aliases: ['항정', '목항정'], calories: 480, protein: 26.0, carbs: 0.0, fat: 42.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-202', name: '대패삼겹살', aliases: ['대패', '얇은삼겹살'], calories: 560, protein: 22.0, carbs: 2.0, fat: 50.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-203', name: '갈매기살', aliases: ['가로막살', '갈매기'], calories: 320, protein: 30.0, carbs: 0.0, fat: 22.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-204', name: '차돌박이', aliases: ['차돌', '차돌된장찌개'], calories: 400, protein: 20.0, carbs: 0.0, fat: 36.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-205', name: '곱창구이', aliases: ['곱창', '소곱창', '곱창볶음'], calories: 380, protein: 22.0, carbs: 2.0, fat: 32.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-206', name: '막창구이', aliases: ['막창', '돼지막창'], calories: 350, protein: 20.0, carbs: 2.0, fat: 30.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-207', name: '찜닭', aliases: ['간장찜닭', '안동찜닭'], calories: 620, protein: 45.0, carbs: 48.0, fat: 24.0, serving_size: '1인분 (400g)', serving_size_g: 400 },
  { id: 'kr-208', name: '아귀찜', aliases: ['아귀', '아구찜'], calories: 280, protein: 30.0, carbs: 15.0, fat: 10.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-209', name: '닭강정', aliases: ['강정', '달콤닭강정'], calories: 560, protein: 32.0, carbs: 55.0, fat: 24.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-210', name: '쭈꾸미볶음', aliases: ['쭈꾸미', '주꾸미볶음', '낙지쭈꾸미'], calories: 320, protein: 28.0, carbs: 25.0, fat: 12.0, serving_size: '1인분 (250g)', serving_size_g: 250 },

  // ──────────────── 해산물 외식 ────────────────
  { id: 'kr-211', name: '간장게장', aliases: ['간장게', '게장', '게장정식'], calories: 120, protein: 14.0, carbs: 5.0, fat: 5.0, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-212', name: '양념게장', aliases: ['양념게', '꽃게장', '매운게장'], calories: 150, protein: 14.0, carbs: 10.0, fat: 6.0, serving_size: '1인분 (100g)', serving_size_g: 100 },
  { id: 'kr-213', name: '꽃게탕', aliases: ['꽃게', '꽃게찜', '게탕'], calories: 230, protein: 24.0, carbs: 12.0, fat: 8.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-214', name: '해물전골', aliases: ['해산물전골', '모듬전골'], calories: 280, protein: 28.0, carbs: 18.0, fat: 8.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-215', name: '광어회', aliases: ['광어', '회', '모듬회'], calories: 200, protein: 38.0, carbs: 0.0, fat: 4.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-216', name: '연어회', aliases: ['연어사시미', '사시미', '회', '연어'], calories: 280, protein: 24.0, carbs: 0.0, fat: 20.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-217', name: '대게찜', aliases: ['대게', '킹크랩', '게찜'], calories: 180, protein: 30.0, carbs: 2.0, fat: 5.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-218', name: '새우구이', aliases: ['왕새우', '새우찜', '왕새우구이'], calories: 200, protein: 26.0, carbs: 2.0, fat: 9.0, serving_size: '1인분 (180g)', serving_size_g: 180 },

  // ──────────────── 중식 외식 ────────────────
  { id: 'kr-219', name: '깐풍기', aliases: ['깐풍', '깐풍새우'], calories: 480, protein: 28.0, carbs: 38.0, fat: 22.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-220', name: '양장피', aliases: ['양장피볶음', '중화잡채'], calories: 380, protein: 20.0, carbs: 42.0, fat: 14.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-221', name: '팔보채', aliases: ['팔보', '해물팔보채'], calories: 350, protein: 22.0, carbs: 30.0, fat: 14.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-222', name: '유산슬', aliases: ['유슬', '유산슬볶음'], calories: 320, protein: 20.0, carbs: 28.0, fat: 12.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-223', name: '라조기', aliases: ['라조닭', '매운닭볶음'], calories: 440, protein: 30.0, carbs: 28.0, fat: 22.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-224', name: '훠궈', aliases: ['마라훠궈', '중국전골'], calories: 450, protein: 30.0, carbs: 25.0, fat: 25.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-225', name: '마라탕', aliases: ['마라', '마라샹궈', '마라상궈'], calories: 500, protein: 25.0, carbs: 35.0, fat: 28.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-226', name: '딤섬', aliases: ['하카오', '슈마이', '딤섬세트'], calories: 320, protein: 14.0, carbs: 38.0, fat: 12.0, serving_size: '1인분 (150g)', serving_size_g: 150 },

  // ──────────────── 일식 외식 ────────────────
  { id: 'kr-227', name: '우나동', aliases: ['장어덮밥', '장어', '장어구이덮밥'], calories: 620, protein: 22.0, carbs: 88.0, fat: 18.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-228', name: '오코노미야키', aliases: ['오꼬노미야끼', '일본부침개'], calories: 420, protein: 16.0, carbs: 52.0, fat: 16.0, serving_size: '1장 (250g)', serving_size_g: 250 },
  { id: 'kr-229', name: '오야코동', aliases: ['닭달걀덮밥', '오야꼬동'], calories: 640, protein: 28.0, carbs: 85.0, fat: 20.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-230', name: '돈코츠라멘', aliases: ['돼지뼈라멘', '하카타라멘', '진한라멘'], calories: 680, protein: 26.0, carbs: 88.0, fat: 22.0, serving_size: '1그릇 (600g)', serving_size_g: 600 },
  { id: 'kr-231', name: '냉우동', aliases: ['자루우동', '자루소바', '냉면우동'], calories: 380, protein: 12.0, carbs: 74.0, fat: 3.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-232', name: '규카츠', aliases: ['소고기카츠', '규카츠정식'], calories: 580, protein: 30.0, carbs: 50.0, fat: 28.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-233', name: '회전초밥', aliases: ['회전스시', '스시바'], calories: 400, protein: 18.0, carbs: 60.0, fat: 10.0, serving_size: '10피스 (250g)', serving_size_g: 250 },
  { id: 'kr-234', name: '일식코스', aliases: ['오마카세', '일식정식'], calories: 700, protein: 40.0, carbs: 75.0, fat: 22.0, serving_size: '1세트 (450g)', serving_size_g: 450 },

  // ──────────────── 패스트푸드/버거 ────────────────
  { id: 'kr-235', name: '감자튀김', aliases: ['후렌치후라이', '프라이', '포테이토'], calories: 340, protein: 4.0, carbs: 44.0, fat: 17.0, serving_size: '1봉 (150g)', serving_size_g: 150 },
  { id: 'kr-236', name: '치킨너겟', aliases: ['너겟', '맥너겟', '치킨텐더'], calories: 320, protein: 16.0, carbs: 28.0, fat: 16.0, serving_size: '10개 (150g)', serving_size_g: 150 },
  { id: 'kr-237', name: '불고기버거', aliases: ['맥불', '불버거', '한국식버거'], calories: 490, protein: 24.0, carbs: 50.0, fat: 22.0, serving_size: '1개 (200g)', serving_size_g: 200 },
  { id: 'kr-238', name: '치즈버거', aliases: ['더블치즈버거', '치즈'], calories: 510, protein: 26.0, carbs: 44.0, fat: 26.0, serving_size: '1개 (200g)', serving_size_g: 200 },
  { id: 'kr-239', name: '치킨버거', aliases: ['크리스피치킨버거', '치킨샌드'], calories: 520, protein: 28.0, carbs: 46.0, fat: 24.0, serving_size: '1개 (200g)', serving_size_g: 200 },
  { id: 'kr-240', name: '더블버거', aliases: ['빅버거', '빅맥', '와퍼'], calories: 580, protein: 30.0, carbs: 48.0, fat: 30.0, serving_size: '1개 (220g)', serving_size_g: 220 },
  { id: 'kr-241', name: '치킨윙', aliases: ['핫윙', '버팔로윙', '윙', '봉'], calories: 420, protein: 30.0, carbs: 20.0, fat: 26.0, serving_size: '6개 (200g)', serving_size_g: 200 },
  { id: 'kr-242', name: '버거세트', aliases: ['버거콤보', '세트메뉴'], calories: 900, protein: 35.0, carbs: 100.0, fat: 38.0, serving_size: '1세트 (버거+감튀+음료)', serving_size_g: 400 },

  // ──────────────── 치킨 추가 ────────────────
  { id: 'kr-243', name: '간장치킨', aliases: ['간장양념치킨', '달콤간장치킨'], calories: 820, protein: 55.0, carbs: 38.0, fat: 48.0, serving_size: '반마리 (350g)', serving_size_g: 350 },
  { id: 'kr-244', name: '마늘치킨', aliases: ['마늘간장치킨', '통마늘치킨'], calories: 850, protein: 55.0, carbs: 42.0, fat: 50.0, serving_size: '반마리 (350g)', serving_size_g: 350 },
  { id: 'kr-245', name: '순살치킨', aliases: ['순살', '순살후라이드', '뼈없는치킨'], calories: 760, protein: 58.0, carbs: 35.0, fat: 44.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-246', name: '치킨봉', aliases: ['치킨봉스틱', '닭봉'], calories: 380, protein: 28.0, carbs: 22.0, fat: 20.0, serving_size: '5개 (200g)', serving_size_g: 200 },

  // ──────────────── 피자 ────────────────
  { id: 'kr-247', name: '페퍼로니피자', aliases: ['페퍼로니', '살라미피자'], calories: 280, protein: 14.0, carbs: 32.0, fat: 12.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-248', name: '불고기피자', aliases: ['한국식피자'], calories: 300, protein: 16.0, carbs: 35.0, fat: 12.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-249', name: '콤비네이션피자', aliases: ['콤비네이션', '모둠피자'], calories: 290, protein: 14.0, carbs: 33.0, fat: 12.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-250', name: '마르게리타피자', aliases: ['치즈피자', '마르게리타'], calories: 270, protein: 12.0, carbs: 34.0, fat: 10.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-251', name: '포테이토피자', aliases: ['감자피자', '포테이토'], calories: 310, protein: 12.0, carbs: 38.0, fat: 12.0, serving_size: '1조각 (120g)', serving_size_g: 120 },

  // ──────────────── 이탈리안 ────────────────
  { id: 'kr-252', name: '알리오올리오', aliases: ['갈릭파스타', '알리오'], calories: 550, protein: 14.0, carbs: 78.0, fat: 20.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-253', name: '봉골레파스타', aliases: ['봉골레', '조개파스타', '클램파스타'], calories: 520, protein: 20.0, carbs: 74.0, fat: 16.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-254', name: '라자냐', aliases: ['라자니아'], calories: 450, protein: 22.0, carbs: 45.0, fat: 20.0, serving_size: '1인분 (250g)', serving_size_g: 250 },
  { id: 'kr-255', name: '미트볼파스타', aliases: ['미트볼스파게티', '미트볼'], calories: 600, protein: 26.0, carbs: 72.0, fat: 22.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-256', name: '티라미수', aliases: ['이탈리아디저트'], calories: 380, protein: 6.0, carbs: 42.0, fat: 20.0, serving_size: '1조각 (120g)', serving_size_g: 120 },
  { id: 'kr-257', name: '뇨키', aliases: ['감자뇨키', '크림뇨키'], calories: 420, protein: 10.0, carbs: 68.0, fat: 12.0, serving_size: '1인분 (250g)', serving_size_g: 250 },

  // ──────────────── 기타 외국 음식 ────────────────
  { id: 'kr-258', name: '쌀국수', aliases: ['포', '베트남쌀국수', '쌀면', '베트남국수'], calories: 480, protein: 22.0, carbs: 78.0, fat: 8.0, serving_size: '1그릇 (450g)', serving_size_g: 450 },
  { id: 'kr-259', name: '팟타이', aliases: ['태국볶음면', '팟타이면'], calories: 520, protein: 18.0, carbs: 72.0, fat: 18.0, serving_size: '1인분 (350g)', serving_size_g: 350 },
  { id: 'kr-260', name: '월남쌈', aliases: ['라이스페이퍼롤', '스프링롤', '생춘권'], calories: 280, protein: 16.0, carbs: 35.0, fat: 8.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-261', name: '타코', aliases: ['멕시코타코', '타코스'], calories: 350, protein: 18.0, carbs: 32.0, fat: 16.0, serving_size: '2개 (200g)', serving_size_g: 200 },
  { id: 'kr-262', name: '부리또', aliases: ['부리토', '치킨부리또'], calories: 580, protein: 26.0, carbs: 68.0, fat: 20.0, serving_size: '1개 (280g)', serving_size_g: 280 },
  { id: 'kr-263', name: '나초', aliases: ['치즈나초', '살사나초'], calories: 380, protein: 10.0, carbs: 46.0, fat: 18.0, serving_size: '1접시 (150g)', serving_size_g: 150 },
  { id: 'kr-264', name: '그릭요거트볼', aliases: ['요거트볼', '아사이볼', '스무디볼'], calories: 350, protein: 10.0, carbs: 52.0, fat: 10.0, serving_size: '1그릇 (300g)', serving_size_g: 300 },

  // ──────────────── 카페/브런치 ────────────────
  { id: 'kr-265', name: '에그베네딕트', aliases: ['에그베네', '홀랜다이즈에그'], calories: 480, protein: 22.0, carbs: 30.0, fat: 32.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-266', name: '프렌치토스트', aliases: ['꿀토스트', '에그토스트'], calories: 320, protein: 8.0, carbs: 42.0, fat: 14.0, serving_size: '2장 (150g)', serving_size_g: 150 },
  { id: 'kr-267', name: '베이컨에그토스트', aliases: ['BLT', '베이컨토스트', '클럽샌드위치'], calories: 420, protein: 22.0, carbs: 30.0, fat: 24.0, serving_size: '1인분 (180g)', serving_size_g: 180 },
  { id: 'kr-268', name: '브런치세트', aliases: ['브런치', '아침세트'], calories: 650, protein: 28.0, carbs: 55.0, fat: 35.0, serving_size: '1세트 (350g)', serving_size_g: 350 },
  { id: 'kr-269', name: '크로크무슈', aliases: ['크로크마담', '치즈햄토스트'], calories: 420, protein: 18.0, carbs: 38.0, fat: 22.0, serving_size: '1개 (150g)', serving_size_g: 150 },
  { id: 'kr-270', name: '아보카도토스트', aliases: ['아보카도빵', '아보토스트'], calories: 320, protein: 8.0, carbs: 30.0, fat: 20.0, serving_size: '1조각 (180g)', serving_size_g: 180 },

  // ──────────────── 분식 추가 ────────────────
  { id: 'kr-271', name: '치즈떡볶이', aliases: ['치즈떡뽁이', '로제치즈떡볶이'], calories: 480, protein: 14.0, carbs: 80.0, fat: 12.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-272', name: '쫄면', aliases: ['쫄면비빔', '냉쫄면'], calories: 430, protein: 12.0, carbs: 80.0, fat: 8.0, serving_size: '1그릇 (350g)', serving_size_g: 350 },
  { id: 'kr-273', name: '오뎅탕', aliases: ['어묵탕', '오뎅꼬치탕'], calories: 150, protein: 10.0, carbs: 12.0, fat: 6.0, serving_size: '1그릇 (300g)', serving_size_g: 300 },
  { id: 'kr-274', name: '계란김밥', aliases: ['계란말이김밥', '충무김밥'], calories: 420, protein: 14.0, carbs: 68.0, fat: 10.0, serving_size: '1줄 (240g)', serving_size_g: 240 },
  { id: 'kr-275', name: '만두전골', aliases: ['만두국전골', '만두전골냄비'], calories: 380, protein: 16.0, carbs: 48.0, fat: 12.0, serving_size: '1인분 (350g)', serving_size_g: 350 },

  // ──────────────── 배달/야식 인기 ────────────────
  { id: 'kr-276', name: '닭발', aliases: ['매운닭발', '닭발볶음', '불닭발'], calories: 400, protein: 24.0, carbs: 20.0, fat: 26.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-277', name: '치즈돈까스', aliases: ['치즈카츠', '치즈돈가스'], calories: 680, protein: 30.0, carbs: 55.0, fat: 36.0, serving_size: '1인분 (280g)', serving_size_g: 280 },
  { id: 'kr-278', name: '파스타세트', aliases: ['파스타코스', '파스타정식'], calories: 750, protein: 22.0, carbs: 90.0, fat: 30.0, serving_size: '1세트 (400g)', serving_size_g: 400 },
  { id: 'kr-279', name: '사케동', aliases: ['연어덮밥', '일식덮밥'], calories: 560, protein: 28.0, carbs: 72.0, fat: 16.0, serving_size: '1그릇 (400g)', serving_size_g: 400 },
  { id: 'kr-280', name: '뼈찜', aliases: ['등갈비찜', '돼지뼈찜', '찜갈비'], calories: 520, protein: 35.0, carbs: 28.0, fat: 28.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-281', name: '감바스', aliases: ['감바스알아히요', '새우감바스'], calories: 420, protein: 22.0, carbs: 8.0, fat: 35.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-282', name: '불닭', aliases: ['불닭볶음', '매운불닭', '불닭파스타'], calories: 540, protein: 38.0, carbs: 35.0, fat: 28.0, serving_size: '1인분 (300g)', serving_size_g: 300 },
  { id: 'kr-283', name: '연어스테이크', aliases: ['구운연어', '연어필레'], calories: 350, protein: 32.0, carbs: 2.0, fat: 24.0, serving_size: '1인분 (200g)', serving_size_g: 200 },
  { id: 'kr-284', name: '한우구이', aliases: ['한우', '한우채끝', '한우등심'], calories: 460, protein: 36.0, carbs: 0.0, fat: 34.0, serving_size: '1인분 (150g)', serving_size_g: 150 },
  { id: 'kr-285', name: '스시오마카세', aliases: ['오마카세', '스시코스'], calories: 750, protein: 42.0, carbs: 80.0, fat: 22.0, serving_size: '1코스 (350g)', serving_size_g: 350 },
]

/**
 * 한글/영문 쿼리로 내장 한식 DB 검색
 * - 음식명, 별명에서 부분 일치 검색
 * - 최대 10개 반환
 */
export function searchKoreanFoods(query: string): KoreanFoodEntry[] {
  if (!query || query.trim().length === 0) return []
  const q = query.trim().toLowerCase()

  return KOREAN_FOODS_DB.filter((food) => {
    if (food.name.toLowerCase().includes(q)) return true
    if (food.aliases?.some((a) => a.toLowerCase().includes(q))) return true
    return false
  }).slice(0, 10)
}
