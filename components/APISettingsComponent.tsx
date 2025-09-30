import { getGoogleVisionApiKey, setGoogleVisionApiKey } from '@/utils/ocrService';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface APISettingsComponentProps {
  onClose: () => void;
}

export default function APISettingsComponent({ onClose }: APISettingsComponentProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const savedKey = await getGoogleVisionApiKey();
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch (error) {
      console.error('API 키 불러오기 오류:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('오류', 'API 키를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await setGoogleVisionApiKey(apiKey.trim());
      Alert.alert(
        '성공',
        'API 키가 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: onClose,
          },
        ]
      );
    } catch (error) {
      Alert.alert('오류', 'API 키 저장 중 오류가 발생했습니다.');
      console.error('API 키 저장 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'API 키 삭제',
      '저장된 API 키를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await setGoogleVisionApiKey('');
              setApiKey('');
              Alert.alert('완료', 'API 키가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', 'API 키 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ API 설정</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Google Cloud Vision API</Text>
          <Text style={styles.description}>
            Google Cloud Vision API를 사용하여 실제 텍스트 인식을 수행합니다.
            API 키가 없으면 시뮬레이션 모드로 동작합니다.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>API 키</Text>
            <TextInput
              style={styles.textInput}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Google Cloud Vision API 키를 입력하세요"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              secureTextEntry={false}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '저장 중...' : '💾 저장'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>🗑️ 삭제</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>📋 API 키 발급 방법:</Text>
            <Text style={styles.infoText}>
              1. Google Cloud Console에 접속{'\n'}
              2. 새 프로젝트 생성 또는 기존 프로젝트 선택{'\n'}
              3. Cloud Vision API 활성화{'\n'}
              4. 서비스 계정 생성 및 키 다운로드{'\n'}
              5. 또는 API 키 생성 (제한적 사용 권장)
            </Text>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ 주의사항:</Text>
            <Text style={styles.warningText}>
              • API 키는 안전하게 보관하세요{'\n'}
              • 사용량에 따라 비용이 발생할 수 있습니다{'\n'}
              • API 키는 앱에만 저장되며 외부로 전송되지 않습니다
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
