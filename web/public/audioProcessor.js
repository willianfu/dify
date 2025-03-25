class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 初始化累积时域数据的缓冲区
    this.accumulatedTimeData = [];
    this.accumulatedSamples = 0;
    this.targetSamples = Math.floor(sampleRate * 0.5); // 0.5秒的采样点数量
    this.targetSampleRate = 16000; // 目标采样率为16kHz
  }

  // 将Float32Array转换为Int16Array
  floatToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // 将 -1.0 到 1.0 的浮点数转换为 -32768 到 32767 的整数
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  // 重采样函数，将数据转换为16kHz
  resample(audioData, originalSampleRate, targetSampleRate) {
    if (originalSampleRate === targetSampleRate) {
      return audioData;
    }

    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = Math.floor(i * ratio);
      result[i] = audioData[originalIndex];
    }

    return result;
  }

  // 创建WAV文件头
  createWavHeader(sampleRate, bitsPerSample, channels, dataLength) {
    const headerLength = 44;
    const wavHeader = new ArrayBuffer(headerLength);
    const view = new DataView(wavHeader);

    // "RIFF"
    view.setUint8(0, 0x52);
    view.setUint8(1, 0x49);
    view.setUint8(2, 0x46);
    view.setUint8(3, 0x46);

    // RIFF块大小
    view.setUint32(4, 36 + dataLength, true);

    // "WAVE"
    view.setUint8(8, 0x57);
    view.setUint8(9, 0x41);
    view.setUint8(10, 0x56);
    view.setUint8(11, 0x45);

    // "fmt "子块
    view.setUint8(12, 0x66);
    view.setUint8(13, 0x6d);
    view.setUint8(14, 0x74);
    view.setUint8(15, 0x20);

    // 子块1大小
    view.setUint32(16, 16, true);

    // PCM格式
    view.setUint16(20, 1, true);

    // 通道数
    view.setUint16(22, channels, true);

    // 采样率
    view.setUint32(24, sampleRate, true);

    // 字节率 = SampleRate * NumChannels * BitsPerSample/8
    view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);

    // 块对齐 = NumChannels * BitsPerSample/8
    view.setUint16(32, channels * (bitsPerSample / 8), true);

    // 每个样本的位数
    view.setUint16(34, bitsPerSample, true);

    // "data"子块
    view.setUint8(36, 0x64);
    view.setUint8(37, 0x61);
    view.setUint8(38, 0x74);
    view.setUint8(39, 0x61);

    // 数据大小
    view.setUint32(40, dataLength, true);

    return new Uint8Array(wavHeader);
  }

  // 处理时域数据的累积和发送
  processTimeData(channelData) {
    // 累积时域数据
    this.accumulatedTimeData.push(...Array.from(channelData));
    this.accumulatedSamples += channelData.length;

    // 当累积了0.5秒的数据时，发送时域数据并重置
    if (this.accumulatedSamples >= this.targetSamples) {
      // 重采样到16kHz
      const resampledData = this.resample(
        new Float32Array(this.accumulatedTimeData),
        sampleRate,
        this.targetSampleRate
      );

      // 转换为Int16格式
      const int16Data = this.floatToInt16(resampledData);

      // 创建WAV头
      const wavHeader = this.createWavHeader(
        this.targetSampleRate,
        16, // 16位
        1, // 单声道
        int16Data.byteLength
      );

      // 合并WAV头和音频数据
      const wavBuffer = new Uint8Array(wavHeader.length + int16Data.byteLength);
      wavBuffer.set(wavHeader);
      wavBuffer.set(new Uint8Array(int16Data.buffer), wavHeader.length);

      // 发送WAV格式的数据
      this.port.postMessage({
        type: "time-domain",
        data: wavBuffer,
        format: "wav",
        sampleRate: this.targetSampleRate,
      });

      this.accumulatedTimeData = [];
      this.accumulatedSamples = 0;
    }
  }

  // 处理频域数据的计算和发送
  processFrequencyData(channelData) {
    const fftSize = channelData.length;
    const frequencyData = new Float32Array(fftSize);

    for (let i = 0; i < fftSize; i++) {
      frequencyData[i] = Math.abs(channelData[i]); // 简单幅值计算
    }

    this.port.postMessage({
      type: "frequency-domain",
      data: frequencyData,
    });
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0]; // 获取 PCM 音频数据

      // 处理时域数据
      this.processTimeData(channelData);

      // 处理频域数据
      this.processFrequencyData(channelData);
    }
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
