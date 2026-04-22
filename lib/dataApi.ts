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
  preferResolution?: 'merge-duplicates' | 'ignore-duplicates';
};

export async function dataApiRequest<T>({
  path,
  method = 'GET',
  jwt,
  body,
  preferReturn,
  preferResolution,
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
  const preferParts: string[] = [];
  if (preferReturn) preferParts.push('return=representation');
  if (preferResolution) preferParts.push(`resolution=${preferResolution}`);
  if (preferParts.length) headers.Prefer = preferParts.join(',');

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

export async function listMyVideos(merchantId: string, limit = 5, jwt?: string | null) {
  const params = new URLSearchParams();
  params.set(
    'select',
    [
      'id',
      'video_url',
      'thumbnail_url',
      'caption',
      'created_at',
    ].join(',')
  );
  params.set('merchant_id', `eq.${merchantId}`);
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
  category: string[] | null;
  is_active: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  cover_url?: string | null;
  cover_image?: string | null;
  whatsapp_number?: string | null;
  accepted_payments?: string[] | null;
  base_location?: string | null;
  operation_area?: string | null;
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
      'cover_url',
      'cover_image',
      'whatsapp_number',
      'accepted_payments',
      'base_location',
      'operation_area',
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
      'cover_url',
      'cover_image',
      'whatsapp_number',
      'accepted_payments',
      'base_location',
      'operation_area',
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
    Partial<Pick<Merchant, 'description' | 'avatar_url' | 'category' | 'cover_url' | 'cover_image' | 'whatsapp_number' | 'accepted_payments' | 'base_location' | 'operation_area'>>
) {
  const body = {
    owner_user_id: input.owner_user_id,
    store_name: input.store_name,
    description: input.description ?? null,
    avatar_url: input.avatar_url ?? null,
    category: input.category ?? null,
    cover_url: input.cover_url ?? null,
    cover_image: input.cover_image ?? null,
    whatsapp_number: input.whatsapp_number ?? null,
    accepted_payments: input.accepted_payments ?? null,
    base_location: input.base_location ?? null,
    operation_area: input.operation_area ?? null,
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
    Pick<Merchant, 'store_name' | 'description' | 'avatar_url' | 'category' | 'is_active' | 'last_lat' | 'last_lng' | 'last_active_at' | 'cover_url' | 'cover_image' | 'whatsapp_number' | 'accepted_payments' | 'base_location' | 'operation_area'>
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

// ─── User Profile / Preferences ───────────────────────────────────────────────

export type UserProfile = {
  user_id: string;
  role: string;
  radar_active: boolean;
  radar_radius_meters: number;
  pickup_address: string | null;
  pickup_note: string | null;
  is_visible_on_map: boolean;
  summon_count: number;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export async function getUserPreferences(userId: string, jwt?: string | null): Promise<UserProfile | null> {
  const params = new URLSearchParams();
  params.set('user_id', `eq.${userId}`);
  params.set('limit', '1');
  const items = await dataApiRequest<UserProfile[]>({
    path: `/profiles?${params.toString()}`,
    jwt,
  });
  return items[0] ?? null;
}

export async function upsertUserPreferences(
  jwt: string,
  userId: string,
  patch: Partial<Pick<UserProfile, 'radar_active' | 'radar_radius_meters' | 'pickup_address' | 'pickup_note' | 'is_visible_on_map' | 'display_name'>>
): Promise<UserProfile | null> {
  // PostgREST upsert: POST with on_conflict=user_id merges on existing rows
  const params = new URLSearchParams();
  params.set('on_conflict', 'user_id');
  const body = { user_id: userId, ...patch };
  try {
    const result = await dataApiRequest<UserProfile[]>({
      path: `/profiles?${params.toString()}`,
      method: 'POST',
      jwt,
      body,
      preferReturn: true,
      preferResolution: 'merge-duplicates',
    });
    return result[0] ?? null;
  } catch {
    // Fallback: plain PATCH
    const pparams = new URLSearchParams();
    pparams.set('user_id', `eq.${userId}`);
    const updated = await dataApiRequest<UserProfile[]>({
      path: `/profiles?${pparams.toString()}`,
      method: 'PATCH',
      jwt,
      body: patch,
      preferReturn: true,
    });
    return updated[0] ?? null;
  }
}


// ─── User Taste Notes ─────────────────────────────────────────────────────────

export type TasteNote = {
  id: string;
  user_id: string;
  label: string;
  sort_order: number;
  created_at: string;
};

export async function listTasteNotes(userId: string, jwt?: string | null): Promise<TasteNote[]> {
  const params = new URLSearchParams();
  params.set('user_id', `eq.${userId}`);
  params.set('order', 'sort_order.asc,created_at.asc');
  return dataApiRequest<TasteNote[]>({ path: `/user_taste_notes?${params.toString()}`, jwt });
}

export async function createTasteNote(jwt: string, userId: string, label: string): Promise<TasteNote | null> {
  const created = await dataApiRequest<TasteNote[]>({
    path: '/user_taste_notes',
    method: 'POST',
    jwt,
    body: { user_id: userId, label: label.trim() },
    preferReturn: true,
  });
  return created[0] ?? null;
}

export async function deleteTasteNote(jwt: string, noteId: string): Promise<void> {
  const params = new URLSearchParams();
  params.set('id', `eq.${noteId}`);
  await dataApiRequest<any>({
    path: `/user_taste_notes?${params.toString()}`,
    method: 'DELETE',
    jwt,
  });
}

// ─── User Favorite Merchants ──────────────────────────────────────────────────

export type FavoriteMerchantRecord = {
  id: string;
  user_id: string;
  merchant_id: string;
  created_at: string;
  merchants: {
    id: string;
    store_name: string;
    category: string[] | null;
    avatar_url: string | null;
    is_active: boolean;
    last_lat: number | null;
    last_lng: number | null;
    last_active_at: string | null;
  } | null;
};

export async function listFavoriteMerchants(userId: string, jwt?: string | null): Promise<FavoriteMerchantRecord[]> {
  const params = new URLSearchParams();
  params.set('user_id', `eq.${userId}`);
  params.set('select', 'id,user_id,merchant_id,created_at,merchants(id,store_name,category,avatar_url,is_active,last_lat,last_lng,last_active_at)');
  params.set('order', 'created_at.desc');
  return dataApiRequest<FavoriteMerchantRecord[]>({ path: `/user_favorite_merchants?${params.toString()}`, jwt });
}

export async function addFavoriteMerchant(jwt: string, userId: string, merchantId: string): Promise<FavoriteMerchantRecord | null> {
  const created = await dataApiRequest<FavoriteMerchantRecord[]>({
    path: '/user_favorite_merchants',
    method: 'POST',
    jwt,
    body: { user_id: userId, merchant_id: merchantId },
    preferReturn: true,
  });
  return created[0] ?? null;
}

export async function removeFavoriteMerchant(jwt: string, userId: string, merchantId: string): Promise<void> {
  const params = new URLSearchParams();
  params.set('user_id', `eq.${userId}`);
  params.set('merchant_id', `eq.${merchantId}`);
  await dataApiRequest<any>({
    path: `/user_favorite_merchants?${params.toString()}`,
    method: 'DELETE',
    jwt,
  });
}

// ─── Summon History ───────────────────────────────────────────────────────────

export type SummonHistoryRecord = {
  id: string;
  user_id: string;
  merchant_id: string;
  status: 'pending' | 'arrived' | 'cancelled';
  summoned_at: string;
  arrived_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  merchants: {
    store_name: string;
    category: string[] | null;
    avatar_url: string | null;
  } | null;
};

export async function listSummonHistory(userId: string, limit = 10, jwt?: string | null): Promise<SummonHistoryRecord[]> {
  const params = new URLSearchParams();
  params.set('user_id', `eq.${userId}`);
  params.set('select', 'id,user_id,merchant_id,status,summoned_at,arrived_at,duration_seconds,note,merchants(store_name,category,avatar_url)');
  params.set('order', 'summoned_at.desc');
  params.set('limit', String(limit));
  return dataApiRequest<SummonHistoryRecord[]>({ path: `/summon_history?${params.toString()}`, jwt });
}

export async function createSummon(jwt: string, userId: string, merchantId: string, note?: string): Promise<SummonHistoryRecord | null> {
  const created = await dataApiRequest<SummonHistoryRecord[]>({
    path: '/summon_history',
    method: 'POST',
    jwt,
    body: { user_id: userId, merchant_id: merchantId, note: note ?? null },
    preferReturn: true,
  });
  return created[0] ?? null;
}

export async function updateSummonStatus(
  jwt: string,
  summonId: string,
  status: 'arrived' | 'cancelled'
) {
  const params = new URLSearchParams();
  params.set('id', `eq.${summonId}`);
  const body: Partial<SummonHistoryRecord> = { status };
  if (status === 'arrived') {
    body.arrived_at = new Date().toISOString();
  }

  const updated = await dataApiRequest<SummonHistoryRecord[]>({
    path: `/summon_history?${params.toString()}`,
    method: 'PATCH',
    jwt,
    body,
    preferReturn: true,
  });
  return updated[0] ?? null;
}

