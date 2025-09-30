import { OCRResult } from '@/utils/ocrService';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OCRResultComponentProps {
  results: OCRResult[];
  onClose: () => void;
  onRetake: () => void;
}

export default function OCRResultComponent({ results, onClose, onRetake }: OCRResultComponentProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');

  const speakText = async (text: string) => {
    try {
      if (isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }

      setIsSpeaking(true);
      setSelectedText(text);
      
      await Speech.speak(text, {
        language: 'ko-KR',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          setIsSpeaking(false);
          setSelectedText('');
        },
        onError: () => {
          setIsSpeaking(false);
          setSelectedText('');
        },
      });
    } catch (error) {
      console.error('TTS 오류:', error);
      Alert.alert('오류', '음성 읽기 중 오류가 발생했습니다.');
      setIsSpeaking(false);
      setSelectedText('');
    }
  };

  const speakAllText = async () => {
    // 강력한 필터링 - 한글만 추출
    const filteredResults = results.filter(result => {
      const text = result.text.trim();
      
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
      
      // 영어 단어 제거
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
      return koreanText.length >= 2;
    });
    
    if (filteredResults.length > 0) {
      const allText = filteredResults.map(result => result.text).join(' ');
      await speakText(allText);
    } else {
      await speakText('읽을 수 있는 텍스트가 없습니다.');
    }
  };

  const speakSelectedText = async (text: string) => {
    await speakText(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>인식된 텍스트</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={onRetake}>
            <Text style={styles.headerButtonText}>다시 촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={styles.headerButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {results.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>인식된 텍스트가 없습니다.</Text>
          </View>
        ) : (
          <>
            <View style={styles.allTextContainer}>
              <Text style={styles.allTextLabel}>전체 텍스트:</Text>
              <TouchableOpacity
                style={[styles.speakButton, isSpeaking && selectedText === results.map(r => r.text).join(' ') && styles.speakingButton]}
                onPress={speakAllText}
              >
                <Text style={styles.speakButtonText}>
                  {isSpeaking && selectedText === results.map(r => r.text).join(' ') ? '⏸️ 정지' : '🔊 전체 읽기'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.allText}>
              {results
                .filter(result => {
                  const text = result.text.trim();
                  
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
                  
                  // 영어 단어 제거
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
                  return koreanText.length >= 2;
                })
                .map(result => result.text)
                .join(' ')}
            </Text>

            <Text style={styles.separator}>개별 텍스트:</Text>

            {results
              .filter(result => {
                const text = result.text.trim();
                
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
                
                // 영어 단어 제거
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
                return koreanText.length >= 2;
              })
              .map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultIndex}>#{index + 1}</Text>
                    {result.confidence && (
                      <Text style={styles.confidence}>
                        신뢰도: {Math.round(result.confidence * 100)}%
                      </Text>
                    )}
                  </View>
                  
                   <Text style={styles.resultText}>{result.text}</Text>
                   
                   {result.boundingBox && (
                     <View style={styles.boundingBoxInfo}>
                       <Text style={styles.boundingBoxText}>
                         위치: ({result.boundingBox.x}, {result.boundingBox.y}) 
                         크기: {result.boundingBox.width}×{result.boundingBox.height}
                       </Text>
                     </View>
                   )}
                   
                   <TouchableOpacity
                     style={[
                       styles.speakButton,
                       isSpeaking && selectedText === result.text && styles.speakingButton
                     ]}
                     onPress={() => speakSelectedText(result.text)}
                   >
                     <Text style={styles.speakButtonText}>
                       {isSpeaking && selectedText === result.text ? '⏸️ 정지' : '🔊 읽기'}
                     </Text>
                   </TouchableOpacity>
                 </View>
               ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  allTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  allTextLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  allText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  separator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  confidence: {
    fontSize: 12,
    color: '#666',
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  speakButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  speakingButton: {
    backgroundColor: '#FF3B30',
  },
  speakButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  boundingBoxInfo: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  boundingBoxText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
