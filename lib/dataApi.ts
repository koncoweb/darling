type DataApiConfig = {
  baseUrl: string;
};

function getConfig(): DataApiConfig | null {
  const baseUrl = process.env.EXPO_PUBLIC_NEON_DATA_API_URL;
  if (!baseUrl) return null;
  return { baseUrl: baseUrl.replace(/\/$/, '') };
}

type DataApiRequest = {
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  jwt?: string | null;
  body?: unknown;
  preferReturn?: boolean;
};

export async function dataApiRequest<T>({
  path,
  method = 'GET',
  jwt,
  body,
  preferReturn,
}: DataApiRequest): Promise<T> {
  const cfg = getConfig();
  if (!cfg) {
    throw new Error('Missing EXPO_PUBLIC_NEON_DATA_API_URL');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (preferReturn) headers.Prefer = 'return=representation';

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Data API error (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type GeneralUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
};

export async function getUserProfile(userId: string, jwt?: string | null) {
  const params = new URLSearchParams();
  params.set('id', `eq.${userId}`);
  params.set('limit', '1');
  const items = await dataApiRequest<GeneralUser[]>({
    path: `/users?${params.toString()}`,
    jwt,
  });
  return items[0] ?? null;
}

export async function createUserProfile(
  jwt: string,
  input: Pick<GeneralUser, 'id' | 'email'> & Partial<Pick<GeneralUser, 'name'>>
) {
  const body = {
    id: input.id,
    email: input.email,
    name: input.name ?? null,
  };
  const created = await dataApiRequest<GeneralUser[]>({
    path: '/users',
    method: 'POST',
    jwt,
    body,
    preferReturn: true,
  });
  return created[0] ?? null;
}

export type FeedVideo = {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
  merchants?: {
    store_name: string;
    avatar_url: string | null;
    is_active: boolean;
  } | null;
};

export async function listFeedVideos(limit = 10, jwt?: string | null) {
  const params = new URLSearchParams();
  params.set(
    'select',
    [
      'id',
      'video_url',
      'thumbnail_url',
      'caption',
      'created_at',
      'merchants(store_name,avatar_url,is_active)',
    ].join(',')
  );
  params.set('order', 'created_at.desc');
  params.set('limit', String(limit));
  return dataApiRequest<FeedVideo[]>({ path: `/videos?${params.toString()}`, jwt });
}

export type Merchant = {
  id: string;
  owner_user_id: string;
  store_name: string;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  is_active: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listActiveMerchants(limit = 30, jwt?: string | null) {
  const params = new URLSearchParams();
  params.set(
    'select',
    [
      'id',
      'owner_user_id',
      'store_name',
      'description',
      'avatar_url',
      'category',
      'is_active',
      'last_lat',
      'last_lng',
      'last_active_at',
      'created_at',
      'updated_at',
    ].join(',')
  );
  params.set('is_active', 'eq.true');
  params.set('order', 'last_active_at.desc');
  params.set('limit', String(limit));
  return dataApiRequest<Merchant[]>({ path: `/merchants?${params.toString()}`, jwt });
}

export async function getMyMerchant(ownerUserId: string, jwt?: string | null) {
  const params = new URLSearchParams();
  params.set(
    'select',
    [
      'id',
      'owner_user_id',
      'store_name',
      'description',
      'avatar_url',
      'category',
      'is_active',
      'last_lat',
      'last_lng',
      'last_active_at',
      'created_at',
      'updated_at',
    ].join(',')
  );
  params.set('owner_user_id', `eq.${ownerUserId}`);
  params.set('limit', '1');
  const items = await dataApiRequest<Merchant[]>({
    path: `/merchants?${params.toString()}`,
    jwt,
  });
  return items[0] ?? null;
}

export async function createMerchant(
  jwt: string,
  input: Pick<Merchant, 'owner_user_id' | 'store_name'> &
    Partial<Pick<Merchant, 'description' | 'avatar_url' | 'category'>>
) {
  const body = {
    owner_user_id: input.owner_user_id,
    store_name: input.store_name,
    description: input.description ?? null,
    avatar_url: input.avatar_url ?? null,
    category: input.category ?? null,
  };
  const created = await dataApiRequest<Merchant[]>({
    path: '/merchants',
    method: 'POST',
    jwt,
    body,
    preferReturn: true,
  });
  return created[0] ?? null;
}

export async function updateMerchant(
  jwt: string,
  merchantId: string,
  patch: Partial<
    Pick<Merchant, 'store_name' | 'description' | 'avatar_url' | 'category' | 'is_active' | 'last_lat' | 'last_lng' | 'last_active_at'>
  >
) {
  const params = new URLSearchParams();
  params.set('id', `eq.${merchantId}`);
  const updated = await dataApiRequest<Merchant[]>({
    path: `/merchants?${params.toString()}`,
    method: 'PATCH',
    jwt,
    body: patch,
    preferReturn: true,
  });
  return updated[0] ?? null;
}

export type Video = {
  id: string;
  merchant_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
};

export async function createVideo(
  jwt: string,
  input: Pick<Video, 'merchant_id' | 'video_url'> & Partial<Pick<Video, 'thumbnail_url' | 'caption'>>
) {
  const body = {
    merchant_id: input.merchant_id,
    video_url: input.video_url,
    thumbnail_url: input.thumbnail_url ?? null,
    caption: input.caption ?? null,
  };
  const created = await dataApiRequest<Video[]>({
    path: '/videos',
    method: 'POST',
    jwt,
    body,
    preferReturn: true,
  });
  return created[0] ?? null;
}

export type MenuItem = {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export async function getMenuItems(merchantId: string) {
  const params = new URLSearchParams();
  params.set('merchant_id', `eq.${merchantId}`);
  params.set('order', 'created_at.desc');
  return dataApiRequest<MenuItem[]>({
    path: `/merchant_menus?${params.toString()}`,
  });
}

export async function createMenuItem(
  jwt: string,
  input: Pick<MenuItem, 'merchant_id' | 'name' | 'price'> & Partial<Pick<MenuItem, 'description' | 'image_url' | 'is_available'>>
) {
  const body = {
    merchant_id: input.merchant_id,
    name: input.name,
    price: input.price,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    is_available: input.is_available ?? true,
  };
  const created = await dataApiRequest<MenuItem[]>({
    path: '/merchant_menus',
    method: 'POST',
    jwt,
    body,
    preferReturn: true,
  });
  return created[0] ?? null;
}

export async function updateMenuItem(
  jwt: string,
  menuId: string,
  patch: Partial<Pick<MenuItem, 'name' | 'description' | 'price' | 'image_url' | 'is_available'>>
) {
  const params = new URLSearchParams();
  params.set('id', `eq.${menuId}`);
  const updated = await dataApiRequest<MenuItem[]>({
    path: `/merchant_menus?${params.toString()}`,
    method: 'PATCH',
    jwt,
    body: patch,
    preferReturn: true,
  });
  return updated[0] ?? null;
}

export async function deleteMenuItem(jwt: string, menuId: string) {
  const params = new URLSearchParams();
  params.set('id', `eq.${menuId}`);
  return dataApiRequest<any>({
    path: `/merchant_menus?${params.toString()}`,
    method: 'DELETE',
    jwt,
  });
}
