import APISettingsComponent from "@/components/APISettingsComponent";
import CameraComponent from "@/components/CameraComponent";
import OCRResultComponent from "@/components/OCRResultComponent";
import { OCRResult, getGoogleVisionApiKey } from "@/utils/ocrService";
import { router } from "expo-router";
import * as Speech from 'expo-speech';
import { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [showCamera, setShowCamera] = useState(true); // 앱 시작 시 바로 카메라 켜기
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAPISettings, setShowAPISettings] = useState(false);

  const handleTextRecognized = async (results: OCRResult[]) => {
    // 매우 강력한 텍스트 필터링 - 실제 텍스트만 추출
    const textOnlyResults = results.filter(result => {
      const text = result.text.trim();
      
      // 빈 텍스트 제거
      if (!text) return false;
      
      // 파일명, 확장자 제거
      if (text.includes('.') || text.includes('파일') || text.includes('제목') || 
          text.includes('Samsung') || text.includes('Notes') || text.includes('layout') ||
          text.includes('explore') || text.includes('index') || text.includes('modal') ||
          text.includes('assets') || text.includes('components') || text.includes('constants')) {
        return false;
      }
      
      // 숫자만 있는 것 제거
      if (/^\d+$/.test(text)) {
        return false;
      }
      
      // 영어 단어 제거 (한글만 남기기)
      if (/^[a-zA-Z]+$/.test(text)) {
        return false;
      }
      
      // 시스템 메시지 제거
      if (text.includes('처리') || text.includes('시간') || text.includes('크기') || 
          text.includes('정확도') || text.includes('OCR') || text.includes('이미지') ||
          text.includes('스마트') || text.includes('지팡이') || text.includes('앱') ||
          text.includes('인식') || text.includes('성공') || text.includes('완료')) {
        return false;
      }
      
      // 한글만 남기기
      const koreanText = text.replace(/[^\u3131-\u3163\uac00-\ud7a3]/g, '');
      return koreanText.length >= 2; // 2글자 이상의 한글만
    }).map(result => ({
      ...result,
      text: result.text.replace(/[^\u3131-\u3163\uac00-\ud7a3]/g, '').trim()
    })).filter(result => result.text.length >= 2);
    
    setOcrResults(textOnlyResults);
    setShowCamera(false);
    setShowResults(true);
    
    // 필터링된 텍스트만 TTS로 읽어주기
    if (textOnlyResults.length > 0) {
      try {
        const allText = textOnlyResults.map(result => result.text).join(' ');
        console.log('읽을 텍스트:', allText);
        await Speech.speak(allText, {
          language: 'ko-KR',
          pitch: 1.0,
          rate: 0.8,
        });
      } catch (error) {
        console.error('TTS 오류:', error);
      }
    } else {
      // 텍스트가 없으면 안내 메시지
      try {
        await Speech.speak('인식된 텍스트가 없습니다. 다시 촬영해주세요.', {
          language: 'ko-KR',
          pitch: 1.0,
          rate: 0.8,
        });
      } catch (error) {
        console.error('TTS 오류:', error);
      }
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setOcrResults([]);
    setShowCamera(true); // 닫으면 다시 카메라로
    Speech.stop(); // TTS 정지
  };

  const handleRetake = () => {
    setShowResults(false);
    setShowCamera(true);
    // TTS 정지
    Speech.stop();
  };

  const handleOCRPress = () => {
    const apiKey = getGoogleVisionApiKey();
    if (!apiKey) {
      Alert.alert(
        'API 키 필요',
        'Google Vision API 키가 설정되지 않았습니다.\n설정에서 API 키를 입력해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정', onPress: () => setShowAPISettings(true) }
        ]
      );
      return;
    }
    setShowCamera(true);
  };

  // 앱 시작 시 API 키 확인
  useEffect(() => {
    const checkApiKey = async () => {
      const apiKey = await getGoogleVisionApiKey();
      if (!apiKey) {
        Alert.alert(
          'API 키 필요',
          'Google Vision API 키가 설정되지 않았습니다.\n설정에서 API 키를 입력해주세요.',
          [
            { text: '설정', onPress: () => setShowAPISettings(true) },
            { text: '나중에', style: 'cancel' }
          ]
        );
      }
    };
    
    // 1초 후에 API 키 확인 (앱 로딩 완료 후)
    const timer = setTimeout(checkApiKey, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (showCamera) {
    return (
      <CameraComponent
        onTextRecognized={handleTextRecognized}
        onClose={handleCloseCamera}
      />
    );
  }

  if (showResults) {
    return (
      <OCRResultComponent
        results={ocrResults}
        onClose={handleCloseResults}
        onRetake={handleRetake}
      />
    );
  }

  if (showAPISettings) {
    return (
      <APISettingsComponent
        onClose={() => setShowAPISettings(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Smart Cane</Text>
      <Text style={styles.subtitle}>스마트 지팡이 앱</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="📷 OCR 텍스트 인식"
          onPress={handleOCRPress}
        />
        
        <View style={styles.buttonSpacing} />
        
        <Button
          title="⚙️ API 설정"
          onPress={() => setShowAPISettings(true)}
        />
        
        <View style={styles.buttonSpacing} />
        
        <Button
          title="🔊 TTS 테스트"
          onPress={() => router.push("/modal")}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          📷 버튼을 눌러 카메라로 텍스트를 촬영하거나{'\n'}
          📷 갤러리에서 이미지를 선택하여{'\n'}
          Google Cloud Vision API로 실제 텍스트를 인식하고 음성으로 들을 수 있습니다.
        </Text>
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>🚀 주요 기능:</Text>
          <Text style={styles.featureText}>• Google Cloud Vision API (실제 OCR)</Text>
          <Text style={styles.featureText}>• 한국어/영어 동시 지원</Text>
          <Text style={styles.featureText}>• 실시간 텍스트 인식</Text>
          <Text style={styles.featureText}>• 바운딩 박스 정보 제공</Text>
          <Text style={styles.featureText}>• TTS 음성 출력</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  buttonSpacing: {
    height: 20,
  },
  infoContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 18,
  },
});
