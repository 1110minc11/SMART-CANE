import * as Bluetooth from 'expo-bluetooth';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface LidarData {
  distance: number; // cm 단위
  angle: number; // 각도
  timestamp: number;
}

interface LidarObstacleDetectorProps {
  onClose: () => void;
}

export default function LidarObstacleDetector({ onClose }: LidarObstacleDetectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<LidarData[]>([]);
  
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHapticTimeRef = useRef<number>(0);

  // 거리별 진동 세기 및 패턴 설정
  const getHapticPattern = (distance: number) => {
    if (distance <= 30) {
      // 매우 위험: 강한 진동, 빠른 간격
      return {
        intensity: Haptics.ImpactFeedbackStyle.Heavy,
        interval: 200,
        pattern: 'continuous'
      };
    } else if (distance <= 60) {
      // 위험: 중간 진동, 중간 간격
      return {
        intensity: Haptics.ImpactFeedbackStyle.Medium,
        interval: 400,
        pattern: 'double'
      };
    } else if (distance <= 120) {
      // 주의: 약한 진동, 느린 간격
      return {
        intensity: Haptics.ImpactFeedbackStyle.Light,
        interval: 800,
        pattern: 'single'
      };
    } else {
      // 안전: 진동 없음
      return null;
    }
  };

  // 진동 패턴 실행
  const executeHapticPattern = async (pattern: any) => {
    const now = Date.now();
    
    // 너무 빈번한 진동 방지 (최소 100ms 간격)
    if (now - lastHapticTimeRef.current < 100) {
      return;
    }
    
    lastHapticTimeRef.current = now;

    try {
      switch (pattern.pattern) {
        case 'continuous':
          await Haptics.impactAsync(pattern.intensity);
          break;
        case 'double':
          await Haptics.impactAsync(pattern.intensity);
          setTimeout(() => Haptics.impactAsync(pattern.intensity), 100);
          break;
        case 'single':
          await Haptics.impactAsync(pattern.intensity);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  // 거리 데이터 처리 및 진동 제어
  const processDistanceData = (distance: number) => {
    setCurrentDistance(distance);
    
    // 감지 기록에 추가
    const newData: LidarData = {
      distance,
      angle: 0, // 라이다 센서에서 각도 정보가 있다면 사용
      timestamp: Date.now()
    };
    
    setDetectionHistory(prev => {
      const updated = [newData, ...prev.slice(0, 9)]; // 최근 10개만 유지
      return updated;
    });

    // 진동 패턴 결정 및 실행
    const hapticPattern = getHapticPattern(distance);
    if (hapticPattern) {
      executeHapticPattern(hapticPattern);
    }
  };

  // 블루투스 스캔
  const startScan = async () => {
    try {
      setIsScanning(true);
      setAvailableDevices([]);
      
      const isEnabled = await Bluetooth.isEnabledAsync();
      if (!isEnabled) {
        Alert.alert('블루투스 비활성화', '블루투스를 활성화해주세요.');
        setIsScanning(false);
        return;
      }

      // 실제 환경에서는 Bluetooth.scanForDevicesAsync() 사용
      // 여기서는 시뮬레이션용 더미 데이터
      setTimeout(() => {
        setAvailableDevices([
          'Lidar-Sensor-001',
          'Lidar-Sensor-002',
          'Arduino-Lidar-123'
        ]);
        setIsScanning(false);
      }, 2000);
      
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      Alert.alert('스캔 오류', '블루투스 스캔 중 오류가 발생했습니다.');
      setIsScanning(false);
    }
  };

  // 디바이스 연결
  const connectToDevice = async (deviceName: string) => {
    try {
      setIsConnected(true);
      setConnectedDevice(deviceName);
      
      // 실제 환경에서는 Bluetooth.connectAsync() 사용
      Alert.alert('연결 성공', `${deviceName}에 연결되었습니다.`);
      
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('연결 오류', '디바이스 연결 중 오류가 발생했습니다.');
    }
  };

  // 연결 해제
  const disconnect = async () => {
    try {
      setIsConnected(false);
      setConnectedDevice(null);
      setIsDetecting(false);
      setCurrentDistance(null);
      
      // 진동 중지
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
      
      Alert.alert('연결 해제', '디바이스 연결이 해제되었습니다.');
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // 장애물 감지 시작/중지
  const toggleDetection = () => {
    if (!isConnected) {
      Alert.alert('연결 필요', '먼저 라이다 센서에 연결해주세요.');
      return;
    }

    setIsDetecting(!isDetecting);
    
    if (!isDetecting) {
      // 시뮬레이션용 거리 데이터 생성
      const simulateLidarData = () => {
        const distance = Math.random() * 200; // 0-200cm 랜덤 거리
        processDistanceData(distance);
      };

      // 500ms마다 거리 데이터 시뮬레이션
      hapticIntervalRef.current = setInterval(simulateLidarData, 500);
    } else {
      // 감지 중지
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
    };
  }, []);

  // 거리별 색상 결정
  const getDistanceColor = (distance: number | null) => {
    if (distance === null) return '#666';
    if (distance <= 30) return '#dc3545'; // 빨강 - 위험
    if (distance <= 60) return '#fd7e14'; // 주황 - 주의
    if (distance <= 120) return '#ffc107'; // 노랑 - 경고
    return '#28a745'; // 초록 - 안전
  };

  // 거리별 상태 텍스트
  const getDistanceStatus = (distance: number | null) => {
    if (distance === null) return '감지 없음';
    if (distance <= 30) return '매우 위험!';
    if (distance <= 60) return '위험';
    if (distance <= 120) return '주의';
    return '안전';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 라이다 장애물 감지</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 연결 상태 */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>연결 상태</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#28a745' : '#dc3545' }]} />
          <Text style={styles.statusText}>
            {isConnected ? `연결됨: ${connectedDevice}` : '연결 안됨'}
          </Text>
        </View>

        {/* 현재 거리 표시 */}
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceTitle}>현재 거리</Text>
          <Text style={[styles.distanceValue, { color: getDistanceColor(currentDistance) }]}>
            {currentDistance ? `${currentDistance.toFixed(0)}cm` : '--'}
          </Text>
          <Text style={[styles.distanceStatus, { color: getDistanceColor(currentDistance) }]}>
            {getDistanceStatus(currentDistance)}
          </Text>
        </View>

        {/* 제어 버튼들 */}
        <View style={styles.buttonContainer}>
          {!isConnected ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.scanButton]}
                onPress={startScan}
                disabled={isScanning}
              >
                <Text style={styles.buttonText}>
                  {isScanning ? '스캔 중...' : '🔍 디바이스 스캔'}
                </Text>
              </TouchableOpacity>

              {availableDevices.length > 0 && (
                <View style={styles.deviceList}>
                  <Text style={styles.deviceListTitle}>사용 가능한 디바이스:</Text>
                  {availableDevices.map((device, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.deviceItem}
                      onPress={() => connectToDevice(device)}
                    >
                      <Text style={styles.deviceText}>{device}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, isDetecting ? styles.stopButton : styles.startButton]}
                onPress={toggleDetection}
              >
                <Text style={styles.buttonText}>
                  {isDetecting ? '⏹️ 감지 중지' : '▶️ 감지 시작'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.disconnectButton]}
                onPress={disconnect}
              >
                <Text style={styles.buttonText}>🔌 연결 해제</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 감지 기록 */}
        {detectionHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>최근 감지 기록</Text>
            {detectionHistory.slice(0, 5).map((data, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDistance}>{data.distance.toFixed(0)}cm</Text>
                <Text style={styles.historyTime}>
                  {new Date(data.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 안내 정보 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📋 사용 안내:</Text>
          <Text style={styles.infoText}>
            • 30cm 이하: 매우 위험 (강한 진동){'\n'}
            • 30-60cm: 위험 (중간 진동){'\n'}
            • 60-120cm: 주의 (약한 진동){'\n'}
            • 120cm 이상: 안전 (진동 없음)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  distanceContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  distanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  distanceStatus: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  scanButton: {
    backgroundColor: '#007bff',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  disconnectButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  deviceListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  deviceText: {
    fontSize: 14,
    color: '#007bff',
  },
  historyContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  historyDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
});
