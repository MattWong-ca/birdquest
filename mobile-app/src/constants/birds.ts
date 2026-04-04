export type Rarity = 'Common' | 'Uncommon' | 'Rare';

export interface Bird {
  id: string;
  name: string;
  scientificName: string;
  rarity: Rarity;
  image: string;
}

export const CANNES_BIRDS: Bird[] = [
  { id: 'b01', name: 'House Sparrow', scientificName: 'Passer domesticus', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/House_sparrow_male_in_Prospect_Park_%2853532%29.jpg' },
  { id: 'b02', name: 'European Robin', scientificName: 'Erithacus rubecula', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Erithacus_rubecula_with_cocked_head.jpg' },
  { id: 'b03', name: 'Common Blackbird', scientificName: 'Turdus merula', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Common_Blackbird.jpg' },
  { id: 'b04', name: 'Yellow-legged Gull', scientificName: 'Larus michahellis', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Yellow-legged_Gull_2023-10-10.jpg' },
  { id: 'b05', name: 'Barn Swallow', scientificName: 'Hirundo rustica', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Rauchschwalbe_Hirundo_rustica.jpg' },
  { id: 'b06', name: 'Common Swift', scientificName: 'Apus apus', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Common_Swift_2025_07_18_02_%28cropped%29.jpg' },
  { id: 'b07', name: 'Great Tit', scientificName: 'Parus major', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Great_tit_%28Parus_major%29%2C_Parc_du_Rouge-Cloitre%2C_For%C3%AAt_de_Soignes%2C_Brussels_%2826194636951%29.jpg' },
  { id: 'b08', name: 'Blue Tit', scientificName: 'Cyanistes caeruleus', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Eurasian_blue_tit_Lancashire.jpg' },
  { id: 'b09', name: 'Common Chaffinch', scientificName: 'Fringilla coelebs', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Male_Chaffinch_-_Fringilla_coelebs.jpg' },
  { id: 'b10', name: 'European Greenfinch', scientificName: 'Chloris chloris', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Chloris_chloris_%28profile%29.jpg' },
  { id: 'b11', name: 'European Goldfinch', scientificName: 'Carduelis carduelis', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/072_Wild_European_goldfinch_at_the_Parc_Jura_vaudois_Photo_by_Giles_Laurent.jpg' },
  { id: 'b12', name: 'Rock Pigeon', scientificName: 'Columba livia', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Columba_livia_%28Rock_Dove%2C_wild%29%2C_Duncansby_Head%2C_Caithness%2C_Scotland_1.jpg' },
  { id: 'b13', name: 'Eurasian Collared Dove', scientificName: 'Streptopelia decaocto', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/2022-04-06_Streptopelia_decaocto%2C_Plovdiv%2C_Bulgaria_1.jpg' },
  { id: 'b14', name: 'Common Magpie', scientificName: 'Pica pica', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Eurasian_magpie_%2810860%29.jpg' },
  { id: 'b15', name: 'Eurasian Jackdaw', scientificName: 'Coloeus monedula', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nordic_jackdaw_%2852563242448%29.jpg' },
  { id: 'b16', name: 'Sardinian Warbler', scientificName: 'Curruca melanocephala', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Sardinian_Warbler.jpg' },
  { id: 'b17', name: 'Common Nightingale', scientificName: 'Luscinia megarhynchos', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Luscinia_megarhynchos_-_Common_nightingale_-_Nachtegaal.jpg' },
  { id: 'b18', name: 'Hoopoe', scientificName: 'Upupa epops', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Upupa_epops_Madrid_01.jpg' },
  { id: 'b19', name: 'Eurasian Bee-eater', scientificName: 'Merops apiaster', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Guepier_d%27europe_au_parc_national_Ichkeul.jpg' },
  { id: 'b20', name: 'Eurasian Blackcap', scientificName: 'Sylvia atricapilla', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Blackcap_%28Sylvia_atricapilla%29_male.jpg' },
  { id: 'b21', name: 'Common Kestrel', scientificName: 'Falco tinnunculus', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Common_kestrel_falco_tinnunculus.jpg' },
  { id: 'b22', name: 'Peregrine Falcon', scientificName: 'Falco peregrinus', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Falco_peregrinus_m_Humber_Bay_Park_Toronto.jpg' },
  { id: 'b23', name: 'Eurasian Sparrowhawk', scientificName: 'Accipiter nisus', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/%D0%AF%D1%81%D1%82%D1%80%D0%B5%D0%B1-%D0%BF%D0%B5%D1%80%D0%B5%D0%BF%D0%B5%D0%BB%D1%8F%D1%82%D0%BD%D0%B8%D0%BA_%28Accipiter_nisus%2C_m%29%2C_%D0%98%D0%B7%D0%BC%D0%B0%D0%B9%D0%BB%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9_%D0%BF%D0%B0%D1%80%D0%BA.jpg' },
  { id: 'b24', name: 'Common Buzzard', scientificName: 'Buteo buteo', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Steppe_buzzard_%28Buteo_buteo_vulpinus%29.jpg' },
  { id: 'b25', name: 'Short-toed Snake Eagle', scientificName: 'Circaetus gallicus', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Short-toed_Snake-Eagle_in_Bhigwan_August_2025_by_Tisha_Mukherjee_01.jpg' },
  { id: 'b26', name: 'Little Egret', scientificName: 'Egretta garzetta', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Little_egret_%28Egretta_garzetta%29_Photograph_by_Shantanu_Kuveskar.jpg' },
  { id: 'b27', name: 'Grey Heron', scientificName: 'Ardea cinerea', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Grey_heron_2022_03_18_01.jpg' },
  { id: 'b28', name: 'Great Cormorant', scientificName: 'Phalacrocorax carbo', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/2021-05-05_Phalacrocorax_carbo_carbo%2C_Killingworth_Lake%2C_Northumberland_1-1.jpg' },
  { id: 'b29', name: 'Mallard', scientificName: 'Anas platyrhynchos', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Anas_platyrhynchos_male_female_quadrat.jpg' },
  { id: 'b30', name: 'Eurasian Coot', scientificName: 'Fulica atra', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Eurasian_Coot_2023_11_25_03.jpg' },
  { id: 'b31', name: 'Common Kingfisher', scientificName: 'Alcedo atthis', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Alcedo_atthis_-England-8_%28cropped%29.jpg' },
  { id: 'b32', name: 'Grey Wagtail', scientificName: 'Motacilla cinerea', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Gebirgsstelze_im_Geo-Naturpark_Bergstra%C3%9Fe-Odenwald.jpg' },
  { id: 'b33', name: 'White Wagtail', scientificName: 'Motacilla alba', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/6/60/20180415_015_Winterswijk_Witte_kwikstaart_%2840785272624%29.jpg' },
  { id: 'b34', name: 'Crested Lark', scientificName: 'Galerida cristata', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Cochevis_hupp%C3%A9_Gbollat.jpg' },
  { id: 'b35', name: 'Common Stonechat', scientificName: 'Saxicola rubicola', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Stonechat_%28Saxicola_rubicola%29_male%2C_Beaulieu%2C_Hampshire.jpg' },
  { id: 'b36', name: 'Northern Wheatear', scientificName: 'Oenanthe oenanthe', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Steinschmaetzer_Northern_wheatear_male.jpg' },
  { id: 'b37', name: "Cetti's Warbler", scientificName: 'Cettia cetti', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/37-090505-cettis-warbler-at-Kalloni-east-river.jpg' },
  { id: 'b38', name: 'Great Reed Warbler', scientificName: 'Acrocephalus arundinaceus', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Drosselrohrs%C3%A4nger_Great_reed_warbler.jpg' },
  { id: 'b39', name: 'House Martin', scientificName: 'Delichon urbicum', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Mehlschwalbe_Delichon_urbicum.jpg' },
  { id: 'b40', name: 'Eurasian Jay', scientificName: 'Garrulus glandarius', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Garrulus_glandarius_1_Luc_Viatour.jpg' },
  { id: 'b41', name: 'Song Thrush', scientificName: 'Turdus philomelos', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/%D0%9F%D0%B5%D0%B2%D1%87%D0%B8%D0%B9_%D0%B4%D1%80%D0%BE%D0%B7%D0%B4_%D0%BD%D0%B0_%D0%BF%D0%B5%D0%BD%D1%8C%D0%BA%D0%B5_%28Turdus_philomelos%29%2C_%D0%91%D0%B8%D1%82%D1%86%D0%B5%D0%B2%D1%81%D0%BA%D0%B8%D0%B9_%D0%BB%D0%B5%D1%81.jpg' },
  { id: 'b42', name: 'Spotted Flycatcher', scientificName: 'Muscicapa striata', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Muscicapa_striata_%D0%BC%D1%83%D1%85%D0%BE%D0%BB%D0%BE%D0%B2%D0%BA%D0%B0_%D1%81%D1%96%D1%80%D0%B0.jpg' },
  { id: 'b43', name: 'Booted Eagle', scientificName: 'Hieraaetus pennatus', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Booted_eagle_%28India%2C_2012%29.jpg' },
  { id: 'b44', name: 'Black Redstart', scientificName: 'Phoenicurus ochruros', rarity: 'Common', image: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Hausrotschwanz_Brutpflege_2006-05-21-05.jpg' },
  { id: 'b45', name: 'Common Whitethroat', scientificName: 'Curruca communis', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Common_Whitethroat.jpg' },
  { id: 'b46', name: 'Subalpine Warbler', scientificName: 'Curruca cantillans', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Subalpine_Warbler_-_Monfrague_-_Spain_2669_%2819110069408%29.jpg' },
  { id: 'b47', name: 'Rock Sparrow', scientificName: 'Petronia petronia', rarity: 'Uncommon', image: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/2017-05-02_Petronia_petronia%2C_Monestir_d%27Avellanes%2C_Catalunya_07.jpg' },
  { id: 'b48', name: 'Eurasian Scops Owl', scientificName: 'Otus scops', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Scops_Owl_%28Otus_scops%29%2C_Kalloni%2C_Lesvos%2C_Greece%2C_19.04.2015_%2816773748434%29.jpg' },
  { id: 'b49', name: 'European Turtle Dove', scientificName: 'Streptopelia turtur', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Turtle_dove_%28Streptopelia_turtur_turtur%29_Hungary.jpg' },
  { id: 'b50', name: "Western Bonelli's Warbler", scientificName: 'Phylloscopus bonelli', rarity: 'Rare', image: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Phylloscopus_bonelli_2.jpg' },
];

export const BIRD_NAMES = CANNES_BIRDS.map(b => b.name);

export function findBird(name: string): Bird | undefined {
  return CANNES_BIRDS.find(b => b.name.toLowerCase() === name.toLowerCase());
}
