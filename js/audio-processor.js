/**
 * MP3 Combiner - Audio Processor
 * Web Audio API를 사용한 클라이언트 사이드 오디오 처리
 */

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = [];
        this.combinedBuffer = null;
        this.combinedBlob = null;
    }

    /**
     * AudioContext 초기화
     */
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * 파일을 ArrayBuffer로 읽기
     * @param {File} file - 오디오 파일
     * @returns {Promise<ArrayBuffer>}
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('파일을 읽는데 실패했습니다.'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * ArrayBuffer를 AudioBuffer로 디코딩
     * @param {ArrayBuffer} arrayBuffer - 오디오 데이터
     * @returns {Promise<AudioBuffer>}
     */
    async decodeAudioData(arrayBuffer) {
        this.initAudioContext();
        return new Promise((resolve, reject) => {
            this.audioContext.decodeAudioData(
                arrayBuffer,
                (buffer) => resolve(buffer),
                (error) => reject(new Error('오디오 디코딩에 실패했습니다.'))
            );
        });
    }

    /**
     * 파일의 오디오 정보 가져오기 (duration 등)
     * @param {File} file - 오디오 파일
     * @returns {Promise<{duration: number, sampleRate: number, channels: number}>}
     */
    async getAudioInfo(file) {
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        const audioBuffer = await this.decodeAudioData(arrayBuffer);
        
        return {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels
        };
    }

    /**
     * 여러 오디오 파일 로드
     * @param {File[]} files - 오디오 파일 배열
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<AudioBuffer[]>}
     */
    async loadAudioFiles(files, onProgress = () => {}) {
        this.audioBuffers = [];
        const total = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const audioBuffer = await this.decodeAudioData(arrayBuffer);
            this.audioBuffers.push(audioBuffer);
            onProgress((i + 1) / total * 50); // 로딩은 전체의 50%
        }

        return this.audioBuffers;
    }

    /**
     * 무음 버퍼 생성
     * @param {number} duration - 무음 길이 (초)
     * @param {number} sampleRate - 샘플 레이트
     * @param {number} channels - 채널 수
     * @returns {AudioBuffer}
     */
    createSilenceBuffer(duration, sampleRate, channels) {
        const frameCount = Math.floor(duration * sampleRate);
        return this.audioContext.createBuffer(channels, frameCount, sampleRate);
    }

    /**
     * 오디오 버퍼들 병합
     * @param {AudioBuffer[]} buffers - 병합할 오디오 버퍼 배열
     * @param {number} gapDuration - 파일 간 간격 (초)
     * @param {Function} onProgress - 진행률 콜백
     * @returns {AudioBuffer}
     */
    async combineBuffers(buffers, gapDuration = 0, onProgress = () => {}) {
        if (buffers.length === 0) {
            throw new Error('병합할 오디오가 없습니다.');
        }

        this.initAudioContext();

        // 기준 샘플레이트와 채널 수 결정 (첫 번째 파일 기준)
        const targetSampleRate = buffers[0].sampleRate;
        const targetChannels = Math.max(...buffers.map(b => b.numberOfChannels));

        // 전체 길이 계산
        let totalLength = 0;
        for (let i = 0; i < buffers.length; i++) {
            totalLength += buffers[i].length;
            if (i < buffers.length - 1 && gapDuration > 0) {
                totalLength += Math.floor(gapDuration * targetSampleRate);
            }
        }

        // 결합된 버퍼 생성
        this.combinedBuffer = this.audioContext.createBuffer(
            targetChannels,
            totalLength,
            targetSampleRate
        );

        // 각 채널별로 데이터 복사
        let offset = 0;
        for (let bufferIndex = 0; bufferIndex < buffers.length; bufferIndex++) {
            const buffer = buffers[bufferIndex];
            
            for (let channel = 0; channel < targetChannels; channel++) {
                const outputData = this.combinedBuffer.getChannelData(channel);
                // 원본 채널이 적은 경우 첫 번째 채널 데이터 사용
                const sourceChannel = channel < buffer.numberOfChannels ? channel : 0;
                const inputData = buffer.getChannelData(sourceChannel);
                
                // 샘플레이트가 다른 경우 리샘플링 (간단한 선형 보간)
                if (buffer.sampleRate !== targetSampleRate) {
                    const ratio = buffer.sampleRate / targetSampleRate;
                    const newLength = Math.floor(buffer.length / ratio);
                    for (let i = 0; i < newLength; i++) {
                        const srcIndex = i * ratio;
                        const srcIndexFloor = Math.floor(srcIndex);
                        const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
                        const t = srcIndex - srcIndexFloor;
                        outputData[offset + i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
                    }
                } else {
                    outputData.set(inputData, offset);
                }
            }

            offset += buffer.length;

            // 간격 추가 (마지막 파일 제외)
            if (bufferIndex < buffers.length - 1 && gapDuration > 0) {
                offset += Math.floor(gapDuration * targetSampleRate);
            }

            onProgress(50 + ((bufferIndex + 1) / buffers.length) * 40); // 병합은 50-90%
        }

        return this.combinedBuffer;
    }

    /**
     * AudioBuffer를 WAV Blob으로 변환
     * @param {AudioBuffer} audioBuffer - 오디오 버퍼
     * @returns {Blob}
     */
    audioBufferToWav(audioBuffer) {
        const numOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numOfChannels * bytesPerSample;
        
        const buffer = audioBuffer;
        const length = buffer.length * blockAlign;
        const arrayBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrayBuffer);
        
        // WAV 헤더 작성
        // RIFF identifier
        this.writeString(view, 0, 'RIFF');
        // file length
        view.setUint32(4, 36 + length, true);
        // RIFF type
        this.writeString(view, 8, 'WAVE');
        // format chunk identifier
        this.writeString(view, 12, 'fmt ');
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (PCM)
        view.setUint16(20, format, true);
        // channel count
        view.setUint16(22, numOfChannels, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * blockAlign, true);
        // block align
        view.setUint16(32, blockAlign, true);
        // bits per sample
        view.setUint16(34, bitDepth, true);
        // data chunk identifier
        this.writeString(view, 36, 'data');
        // data chunk length
        view.setUint32(40, length, true);
        
        // 오디오 데이터 작성 (인터리브)
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numOfChannels; channel++) {
                let sample = buffer.getChannelData(channel)[i];
                // 클리핑 방지
                sample = Math.max(-1, Math.min(1, sample));
                // 16비트 정수로 변환
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * DataView에 문자열 쓰기
     * @param {DataView} view 
     * @param {number} offset 
     * @param {string} string 
     */
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * WAV를 MP3로 변환 (lamejs 사용 시)
     * 참고: 클라이언트 사이드 MP3 인코딩은 lamejs 라이브러리 필요
     * 여기서는 WAV를 기본으로 사용하고, MP3는 서버사이드 또는 별도 라이브러리로 처리
     * @param {Blob} wavBlob 
     * @param {number} bitrate 
     * @returns {Promise<Blob>}
     */
    async wavToMp3(wavBlob, bitrate = 192) {
        // lamejs가 로드되어 있는지 확인
        if (typeof lamejs === 'undefined') {
            console.warn('lamejs not loaded, returning WAV instead');
            return wavBlob;
        }

        const arrayBuffer = await wavBlob.arrayBuffer();
        const dataView = new DataView(arrayBuffer);
        
        // WAV 헤더 파싱
        const channels = dataView.getUint16(22, true);
        const sampleRate = dataView.getUint32(24, true);
        const dataOffset = 44;
        const samples = (arrayBuffer.byteLength - dataOffset) / 2 / channels;
        
        // 채널 데이터 추출
        const leftChannel = new Int16Array(samples);
        const rightChannel = channels === 2 ? new Int16Array(samples) : null;
        
        for (let i = 0; i < samples; i++) {
            const offset = dataOffset + i * channels * 2;
            leftChannel[i] = dataView.getInt16(offset, true);
            if (rightChannel) {
                rightChannel[i] = dataView.getInt16(offset + 2, true);
            }
        }
        
        // MP3 인코딩
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
        const mp3Data = [];
        
        const sampleBlockSize = 1152;
        for (let i = 0; i < samples; i += sampleBlockSize) {
            const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
            const rightChunk = rightChannel ? rightChannel.subarray(i, i + sampleBlockSize) : null;
            
            let mp3buf;
            if (channels === 2) {
                mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            } else {
                mp3buf = mp3encoder.encodeBuffer(leftChunk);
            }
            
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        
        const mp3End = mp3encoder.flush();
        if (mp3End.length > 0) {
            mp3Data.push(mp3End);
        }
        
        return new Blob(mp3Data, { type: 'audio/mp3' });
    }

    /**
     * 병합된 오디오를 지정된 형식으로 내보내기
     * @param {string} format - 'mp3' 또는 'wav'
     * @param {number} bitrate - MP3 비트레이트 (kbps)
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<Blob>}
     */
    async exportAudio(format = 'mp3', bitrate = 192, onProgress = () => {}) {
        if (!this.combinedBuffer) {
            throw new Error('병합된 오디오가 없습니다.');
        }

        onProgress(90);
        
        const wavBlob = this.audioBufferToWav(this.combinedBuffer);
        
        if (format === 'wav') {
            this.combinedBlob = wavBlob;
            onProgress(100);
            return wavBlob;
        }

        // MP3 변환 시도
        try {
            this.combinedBlob = await this.wavToMp3(wavBlob, bitrate);
        } catch (error) {
            console.warn('MP3 encoding failed, using WAV:', error);
            this.combinedBlob = wavBlob;
        }
        
        onProgress(100);
        return this.combinedBlob;
    }

    /**
     * 병합된 오디오 URL 생성
     * @returns {string}
     */
    getCombinedAudioUrl() {
        if (!this.combinedBlob) {
            throw new Error('병합된 오디오가 없습니다.');
        }
        return URL.createObjectURL(this.combinedBlob);
    }

    /**
     * 병합된 오디오 파일 크기
     * @returns {number}
     */
    getCombinedFileSize() {
        if (!this.combinedBlob) {
            return 0;
        }
        return this.combinedBlob.size;
    }

    /**
     * 병합된 오디오 재생 시간
     * @returns {number}
     */
    getCombinedDuration() {
        if (!this.combinedBuffer) {
            return 0;
        }
        return this.combinedBuffer.duration;
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        this.audioBuffers = [];
        this.combinedBuffer = null;
        if (this.combinedBlob) {
            URL.revokeObjectURL(URL.createObjectURL(this.combinedBlob));
            this.combinedBlob = null;
        }
    }

    /**
     * 단일 오디오 파일을 다른 형식으로 변환
     * @param {File} file - 변환할 오디오 파일
     * @param {string} targetFormat - 대상 형식 ('mp3', 'wav', 'ogg')
     * @param {number} bitrate - 비트레이트 (kbps)
     * @param {number} sampleRate - 샘플레이트 (Hz)
     * @returns {Promise<{blob: Blob, duration: number}>}
     */
    async convertFile(file, targetFormat = 'mp3', bitrate = 192, sampleRate = 44100) {
        // 파일 읽기 및 디코딩
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        const audioBuffer = await this.decodeAudioData(arrayBuffer);
        
        // 샘플레이트가 다른 경우 리샘플링
        let processedBuffer = audioBuffer;
        if (audioBuffer.sampleRate !== sampleRate) {
            processedBuffer = await this.resampleBuffer(audioBuffer, sampleRate);
        }
        
        // WAV로 변환
        const wavBlob = this.audioBufferToWavWithSampleRate(processedBuffer, sampleRate);
        
        let outputBlob;
        
        // 대상 형식으로 변환
        if (targetFormat === 'wav') {
            outputBlob = wavBlob;
        } else if (targetFormat === 'mp3') {
            outputBlob = await this.wavToMp3(wavBlob, bitrate);
        } else if (targetFormat === 'ogg') {
            // OGG 변환은 브라우저 지원 한계로 WAV로 대체
            outputBlob = wavBlob;
            console.warn('OGG encoding not supported, using WAV');
        } else {
            outputBlob = wavBlob;
        }
        
        return {
            blob: outputBlob,
            duration: processedBuffer.duration
        };
    }

    /**
     * 여러 파일을 일괄 변환
     * @param {File[]} files - 변환할 파일 배열
     * @param {string} targetFormat - 대상 형식
     * @param {number} bitrate - 비트레이트
     * @param {number} sampleRate - 샘플레이트
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<Array<{originalName: string, blob: Blob, duration: number}>>}
     */
    async convertFiles(files, targetFormat = 'mp3', bitrate = 192, sampleRate = 44100, onProgress = () => {}) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                const result = await this.convertFile(file, targetFormat, bitrate, sampleRate);
                
                // 새 파일명 생성
                const originalName = file.name.replace(/\.[^/.]+$/, '');
                const newFilename = `${originalName}.${targetFormat}`;
                
                results.push({
                    originalName: file.name,
                    newFilename: newFilename,
                    blob: result.blob,
                    duration: result.duration,
                    size: result.blob.size
                });
            } catch (error) {
                console.error(`Error converting ${file.name}:`, error);
                results.push({
                    originalName: file.name,
                    error: error.message
                });
            }
            
            onProgress(((i + 1) / total) * 100);
        }
        
        return results;
    }

    /**
     * AudioBuffer를 지정된 샘플레이트로 리샘플링
     * @param {AudioBuffer} audioBuffer - 원본 오디오 버퍼
     * @param {number} targetSampleRate - 목표 샘플레이트
     * @returns {Promise<AudioBuffer>}
     */
    async resampleBuffer(audioBuffer, targetSampleRate) {
        // 오프라인 오디오 컨텍스트를 사용한 리샘플링
        const duration = audioBuffer.duration;
        const newLength = Math.ceil(duration * targetSampleRate);
        
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            newLength,
            targetSampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);
        
        return await offlineContext.startRendering();
    }

    /**
     * AudioBuffer를 지정된 샘플레이트의 WAV Blob으로 변환
     * @param {AudioBuffer} audioBuffer - 오디오 버퍼
     * @param {number} sampleRate - 샘플레이트
     * @returns {Blob}
     */
    audioBufferToWavWithSampleRate(audioBuffer, sampleRate) {
        const numOfChannels = audioBuffer.numberOfChannels;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numOfChannels * bytesPerSample;
        
        const buffer = audioBuffer;
        const length = buffer.length * blockAlign;
        const arrayBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrayBuffer);
        
        // WAV 헤더 작성
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, length, true);
        
        // 오디오 데이터 작성
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numOfChannels; channel++) {
                let sample = buffer.getChannelData(channel)[i];
                sample = Math.max(-1, Math.min(1, sample));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
}

// 전역으로 내보내기
window.AudioProcessor = AudioProcessor;
