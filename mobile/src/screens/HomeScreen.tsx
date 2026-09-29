import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { liquorApi } from '../services/api';
import { Liquor } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [liquors, setLiquors] = useState<Liquor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const liquorTypes = [
    { key: null, label: '전체' },
    { key: 'whiskey', label: '위스키' },
    { key: 'wine', label: '와인' },
    { key: 'beer', label: '맥주' },
    { key: 'soju', label: '소주' },
    { key: 'sake', label: '사케' },
  ];

  useEffect(() => {
    loadLiquors();
  }, [selectedType, searchKeyword]);

  const loadLiquors = async () => {
    setLoading(true);
    try {
      const response = await liquorApi.search({
        keyword: searchKeyword || undefined,
        type: selectedType || undefined,
      });
      if (response.success && response.data) {
        setLiquors(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load liquors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLiquorItem = ({ item }: { item: Liquor }) => (
    <TouchableOpacity
      style={styles.liquorCard}
      onPress={() => navigation.navigate('LiquorDetail', { liquorId: item.id })}
      testID={`liquor-item-${item.id}`}
    >
      <View style={styles.liquorImagePlaceholder}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.liquorImage} />
        ) : (
          <Text style={styles.liquorImageText}>🍾</Text>
        )}
      </View>
      <View style={styles.liquorInfo}>
        <Text style={styles.liquorBrand}>{item.brand}</Text>
        <Text style={styles.liquorName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.liquorPrice}>
          {item.price.toLocaleString()}원
        </Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.averageRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.reviewCount})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="주류 검색..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          testID="search-input"
        />
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={liquorTypes}
          keyExtractor={(item) => item.key || 'all'}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedType(item.key)}
              testID={`filter-${item.key || 'all'}`}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 주류 목록 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={liquors}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLiquorItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            </View>
          }
          testID="liquor-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  liquorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    width: '46%',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  liquorImagePlaceholder: {
    height: 120,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liquorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liquorImageText: {
    fontSize: 48,
  },
  liquorInfo: {
    padding: 12,
  },
  liquorBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  liquorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  liquorPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
