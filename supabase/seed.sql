-- =====================================================================
-- Seed data — 8 realistic Myeongdong street foods (multilingual)
-- Coordinates are real-ish points around Myeongdong, Seoul.
-- Run after 0001_init.sql and 0002_i18n.sql.
-- =====================================================================

insert into public.foods
  (name_ko, name_en, name_ja, name_es, description, translations, category,
   lat, lng, address, youtube_shorts_url, thumbnail_url, hashtags,
   view_count, is_trending, price_range)
values
  (
    '떡볶이', 'Tteokbokki', 'トッポッキ', 'Tteokbokki',
    '쫄깃한 가래떡과 매콤달콤한 고추장 양념이 어우러진 명동 대표 길거리 음식. 어묵, 삶은 계란과 함께 즐겨보세요.',
    jsonb_build_object(
      'en', 'Chewy rice cakes in a sweet-and-spicy gochujang sauce — Myeongdong''s signature street snack. Great with fish cake and boiled eggs.',
      'ja', 'もちもちの餅と甘辛いコチュジャンソースが絡む明洞名物。おでんやゆで卵と一緒にどうぞ。',
      'es', 'Pasteles de arroz masticables en salsa de gochujang agridulce, el clásico de Myeongdong. Rico con pastel de pescado y huevo cocido.'
    ),
    '분식', 37.563600, 126.985700, '서울 중구 명동길 14',
    'https://www.youtube.com/shorts/ZpM0pZ8wMqA', '/demo/tteokbokki.svg',
    array['매콤', '분식', '명동맛집', '떡볶이'], 1820, true, '₩3,000~5,000'
  ),
  (
    '호떡', 'Hotteok', 'ホットク', 'Hotteok',
    '바삭한 겉면 속에 흑설탕과 견과류가 가득. 겨울 명동을 대표하는 따끈한 간식입니다.',
    jsonb_build_object(
      'en', 'Crispy pancake filled with molten brown sugar and nuts — the warm winter treat of Myeongdong.',
      'ja', 'カリッとした生地に黒砂糖とナッツがたっぷり。冬の明洞を代表する温かいおやつ。',
      'es', 'Panqueque crujiente relleno de azúcar moreno fundido y nueces, el dulce caliente del invierno en Myeongdong.'
    ),
    '간식', 37.563900, 126.982900, '서울 중구 명동8길 21',
    'https://www.youtube.com/shorts/3sJf9bq5mWk', '/demo/hotteok.svg',
    array['겨울간식', '호떡', '달달', '명동'], 2410, true, '₩2,000~3,000'
  ),
  (
    '계란빵', 'Gyeranppang', 'ケランパン', 'Gyeranppang',
    '폭신한 빵 위에 통계란을 얹어 구운 든든한 길거리 간식. 고소하고 달콤합니다.',
    jsonb_build_object(
      'en', 'Fluffy bread baked with a whole egg on top — a hearty, savory-sweet street snack.',
      'ja', 'ふわふわのパンに丸ごと卵をのせて焼いた、香ばしくて満足感のある屋台おやつ。',
      'es', 'Pan esponjoso horneado con un huevo entero encima, un bocado callejero sabroso y saciante.'
    ),
    '간식', 37.561200, 126.985900, '서울 중구 명동길 27',
    'https://www.youtube.com/shorts/9aQp1mD2kL0', '/demo/gyeranppang.svg',
    array['계란빵', '아침대용', '고소함', '간식'], 980, false, '₩2,000~3,000'
  ),
  (
    '왕만두', 'Wang Mandu', '왕만두', 'Wang Mandu',
    '김이 모락모락 나는 손만두. 고기만두와 김치만두 모두 인기 만점입니다.',
    jsonb_build_object(
      'en', 'Steaming hand-made dumplings — both the pork and kimchi fillings are crowd favorites.',
      'ja', '湯気立つ手作り餃子。肉まんもキムチまんも大人気。',
      'es', 'Empanadillas artesanales humeantes; tanto las de cerdo como las de kimchi triunfan.'
    ),
    '분식', 37.562500, 126.984100, '서울 중구 명동2길 32',
    'https://www.youtube.com/shorts/k2Lp9sQ7wDc', '/demo/mandu.svg',
    array['만두', '왕만두', '김치만두', '든든'], 1340, false, '₩4,000~6,000'
  ),
  (
    '회오리 감자', 'Tornado Potato', 'トルネードポテト', 'Patata Tornado',
    '감자를 회오리 모양으로 깎아 튀긴 바삭한 간식. 다양한 시즈닝을 골라보세요.',
    jsonb_build_object(
      'en', 'A whole potato spiral-cut and deep-fried until crispy — pick your favorite seasoning.',
      'ja', 'じゃがいもを竜巻状にカットして揚げたサクサクおやつ。好きな味付けを選んで。',
      'es', 'Una patata cortada en espiral y frita hasta quedar crujiente; elige tu condimento favorito.'
    ),
    '간식', 37.563100, 126.983500, '서울 중구 명동길 18',
    'https://www.youtube.com/shorts/Tq8wZ1nP4xY', '/demo/potato.svg',
    array['회오리감자', '바삭', '인스타', '간식'], 1675, true, '₩4,000~5,000'
  ),
  (
    '닭꼬치', 'Dak-kkochi', 'タッコチ', 'Brocheta de Pollo',
    '숯불에 구워 매콤달콤 양념을 바른 닭꼬치. 한 손에 들고 명동 거리를 걸어보세요.',
    jsonb_build_object(
      'en', 'Charcoal-grilled chicken skewers glazed in sweet-spicy sauce — eat one on the go.',
      'ja', '炭火で焼き、甘辛いタレを塗ったチキン串。片手に持って明洞を歩こう。',
      'es', 'Brochetas de pollo a la brasa con salsa agridulce; cómelas mientras paseas.'
    ),
    '꼬치', 37.560900, 126.986300, '서울 중구 명동길 31',
    'https://www.youtube.com/shorts/Bn4kL0qR9sM', '/demo/dakkkochi.svg',
    array['닭꼬치', '숯불', '매콤', '꼬치'], 1120, false, '₩3,000~4,000'
  ),
  (
    '치즈 랍스터', 'Cheese Lobster', 'チーズロブスター', 'Langosta con Queso',
    '반으로 가른 랍스터 위에 모짜렐라 치즈를 듬뿍 올려 토치로 구운 명동 명물.',
    jsonb_build_object(
      'en', 'Half a lobster loaded with mozzarella and torched to bubbly perfection — a Myeongdong icon.',
      'ja', '半分に割ったロブスターにモッツァレラをたっぷりのせ、バーナーで炙った明洞名物。',
      'es', 'Media langosta cubierta de mozzarella y gratinada al soplete, un ícono de Myeongdong.'
    ),
    '해산물', 37.564200, 126.984800, '서울 중구 명동길 12',
    'https://www.youtube.com/shorts/Lr7cH2zX5pQ', '/demo/lobster.svg',
    array['치즈랍스터', '명동명물', '비주얼', '해산물'], 3015, true, '₩15,000~20,000'
  ),
  (
    '붕어빵', 'Bungeoppang', 'たい焼き', 'Bungeoppang',
    '팥이 가득 들어간 따끈한 붕어빵. 슈크림 버전도 함께 판매합니다.',
    jsonb_build_object(
      'en', 'Warm fish-shaped pastry packed with sweet red bean — custard version also available.',
      'ja', 'あんこたっぷりの温かいたい焼き。カスタード味も販売中。',
      'es', 'Bollo caliente en forma de pez relleno de pasta de judía dulce; también con crema.'
    ),
    '간식', 37.562000, 126.983000, '서울 중구 명동7길 8',
    'https://www.youtube.com/shorts/Pf3nQ8wK1aB', '/demo/bungeoppang.svg',
    array['붕어빵', '팥', '겨울간식', '추억'], 760, false, '₩2,000~3,000'
  );
