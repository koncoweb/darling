import { Merchant } from './dataApi';
import { FontAwesome } from '@expo/vector-icons';

// Indonesian Street Food Categories & Type
export type MerchantCategory = 'sate' | 'bakso' | 'nasigoreng' | 'bubur' | 'kopi' | 'martabak' | 'minuman' | 'gorengan' | 'siomay' | 'soto' | 'other';

export type MerchantPin = Partial<Merchant> & { 
  id: string; 
  store_name: string;
  category: MerchantCategory;
  last_lat: number; 
  last_lng: number; 
};

export const CATEGORY_ICONS: Record<MerchantCategory, React.ComponentProps<typeof FontAwesome>['name']> = {
  sate: 'fire',
  bakso: 'cutlery',
  nasigoreng: 'cutlery',
  bubur: 'spoon',
  kopi: 'coffee',
  martabak: 'birthday-cake',
  minuman: 'glass',
  gorengan: 'shopping-basket',
  siomay: 'cutlery',
  soto: 'spoon',
  other: 'shopping-bag',
};

export const MOCK_MAP_MERCHANTS: MerchantPin[] = [
  {
    id: 'm-1',
    store_name: 'Sate Ayam Madura Pak Kumis',
    category: 'sate',
    is_active: true,
    description: 'Sate ayam bumbu kacang legendaris sejak 1990',
    last_lat: -6.2252,
    last_lng: 106.8103,
  },
  {
    id: 'm-2',
    store_name: 'Starling (Kopi Keliling)',
    category: 'kopi',
    is_active: true,
    description: 'Kopi sachet & minuman dingin keliling',
    last_lat: -6.2192,
    last_lng: 106.8203,
  },
  {
    id: 'm-3',
    store_name: 'Martabak Pecenongan 78',
    category: 'martabak',
    is_active: true,
    description: 'Martabak manis premium dengan wisman melimpah',
    last_lat: -6.2302,
    last_lng: 106.8153,
  },
  {
    id: 'm-4',
    store_name: 'Bakso Solo Samrat',
    category: 'bakso',
    is_active: true,
    description: 'Bakso urat & halus spesial kuah kaldu sapi',
    last_lat: -6.2212,
    last_lng: 106.8123,
  },
  {
    id: 'm-5',
    store_name: 'Bubur Ayam Barito',
    category: 'bubur',
    is_active: true,
    description: 'Bubur ayam dengan topping cakwe & cheese stick',
    last_lat: -6.2152,
    last_lng: 106.8083,
  },
  {
    id: 'm-6',
    store_name: 'Nasi Goreng Kebon Sirih',
    category: 'nasigoreng',
    is_active: false,
    description: 'Nasi goreng kambing rempah khas Betawi',
    last_lat: -6.2282,
    last_lng: 106.8223,
  },
  {
    id: 'm-7',
    store_name: 'Siomay Sewan',
    category: 'siomay',
    is_active: true,
    description: 'Siomay ikan tenggiri asli dengan bumbu kacang kental',
    last_lat: -6.2232,
    last_lng: 106.8183,
  },
  {
    id: 'm-8',
    store_name: 'Es Podeng Tomang',
    category: 'minuman',
    is_active: true,
    description: 'Es podeng tradisional dengan roti & kacang',
    last_lat: -6.2262,
    last_lng: 106.8143,
  },
  {
    id: 'm-9',
    store_name: 'Gorengan Cendana',
    category: 'gorengan',
    is_active: true,
    description: 'Berbagai macam gorengan hangat & renyah',
    last_lat: -6.2202,
    last_lng: 106.8163,
  },
  {
    id: 'm-10',
    store_name: 'Soto Betawi H. Husein',
    category: 'soto',
    is_active: true,
    description: 'Soto Betawi kuah santan gurih legendaris',
    last_lat: -6.2172,
    last_lng: 106.8133,
  }
];
