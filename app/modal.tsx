import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  const router = useRouter();
  const [text, setText] = useState('');

  const onConfirm = () => {
    if (text && text.trim().length > 0) {
      Speech.speak(text.trim());
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">TTS 텍스트 입력</ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="읽을 텍스트를 입력하세요"
          multiline
        />
      </View>
      <View style={styles.buttons}>
        <View style={styles.button}>
          <Button title="취소" onPress={() => router.back()} />
        </View>
        <View style={styles.button}>
          <Button title="확인" onPress={onConfirm} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
});
