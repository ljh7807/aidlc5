import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { reservationApi } from '../services/api';

interface ReservationCreateScreenProps {
  route: {
    params: {
      storeId: number;
      liquorId: number;
      storeName: string;
      liquorName: string;
      price: number;
    };
  };
  navigation: any;
}

export const ReservationCreateScreen: React.FC<ReservationCreateScreenProps> = ({
  route,
  navigation,
}) => {
  const { storeId, liquorId, storeName, liquorName, price } = route.params;

  const [quantity, setQuantity] = useState('1');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPrice = parseInt(quantity || '0') * price;

  const validateForm = (): boolean => {
    if (!quantity || parseInt(quantity) < 1) {
      Alert.alert('오류', '수량은 1개 이상이어야 합니다.');
      return false;
    }

    if (!pickupDate) {
      Alert.alert('오류', '픽업 날짜를 입력해주세요.');
      return false;
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(pickupDate)) {
      Alert.alert('오류', '날짜 형식이 올바르지 않습니다. (예: 2026-09-20)');
      return false;
    }

    if (!pickupTime) {
      Alert.alert('오류', '픽업 시간을 입력해주세요.');
      return false;
    }

    // 시간 형식 검증 (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(pickupTime)) {
      Alert.alert('오류', '시간 형식이 올바르지 않습니다. (예: 15:00)');
      return false;
    }

    return true;
  };

  const handleReservation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await reservationApi.create({
        storeId,
        liquorId,
        quantity: parseInt(quantity),
        pickupDate,
        pickupTime,
      });

      Alert.alert(
        '예약 완료',
        '예약이 생성되었습니다. 결제를 진행해주세요.',
        [
          {
            text: '결제하기',
            onPress: () => {
              navigation.replace('PaymentCreate', {
                reservationId: response.data.data.id,
              });
            },
          },
          {
            text: '나중에',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '예약 생성에 실패했습니다.';
      Alert.alert('예약 실패', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} testID="reservation-create-screen">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>예약 정보</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>가맹점</Text>
          <Text style={styles.value}>{storeName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>주류</Text>
          <Text style={styles.value}>{liquorName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>단가</Text>
          <Text style={styles.value}>{price.toLocaleString()}원</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>수량</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            testID="quantity-decrease-button"
            style={styles.quantityButton}
            onPress={() => {
              const current = parseInt(quantity) || 1;
              if (current > 1) setQuantity((current - 1).toString());
            }}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <TextInput
            testID="quantity-input"
            style={styles.quantityInput}
            value={quantity}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              setQuantity(num || '1');
            }}
            keyboardType="numeric"
          />
          
          <TouchableOpacity
            testID="quantity-increase-button"
            style={styles.quantityButton}
            onPress={() => {
              const current = parseInt(quantity) || 0;
              setQuantity((current + 1).toString());
            }}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>픽업 일정</Text>
        
        <Text style={styles.inputLabel}>픽업 날짜 (YYYY-MM-DD)</Text>
        <TextInput
          testID="pickup-date-input"
          style={styles.input}
          placeholder="예: 2026-09-20"
          value={pickupDate}
          onChangeText={setPickupDate}
        />
        
        <Text style={styles.inputLabel}>픽업 시간 (HH:mm)</Text>
        <TextInput
          testID="pickup-time-input"
          style={styles.input}
          placeholder="예: 15:00"
          value={pickupTime}
          onChangeText={setPickupTime}
        />
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 결제 금액</Text>
          <Text style={styles.summaryValue}>{totalPrice.toLocaleString()}원</Text>
        </View>
      </View>

      <TouchableOpacity
        testID="reservation-submit-button"
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleReservation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>예약하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 15,
    color: '#666',
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#333',
  },
  quantityInput: {
    width: 80,
    height: 44,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  summarySection: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    margin: 16,
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ReservationCreateScreen;
