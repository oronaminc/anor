-- =====================================================================
-- Seed data — 8 realistic Myeongdong street foods
-- Coordinates are real-ish points around Myeongdong, Seoul.
-- Run after 0001_init.sql.
-- =====================================================================

insert into public.foods
  (name_ko, name_en, description, category, lat, lng, address,
   youtube_shorts_url, thumbnail_url, hashtags, view_count, is_trending, price_range)
values
  (
    '떡볶이', 'Tteokbokki',
    '쫄깃한 가래떡과 매콤달콤한 고추장 양념이 어우러진 명동 대표 길거리 음식. 어묵, 삶은 계란과 함께 즐겨보세요.',
    '분식', 37.563600, 126.985700, '서울 중구 명동길 14',
    'https://www.youtube.com/shorts/ZpM0pZ8wMqA',
    'https://images.unsplash.com/photo-1635963662299-3a9f4f9f0f53?w=800&q=80',
    array['매콤', '분식', '명동맛집', '떡볶이'],
    1820, true, '₩3,000~5,000'
  ),
  (
    '호떡', 'Hotteok',
    '바삭한 겉면 속에 흑설탕과 견과류가 가득. 겨울 명동을 대표하는 따끈한 간식입니다.',
    '간식', 37.563900, 126.982900, '서울 중구 명동8길 21',
    'https://www.youtube.com/shorts/3sJf9bq5mWk',
    'https://images.unsplash.com/photo-1612888077835-1c1b8c1b6f0f?w=800&q=80',
    array['겨울간식', '호떡', '달달', '명동'],
    2410, true, '₩2,000~3,000'
  ),
  (
    '계란빵', 'Gyeranppang',
    '폭신한 빵 위에 통계란을 얹어 구운 든든한 길거리 간식. 고소하고 달콤합니다.',
    '간식', 37.561200, 126.985900, '서울 중구 명동길 27',
    'https://www.youtube.com/shorts/9aQp1mD2kL0',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    array['계란빵', '아침대용', '고소함', '간식'],
    980, false, '₩2,000~3,000'
  ),
  (
    '왕만두', 'Wang Mandu',
    '김이 모락모락 나는 손만두. 고기만두와 김치만두 모두 인기 만점입니다.',
    '분식', 37.562500, 126.984100, '서울 중구 명동2길 32',
    'https://www.youtube.com/shorts/k2Lp9sQ7wDc',
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80',
    array['만두', '왕만두', '김치만두', '든든'],
    1340, false, '₩4,000~6,000'
  ),
  (
    '회오리 감자', 'Tornado Potato',
    '감자를 회오리 모양으로 깎아 튀긴 바삭한 간식. 다양한 시즈닝을 골라보세요.',
    '간식', 37.563100, 126.983500, '서울 중구 명동길 18',
    'https://www.youtube.com/shorts/Tq8wZ1nP4xY',
    'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=800&q=80',
    array['회오리감자', '바삭', '인스타', '간식'],
    1675, true, '₩4,000~5,000'
  ),
  (
    '닭꼬치', 'Dak-kkochi',
    '숯불에 구워 매콤달콤 양념을 바른 닭꼬치. 한 손에 들고 명동 거리를 걸어보세요.',
    '꼬치', 37.560900, 126.986300, '서울 중구 명동길 31',
    'https://www.youtube.com/shorts/Bn4kL0qR9sM',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80',
    array['닭꼬치', '숯불', '매콤', '꼬치'],
    1120, false, '₩3,000~4,000'
  ),
  (
    '치즈 랍스터', 'Cheese Lobster',
    '반으로 가른 랍스터 위에 모짜렐라 치즈를 듬뿍 올려 토치로 구운 명동 명물.',
    '해산물', 37.564200, 126.984800, '서울 중구 명동길 12',
    'https://www.youtube.com/shorts/Lr7cH2zX5pQ',
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
    array['치즈랍스터', '명동명물', '비주얼', '해산물'],
    3015, true, '₩15,000~20,000'
  ),
  (
    '붕어빵', 'Bungeoppang',
    '팥이 가득 들어간 따끈한 붕어빵. 슈크림 버전도 함께 판매합니다.',
    '간식', 37.562000, 126.983000, '서울 중구 명동7길 8',
    'https://www.youtube.com/shorts/Pf3nQ8wK1aB',
    'https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=800&q=80',
    array['붕어빵', '팥', '겨울간식', '추억'],
    760, false, '₩2,000~3,000'
  );
