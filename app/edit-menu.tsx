import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { SurfaceCard } from '@/components/ui/Kinetic';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  getMyMerchant,
  MenuItem,
  Merchant,
} from '@/lib/dataApi';

export default function EditMenuScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const auth = useAuthContext();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  useEffect(() => {
    loadData();
  }, [auth.user]);

  async function loadData() {
    if (!auth.user) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const m = await getMyMerchant(auth.user.id, auth.jwt);
      setMerchant(m);
      if (m) {
        const menuData = await getMenuItems(m.id);
        setItems(menuData || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddItem() {
    if (!merchant || !auth.user || !newItemName.trim() || !newItemPrice) return;
    const price = parseInt(newItemPrice, 10);
    if (isNaN(price)) {
      Alert.alert('Error', 'Harga harus berupa angka yang valid');
      return;
    }

    try {
      setIsAdding(true);
      const jwt = (await auth.refreshJwt()) ?? auth.jwt;
      if (!jwt) throw new Error('JWT unavailable');

      const created = await createMenuItem(jwt, {
        merchant_id: merchant.id,
        name: newItemName.trim(),
        price,
        description: newItemDesc.trim() || null,
        is_available: true,
      });

      if (created) {
        setItems((prev) => [created, ...prev]);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemDesc('');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan menu');
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteItem(id: string) {
    Alert.alert('Hapus Menu', 'Apakah Anda yakin ingin menghapus menu ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const jwt = (await auth.refreshJwt()) ?? auth.jwt;
            if (!jwt) return;
            await deleteMenuItem(jwt, id);
            setItems((prev) => prev.filter((i) => i.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Gagal menghapus menu');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!merchant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Anda belum mendaftarkan toko. Silakan daftar di Profil Anda.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Modal */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20, backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Menu</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
          <FontAwesome name="times" size={24} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <SurfaceCard style={[styles.addCard, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={[styles.addTitle, { color: colors.text }]}>Tambah Menu Baru</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.text }]}
              placeholder="Nama Menu (cth: Es Kopi Susu)"
              placeholderTextColor={colors.outlineVariant}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.text }]}
              placeholder="Harga (cth: 15000)"
              placeholderTextColor={colors.outlineVariant}
              value={newItemPrice}
              onChangeText={setNewItemPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.text, height: 60 }]}
              placeholder="Deskripsi singkat (opsional)"
              placeholderTextColor={colors.outlineVariant}
              value={newItemDesc}
              onChangeText={setNewItemDesc}
              multiline
            />
            
            <Pressable
              onPress={handleAddItem}
              disabled={isAdding || !newItemName.trim() || !newItemPrice}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: colors.primary },
                (isAdding || !newItemName.trim() || !newItemPrice) && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.addBtnText}>{isAdding ? 'Menambahkan...' : 'Tambah'}</Text>
            </Pressable>
          </SurfaceCard>
        }
        renderItem={({ item }) => (
          <SurfaceCard style={styles.menuItem}>
            <View style={styles.menuItemInfo}>
              <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
              {item.description ? (
                <Text style={[styles.menuItemDesc, { color: colors.onSurfaceMuted }]}>{item.description}</Text>
              ) : null}
              <Text style={[styles.menuItemPrice, { color: colors.secondary }]}>
                Rp {item.price.toLocaleString('id-ID')}
              </Text>
            </View>
            <Pressable
              onPress={() => handleDeleteItem(item.id)}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
            >
              <FontAwesome name="trash" size={20} color="#e63946" />
            </Pressable>
          </SurfaceCard>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
              Belum ada menu, tambahkan menu jualan pertama Anda.
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    bottom: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  addCard: {
    marginBottom: 10,
    gap: 10,
  },
  addTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
  },
  addBtn: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  menuItemName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  menuItemDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  menuItemPrice: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    marginTop: 6,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyWrap: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
