/**
 * @deprecated Supabase foods 테이블의 name_en 컬럼으로 이전됨 (015_foods_table.sql + seeds/foods.sql)
 *
 * 내장 한식 DB 영문명 맵
 * - ID → 영문 음식명
 * - getEnglishAlias()에서 name_en보다 먼저 참조
 * - kr-286 이후(캐나다/서양/인도 등)는 이미 aliases에 영문이 있어 자동 처리됨
 */
export const FOOD_EN_NAMES: Record<string, string> = {
  // ── 밥류 ──
  'kr-001': 'Steamed White Rice',
  'kr-002': 'Mixed Grain Rice',
  'kr-003': 'Brown Rice',
  'kr-004': 'Fried Rice',
  'kr-005': 'Kimchi Fried Rice',
  'kr-006': 'Bibimbap',
  'kr-007': 'Omurice (Egg Fried Rice)',
  'kr-008': 'Ssambap (Lettuce Wrap Rice)',
  'kr-009': 'Rice Ball',
  'kr-010': 'Stone Pot Bibimbap',

  // ── 국/찌개류 ──
  'kr-011': 'Doenjang Jjigae (Soybean Paste Stew)',
  'kr-012': 'Kimchi Jjigae (Kimchi Stew)',
  'kr-013': 'Sundubu Jjigae (Soft Tofu Stew)',
  'kr-014': 'Miyeok Guk (Seaweed Soup)',
  'kr-015': 'Kongnamul Guk (Bean Sprout Soup)',
  'kr-016': 'Yukgaejang (Spicy Beef Soup)',
  'kr-017': 'Budae Jjigae (Army Stew)',
  'kr-018': 'Gamjatang (Pork Bone Stew)',
  'kr-019': 'Cheonggukjang Jjigae (Fermented Soybean Stew)',
  'kr-020': 'Seafood Soft Tofu Stew',
  'kr-021': 'Galbitang (Beef Short Rib Soup)',
  'kr-022': 'Seolleongtang (Ox Bone Soup)',
  'kr-023': 'Samgyetang (Ginseng Chicken Soup)',
  'kr-024': 'Haejangguk (Hangover Soup)',
  'kr-025': 'Dongtae Jjigae (Pollock Stew)',
  'kr-026': 'Kongbiji Jjigae (Soybean Curd Stew)',

  // ── 고기/구이류 ──
  'kr-027': 'Samgyeopsal (Grilled Pork Belly)',
  'kr-028': 'Bulgogi (Korean Marinated Beef)',
  'kr-029': 'Braised Spicy Chicken',
  'kr-030': 'Galbi Jjim (Braised Short Ribs)',
  'kr-031': 'Jeyuk Bokkeum (Spicy Pork Stir-fry)',
  'kr-032': 'Dak Galbi (Spicy Stir-fried Chicken)',
  'kr-033': 'Bossam (Boiled Pork Wrap)',
  'kr-034': 'Pork Rice Soup (Dwaeji Gukbap)',
  'kr-035': 'Beef & Radish Soup',
  'kr-036': 'Squid & Pork Belly Stir-fry',
  'kr-037': 'Beef Ribeye (Korean BBQ)',
  'kr-038': 'Chicken Breast',

  // ── 생선/해산물 ──
  'kr-039': 'Grilled Mackerel',
  'kr-040': 'Grilled Yellow Croaker',
  'kr-041': 'Grilled Pacific Saury',
  'kr-042': 'Grilled Hairtail Fish',
  'kr-043': 'Spicy Stir-fried Octopus',
  'kr-044': 'Spicy Stir-fried Squid',
  'kr-045': 'Seafood Scallion Pancake (Haemul Pajeon)',
  'kr-046': 'Grilled Dried Pollack',
  'kr-047': 'Stir-fried Shrimp',
  'kr-048': 'Oyster Rice Soup',

  // ── 반찬류 ──
  'kr-049': 'Kimchi',
  'kr-050': 'Kkakdugi (Radish Kimchi)',
  'kr-051': 'Fried Egg',
  'kr-052': 'Rolled Egg Omelette (Gyeran Mari)',
  'kr-053': 'Braised Tofu',
  'kr-054': 'Seasoned Spinach',
  'kr-055': 'Seasoned Bean Sprouts',
  'kr-056': 'Stir-fried Dried Anchovies',
  'kr-057': 'Stir-fried Mushrooms',
  'kr-058': 'Stir-fried Potato',
  'kr-059': 'Japchae (Glass Noodles & Vegetables)',
  'kr-060': 'Braised Lotus Root',
  'kr-061': 'Seasoned Bellflower Root (Doraji)',
  'kr-062': 'Stir-fried Zucchini',
  'kr-063': 'Seasoned Radish (Musaengchae)',
  'kr-064': 'Seasoned Dried Pollack',
  'kr-065': 'Seasoned Dried Radish Greens',

  // ── 면/분식류 ──
  'kr-066': 'Instant Ramen',
  'kr-067': 'Jajangmyeon (Black Bean Noodles)',
  'kr-068': 'Jjamppong (Spicy Seafood Noodle Soup)',
  'kr-069': 'Naengmyeon (Cold Noodles)',
  'kr-070': 'Kalguksu (Knife-cut Noodle Soup)',
  'kr-071': 'Gimbap (Korean Rice Roll)',
  'kr-072': 'Tteokbokki (Spicy Rice Cakes)',
  'kr-073': 'Sundae (Korean Blood Sausage)',
  'kr-074': 'Korean Tempura (Twigim)',
  'kr-075': 'Udon Noodle Soup',
  'kr-076': 'Janchi Guksu (Thin Noodle Soup)',
  'kr-077': 'Sujebi (Hand-torn Noodle Soup)',
  'kr-078': 'Bibim Guksu (Spicy Mixed Noodles)',
  'kr-079': 'Kong Guksu (Cold Soy Milk Noodles)',
  'kr-080': 'Rabokki (Ramen & Rice Cakes)',
  'kr-081': 'Cup Noodles',

  // ── 패스트푸드/간식류 ──
  'kr-082': 'Fried Chicken (Half)',
  'kr-083': 'Pizza Slice',
  'kr-084': 'Hamburger',
  'kr-085': 'Triangle Gimbap (Onigiri)',
  'kr-086': 'Bungeobbang (Fish-shaped Pastry)',
  'kr-087': 'Hotteok (Sweet Korean Pancake)',
  'kr-088': 'Eomuk (Fish Cake Skewer)',
  'kr-089': 'Corn Dog',
  'kr-090': 'Korean Rice Cake (Tteok)',
  'kr-091': 'White Bread',
  'kr-092': 'Sandwich',
  'kr-093': 'Donut',
  'kr-094': 'Croissant',
  'kr-095': 'Tangsuyuk (Sweet & Sour Pork)',

  // ── 과일/채소 ──
  'kr-096': 'Apple',
  'kr-097': 'Banana',
  'kr-098': 'Tangerine',
  'kr-099': 'Strawberry',
  'kr-100': 'Grapes',
  'kr-101': 'Tomato',
  'kr-102': 'Watermelon',
  'kr-103': 'Korean Pear',
  'kr-104': 'Peach',
  'kr-105': 'Kiwi',
  'kr-106': 'Persimmon',
  'kr-107': 'Sweet Potato',
  'kr-108': 'Potato',

  // ── 음료/기타 ──
  'kr-109': 'Americano Coffee',
  'kr-110': 'Café Latte',
  'kr-111': 'Milk',
  'kr-112': 'Soy Milk',
  'kr-113': 'Orange Juice',
  'kr-114': 'Beer',
  'kr-115': 'Soju (Korean Spirit)',
  'kr-116': 'Makgeolli (Korean Rice Wine)',
  'kr-117': 'Green Tea',
  'kr-118': 'Sports Drink',
  'kr-119': 'Ice Cream',
  'kr-120': 'Yogurt',

  // ── 한식 특별 메뉴 ──
  'kr-121': 'Grilled Pork Ribs (Dwaeji Galbi)',
  'kr-122': 'Large Pan Jajang Noodles',
  'kr-123': "Jokbal (Braised Pig's Feet)",
  'kr-124': 'Sundae Gukbap (Sausage Rice Soup)',
  'kr-125': 'Gomtang (Beef Bone Soup)',

  // ── 죽류 ──
  'kr-126': 'Plain Rice Porridge (Juk)',
  'kr-127': 'Pumpkin Porridge',
  'kr-128': 'Patjuk (Red Bean Porridge)',
  'kr-129': 'Abalone Porridge',
  'kr-130': 'Chicken Porridge',

  // ── 덮밥류 ──
  'kr-131': 'Beef Rice Bowl',
  'kr-132': 'Tuna Mayo Rice Bowl',
  'kr-133': 'Katsudon (Pork Cutlet Rice Bowl)',
  'kr-134': 'Salmon Rice Bowl',
  'kr-135': 'Mapo Tofu Rice Bowl',
  'kr-136': 'Vegetable Rice Bowl',
  'kr-137': 'Chicken Rice Bowl',

  // ── 국/찌개 추가 ──
  'kr-138': 'Tteokguk (Rice Cake Soup)',
  'kr-139': 'Manduguk (Dumpling Soup)',
  'kr-140': 'Fish Roe Soup (Altang)',
  'kr-141': 'Spicy Chicken Soup (Dak Gaejang)',
  'kr-142': 'Dried Pollack Soup (Bugeo Guk)',

  // ── 전/부침류 ──
  'kr-143': 'Kimchi Pancake (Kimchi Jeon)',
  'kr-144': 'Potato Pancake (Gamja Jeon)',
  'kr-145': 'Steamed Egg (Gyeran Jjim)',
  'kr-146': 'Mung Bean Pancake (Bindaetteok)',
  'kr-147': 'Korean Meat Patties (Donggraebaeng)',

  // ── 반찬 추가 ──
  'kr-148': 'Jangjorim (Soy-braised Beef)',
  'kr-149': 'Seasoned Perilla Leaves',
  'kr-150': 'Soy-braised Black Beans',
  'kr-151': 'Stir-fried Fish Cake (Eomuk Bokkeum)',
  'kr-152': 'Seasoned Bracken Fern',
  'kr-153': 'Stir-fried Seaweed Stems',
  'kr-154': 'Seasoned Wild Greens',
  'kr-155': 'Stir-fried Garlic Stems',

  // ── 일식류 ──
  'kr-156': 'Sushi',
  'kr-157': 'Donkatsu (Pork Cutlet)',
  'kr-158': 'Japanese Ramen',
  'kr-159': 'Soba Noodles',
  'kr-160': 'Takoyaki (Octopus Balls)',
  'kr-161': 'Nabe (Japanese Hot Pot)',
  'kr-162': 'Tendon (Tempura Rice Bowl)',

  // ── 양식류 ──
  'kr-163': 'Spaghetti (Tomato Sauce)',
  'kr-164': 'Cream Pasta (Carbonara)',
  'kr-165': 'Risotto',
  'kr-166': 'Salad',
  'kr-167': 'Steak',
  'kr-168': 'Omelette',
  'kr-169': 'Grilled Chicken Salad',
  'kr-170': 'Cream Soup',

  // ── 디저트/간식 추가 ──
  'kr-171': 'Cheesecake',
  'kr-172': 'Chocolate Cake',
  'kr-173': 'Macaron',
  'kr-174': 'Patbingsu (Shaved Ice)',
  'kr-175': 'Chapssal Tteok (Mochi Rice Cake)',
  'kr-176': 'Waffle',
  'kr-177': 'Pancakes',
  'kr-178': 'Cookies',

  // ── 건강식/다이어트식 ──
  'kr-179': 'Oatmeal',
  'kr-180': 'Avocado',
  'kr-181': 'Granola',
  'kr-182': 'Protein Shake',
  'kr-183': 'Tofu Salad',

  // ── 즉석/편의식 ──
  'kr-184': 'Instant Rice',
  'kr-185': 'Korean Dumplings (Mandu)',
  'kr-186': 'Spam (Canned Ham)',
  'kr-187': 'Canned Tuna',
  'kr-188': 'Lunchbox Set',

  // ── 추가 인기 메뉴 ──
  'kr-189': 'Dubu Kimchi (Tofu & Kimchi)',
  'kr-190': 'Stir-fried Kimchi',
  'kr-191': 'Doenjang Guk (Light Soybean Soup)',
  'kr-192': 'Stir-fried Sausage',
  'kr-193': 'Stir-fried Chicken',
  'kr-194': 'Curry Rice',
  'kr-195': 'Rice Bowl Sauce',
  'kr-196': 'Vegetable Rice (Namul Rice)',
  'kr-197': 'Whole Braised Chicken',
  'kr-198': 'Bulgogi Hot Pot',
  'kr-199': 'Suyuk (Boiled Pork Slices)',
  'kr-200': 'Freshwater Fish Noodle Soup',

  // ── 한국 구이/외식 고기 ──
  'kr-201': 'Hangjeongsal (Pork Collar)',
  'kr-202': 'Thin-sliced Pork Belly (Daepae)',
  'kr-203': 'Galmaegisal (Pork Skirt Meat)',
  'kr-204': 'Chadolbaegi (Beef Brisket Slices)',
  'kr-205': 'Gopchang (Grilled Intestines)',
  'kr-206': 'Makchang (Grilled Large Intestine)',
  'kr-207': 'Jjimdak (Braised Chicken & Vegetables)',
  'kr-208': 'Agwijjim (Spicy Braised Monkfish)',
  'kr-209': 'Dakgangjeong (Crispy Sweet Chicken)',
  'kr-210': 'Spicy Stir-fried Baby Octopus',

  // ── 해산물 외식 ──
  'kr-211': 'Ganjang Gejang (Soy-marinated Crab)',
  'kr-212': 'Yangnyeom Gejang (Spicy Marinated Crab)',
  'kr-213': 'Blue Crab Stew',
  'kr-214': 'Seafood Hot Pot',
  'kr-215': 'Flatfish Sashimi (Gwangeo Hoe)',
  'kr-216': 'Salmon Sashimi',
  'kr-217': 'Steamed Snow Crab (Daege)',
  'kr-218': 'Grilled Shrimp',

  // ── 중식 외식 ──
  'kr-219': 'Gganpunggi (Crispy Chicken in Spicy Sauce)',
  'kr-220': 'Yangjeongpi (Chinese Stir-fry Platter)',
  'kr-221': 'Palbochae (Eight Treasure Stir-fry)',
  'kr-222': 'Yusanseul (Chinese Pork & Seafood Stir-fry)',
  'kr-223': 'Razogi (Spicy Chinese Chicken)',
  'kr-224': 'Hot Pot (Chinese Style)',
  'kr-225': 'Malatang (Spicy Broth Pot)',
  'kr-226': 'Dim Sum',

  // ── 일식 외식 ──
  'kr-227': 'Unadon (Eel Rice Bowl)',
  'kr-228': 'Okonomiyaki (Japanese Savory Pancake)',
  'kr-229': 'Oyakodon (Chicken & Egg Rice Bowl)',
  'kr-230': 'Tonkotsu Ramen (Pork Bone Ramen)',
  'kr-231': 'Cold Udon',
  'kr-232': 'Gyukatsu (Beef Cutlet)',
  'kr-233': 'Conveyor Belt Sushi',
  'kr-234': 'Japanese Course Meal',

  // ── 패스트푸드/버거 ──
  'kr-235': 'French Fries',
  'kr-236': 'Chicken Nuggets',
  'kr-237': 'Bulgogi Burger',
  'kr-238': 'Cheeseburger',
  'kr-239': 'Crispy Chicken Burger',
  'kr-240': 'Double Burger',
  'kr-241': 'Chicken Wings',
  'kr-242': 'Burger Combo Set',

  // ── 치킨 추가 ──
  'kr-243': 'Soy Garlic Chicken (Half)',
  'kr-244': 'Garlic Chicken (Half)',
  'kr-245': 'Boneless Fried Chicken',
  'kr-246': 'Chicken Drumettes',

  // ── 피자 ──
  'kr-247': 'Pepperoni Pizza Slice',
  'kr-248': 'Bulgogi Pizza Slice',
  'kr-249': 'Combination Pizza Slice',
  'kr-250': 'Margherita Pizza Slice',
  'kr-251': 'Potato Pizza Slice',

  // ── 이탈리안 ──
  'kr-252': 'Aglio e Olio Pasta',
  'kr-253': 'Vongole Pasta (Clam Pasta)',
  'kr-254': 'Lasagna',
  'kr-255': 'Meatball Spaghetti',
  'kr-256': 'Tiramisu',
  'kr-257': 'Gnocchi',

  // ── 기타 외국 음식 ──
  'kr-258': 'Pho (Vietnamese Noodle Soup)',
  'kr-259': 'Pad Thai',
  'kr-260': 'Vietnamese Spring Rolls (Goi Cuon)',
  'kr-261': 'Tacos',
  'kr-262': 'Burrito',
  'kr-263': 'Nachos',
  'kr-264': 'Greek Yogurt Bowl',

  // ── 카페/브런치 ──
  'kr-265': 'Eggs Benedict',
  'kr-266': 'French Toast',
  'kr-267': 'BLT Sandwich',
  'kr-268': 'Brunch Set',
  'kr-269': 'Croque Monsieur',
  'kr-270': 'Avocado Toast',

  // ── 분식 추가 ──
  'kr-271': 'Cheese Tteokbokki',
  'kr-272': 'Jjolmyeon (Chewy Spicy Noodles)',
  'kr-273': 'Fish Cake Soup (Eomuk Tang)',
  'kr-274': 'Egg Gimbap',
  'kr-275': 'Dumpling Hot Pot',

  // ── 배달/야식 인기 ──
  'kr-276': 'Spicy Chicken Feet (Dak Bal)',
  'kr-277': 'Cheese Pork Cutlet',
  'kr-278': 'Pasta Set',
  'kr-279': 'Salmon Rice Bowl (Sake Don)',
  'kr-280': 'Braised Pork Bones',
  'kr-281': 'Gambas al Ajillo (Garlic Shrimp)',
  'kr-282': 'Buldak (Fire Chicken)',
  'kr-283': 'Salmon Steak',
  'kr-284': 'Korean Wagyu Beef',
  'kr-285': 'Sushi Omakase Course',

  // ── 캐나다 특산 (기존 영문 alias로 커버되지 않는 항목) ──
  'kr-292': 'Maple Pancakes',
}
