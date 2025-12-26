/**
 * MP3 Combiner - Main Application
 * 파일 업로드, UI 관리, 오디오 병합 제어
 */

class MP3CombinerApp {
    constructor() {
        // 상태
        this.files = [];
        this.converterFiles = [];
        this.convertedResults = [];
        this.audioProcessor = new AudioProcessor();
        this.previewAudio = null;
        this.sortableInstance = null;
        this.currentTool = 'combiner'; // 'combiner' or 'converter'
        
        // 설정
        this.config = {
            maxFiles: 20,
            maxFileSize: 50 * 1024 * 1024, // 50MB
            maxTotalSize: 200 * 1024 * 1024, // 200MB
            supportedFormats: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
            supportedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/x-m4a']
        };

        // DOM 요소
        this.elements = {};
        
        // 초기화
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initSortable();
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        this.elements = {
            // Menu Navigation
            menuBtns: document.querySelectorAll('.menu-btn'),
            combinerSection: document.getElementById('combinerSection'),
            converterSection: document.getElementById('converterSection'),
            
            // Upload Section (Combiner)
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            fileListSection: document.getElementById('fileListSection'),
            fileList: document.getElementById('fileList'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            fileCount: document.getElementById('fileCount'),
            totalDuration: document.getElementById('totalDuration'),
            optionsSection: document.getElementById('optionsSection'),
            combineSection: document.getElementById('combineSection'),
            combineBtn: document.getElementById('combineBtn'),
            
            // Options (Combiner)
            outputFormat: document.getElementById('outputFormat'),
            outputQuality: document.getElementById('outputQuality'),
            gapDuration: document.getElementById('gapDuration'),
            
            // Processing Section (Combiner)
            uploadSection: document.getElementById('uploadSection'),
            processingSection: document.getElementById('processingSection'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            
            // Result Section (Combiner)
            resultSection: document.getElementById('resultSection'),
            resultFilename: document.getElementById('resultFilename'),
            playBtn: document.getElementById('playBtn'),
            audioElement: document.getElementById('audioElement'),
            audioProgressContainer: document.getElementById('audioProgressContainer'),
            audioProgress: document.getElementById('audioProgress'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            volumeIcon: document.getElementById('volumeIcon'),
            volumeSlider: document.getElementById('volumeSlider'),
            downloadBtn: document.getElementById('downloadBtn'),
            newCombineBtn: document.getElementById('newCombineBtn'),
            
            // Result Info (Combiner)
            infoFileCount: document.getElementById('infoFileCount'),
            infoTotalDuration: document.getElementById('infoTotalDuration'),
            infoFileSize: document.getElementById('infoFileSize'),
            infoFormat: document.getElementById('infoFormat'),
            
            // Converter Section Elements
            converterDropZone: document.getElementById('converterDropZone'),
            converterFileInput: document.getElementById('converterFileInput'),
            converterFileListSection: document.getElementById('converterFileListSection'),
            converterFileList: document.getElementById('converterFileList'),
            converterClearAllBtn: document.getElementById('converterClearAllBtn'),
            converterFileCount: document.getElementById('converterFileCount'),
            converterTotalDuration: document.getElementById('converterTotalDuration'),
            converterOptionsSection: document.getElementById('converterOptionsSection'),
            convertButtonSection: document.getElementById('convertButtonSection'),
            convertBtn: document.getElementById('convertBtn'),
            
            // Converter Options
            converterOutputFormat: document.getElementById('converterOutputFormat'),
            converterOutputQuality: document.getElementById('converterOutputQuality'),
            converterSampleRate: document.getElementById('converterSampleRate'),
            
            // Converter Processing
            converterUploadSection: document.getElementById('converterUploadSection'),
            converterProcessingSection: document.getElementById('converterProcessingSection'),
            converterProgressBar: document.getElementById('converterProgressBar'),
            converterProgressText: document.getElementById('converterProgressText'),
            
            // Converter Result
            converterResultSection: document.getElementById('converterResultSection'),
            convertedFilesList: document.getElementById('convertedFilesList'),
            downloadAllConvertedBtn: document.getElementById('downloadAllConvertedBtn'),
            newConvertBtn: document.getElementById('newConvertBtn'),
            
            // Converter Result Info
            converterInfoFileCount: document.getElementById('converterInfoFileCount'),
            converterInfoFormat: document.getElementById('converterInfoFormat'),
            converterInfoTotalSize: document.getElementById('converterInfoTotalSize'),
            
            // Toast
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 메뉴 네비게이션
        this.elements.menuBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTool(btn.dataset.menu));
        });
        
        // 드롭존 이벤트 (Combiner)
        this.elements.dropZone.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 파일 관리 (Combiner)
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllFiles());
        
        // 병합
        this.elements.combineBtn.addEventListener('click', () => this.combineFiles());
        
        // 오디오 플레이어
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.audioElement.addEventListener('timeupdate', () => this.updateAudioProgress());
        this.elements.audioElement.addEventListener('ended', () => this.onAudioEnded());
        this.elements.audioElement.addEventListener('loadedmetadata', () => this.onAudioLoaded());
        this.elements.audioProgressContainer.addEventListener('click', (e) => this.seekAudio(e));
        this.elements.volumeSlider.addEventListener('input', (e) => this.changeVolume(e));
        this.elements.volumeIcon.addEventListener('click', () => this.toggleMute());
        
        // 결과 액션 (Combiner)
        this.elements.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.elements.newCombineBtn.addEventListener('click', () => this.startNew());
        
        // Converter 드롭존 이벤트
        this.elements.converterDropZone.addEventListener('click', () => this.elements.converterFileInput.click());
        this.elements.converterDropZone.addEventListener('dragover', (e) => this.handleConverterDragOver(e));
        this.elements.converterDropZone.addEventListener('dragleave', (e) => this.handleConverterDragLeave(e));
        this.elements.converterDropZone.addEventListener('drop', (e) => this.handleConverterDrop(e));
        this.elements.converterFileInput.addEventListener('change', (e) => this.handleConverterFileSelect(e));
        
        // Converter 파일 관리
        this.elements.converterClearAllBtn.addEventListener('click', () => this.clearAllConverterFiles());
        
        // 변환
        this.elements.convertBtn.addEventListener('click', () => this.convertFiles());
        
        // Converter 결과 액션
        this.elements.downloadAllConvertedBtn.addEventListener('click', () => this.downloadAllConverted());
        this.elements.newConvertBtn.addEventListener('click', () => this.startNewConvert());
        
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    /**
     * 도구 전환 (Combiner / Converter)
     */
    switchTool(tool) {
        this.currentTool = tool;
        
        // 메뉴 버튼 활성화 상태 업데이트
        this.elements.menuBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.menu === tool);
        });
        
        // 섹션 표시/숨김
        if (tool === 'combiner') {
            this.elements.combinerSection.style.display = 'block';
            this.elements.converterSection.style.display = 'none';
        } else {
            this.elements.combinerSection.style.display = 'none';
            this.elements.converterSection.style.display = 'block';
        }
    }

    /**
     * SortableJS 초기화
     */
    initSortable() {
        if (typeof Sortable !== 'undefined') {
            this.sortableInstance = new Sortable(this.elements.fileList, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onEnd: (evt) => this.onSortEnd(evt)
            });
        }
    }

    /**
     * 드래그 오버 처리
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropZone.classList.add('drag-over');
    }

    /**
     * 드래그 떠남 처리
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropZone.classList.remove('drag-over');
    }

    /**
     * 드롭 처리
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        this.addFiles(files);
    }

    /**
     * 파일 선택 처리
     */
    handleFileSelect(e) {
        const files = e.target.files;
        this.addFiles(files);
        // 동일 파일 재선택 가능하도록 초기화
        e.target.value = '';
    }

    /**
     * 파일 추가
     */
    async addFiles(fileList) {
        const newFiles = Array.from(fileList);
        
        // 파일 수 검증
        if (this.files.length + newFiles.length > this.config.maxFiles) {
            this.showToast(`최대 ${this.config.maxFiles}개의 파일만 업로드할 수 있습니다.`, 'error');
            return;
        }
        
        // 파일 검증 및 추가
        for (const file of newFiles) {
            // 형식 검증
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            const isValidFormat = this.config.supportedFormats.includes(ext) || 
                                  this.config.supportedMimeTypes.includes(file.type);
            
            if (!isValidFormat) {
                this.showToast(`'${file.name}'은(는) 지원하지 않는 형식입니다.`, 'error');
                continue;
            }
            
            // 크기 검증
            if (file.size > this.config.maxFileSize) {
                this.showToast(`'${file.name}'의 크기가 50MB를 초과합니다.`, 'error');
                continue;
            }
            
            // 중복 검증
            const isDuplicate = this.files.some(f => f.file.name === file.name && f.file.size === file.size);
            if (isDuplicate) {
                this.showToast(`'${file.name}'은(는) 이미 추가되었습니다.`, 'error');
                continue;
            }
            
            // 오디오 정보 가져오기
            try {
                const audioInfo = await this.audioProcessor.getAudioInfo(file);
                this.files.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    duration: audioInfo.duration,
                    sampleRate: audioInfo.sampleRate,
                    channels: audioInfo.channels
                });
            } catch (error) {
                this.showToast(`'${file.name}'을(를) 읽을 수 없습니다.`, 'error');
                console.error('Error reading file:', error);
            }
        }
        
        // 총 크기 검증
        const totalSize = this.files.reduce((sum, f) => sum + f.file.size, 0);
        if (totalSize > this.config.maxTotalSize) {
            this.showToast('총 파일 크기가 200MB를 초과합니다.', 'error');
        }
        
        this.updateFileListUI();
        this.updateUI();
    }

    /**
     * 파일 목록 UI 업데이트
     */
    updateFileListUI() {
        this.elements.fileList.innerHTML = '';
        
        this.files.forEach((fileData, index) => {
            const fileItem = this.createFileItemElement(fileData, index);
            this.elements.fileList.appendChild(fileItem);
        });
        
        // 파일 정보 업데이트
        this.elements.fileCount.textContent = `${this.files.length}개 파일`;
        
        const totalDuration = this.files.reduce((sum, f) => sum + f.duration, 0);
        this.elements.totalDuration.textContent = `총 재생시간: ${this.formatTime(totalDuration)}`;
    }

    /**
     * 파일 아이템 요소 생성
     */
    createFileItemElement(fileData, index) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.id = fileData.id;
        
        div.innerHTML = `
            <span class="drag-handle">≡</span>
            <span class="file-number">${index + 1}.</span>
            <span class="file-name" title="${fileData.file.name}">${fileData.file.name}</span>
            <span class="file-duration">${this.formatTime(fileData.duration)}</span>
            <div class="file-actions">
                <button class="preview-btn" title="미리듣기">🔊</button>
                <button class="delete-btn" title="삭제">🗑️</button>
            </div>
        `;
        
        // 미리듣기 버튼 이벤트
        div.querySelector('.preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewFile(fileData);
        });
        
        // 삭제 버튼 이벤트
        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(fileData.id);
        });
        
        return div;
    }

    /**
     * 파일 미리듣기
     */
    previewFile(fileData) {
        // 이전 미리듣기 정지
        if (this.previewAudio) {
            this.previewAudio.pause();
            URL.revokeObjectURL(this.previewAudio.src);
        }
        
        this.previewAudio = new Audio(URL.createObjectURL(fileData.file));
        this.previewAudio.play();
        
        this.previewAudio.onended = () => {
            URL.revokeObjectURL(this.previewAudio.src);
            this.previewAudio = null;
        };
        
        this.showToast(`'${fileData.file.name}' 미리듣기 중...`, 'success');
    }

    /**
     * 파일 제거
     */
    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateFileListUI();
        this.updateUI();
    }

    /**
     * 모든 파일 삭제
     */
    clearAllFiles() {
        if (this.files.length === 0) return;
        
        this.files = [];
        this.updateFileListUI();
        this.updateUI();
        this.showToast('모든 파일이 삭제되었습니다.');
    }

    /**
     * 정렬 완료 처리
     */
    onSortEnd(evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        
        if (oldIndex !== newIndex) {
            const [movedFile] = this.files.splice(oldIndex, 1);
            this.files.splice(newIndex, 0, movedFile);
            this.updateFileListUI();
        }
    }

    /**
     * UI 상태 업데이트
     */
    updateUI() {
        const hasFiles = this.files.length > 0;
        
        this.elements.fileListSection.style.display = hasFiles ? 'block' : 'none';
        this.elements.optionsSection.style.display = hasFiles ? 'block' : 'none';
        this.elements.combineSection.style.display = hasFiles ? 'flex' : 'none';
    }

    /**
     * 파일 병합 시작
     */
    async combineFiles() {
        if (this.files.length === 0) {
            this.showToast('병합할 파일이 없습니다.', 'error');
            return;
        }
        
        if (this.files.length < 2) {
            this.showToast('2개 이상의 파일이 필요합니다.', 'error');
            return;
        }
        
        // 화면 전환
        this.showSection('processing');
        this.updateProgress(0, '파일 로딩 중...');
        
        try {
            const format = this.elements.outputFormat.value;
            const quality = parseInt(this.elements.outputQuality.value);
            const gapDuration = parseFloat(this.elements.gapDuration.value);
            
            // 오디오 파일 로드
            const audioFiles = this.files.map(f => f.file);
            await this.audioProcessor.loadAudioFiles(audioFiles, (progress) => {
                this.updateProgress(progress, '파일 로딩 중...');
            });
            
            // 오디오 병합
            this.updateProgress(50, '파일 병합 중...');
            await this.audioProcessor.combineBuffers(
                this.audioProcessor.audioBuffers,
                gapDuration,
                (progress) => {
                    this.updateProgress(progress, '파일 병합 중...');
                }
            );
            
            // 오디오 내보내기
            this.updateProgress(90, '오디오 인코딩 중...');
            await this.audioProcessor.exportAudio(format, quality, (progress) => {
                this.updateProgress(progress, '오디오 인코딩 중...');
            });
            
            // 결과 화면 표시
            this.showResult(format, quality);
            
        } catch (error) {
            console.error('Combine error:', error);
            this.showToast('파일 병합 중 오류가 발생했습니다: ' + error.message, 'error');
            this.showSection('upload');
        }
    }

    /**
     * 진행률 업데이트
     */
    updateProgress(percent, text) {
        this.elements.progressBar.style.width = `${percent}%`;
        this.elements.progressText.textContent = `${Math.round(percent)}% 완료 - ${text}`;
    }

    /**
     * 결과 화면 표시
     */
    showResult(format, quality) {
        // 결과 파일명 생성
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') + '_' +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        
        this.resultFilename = `combined_${timestamp}.${format}`;
        this.elements.resultFilename.textContent = `🎵 ${this.resultFilename}`;
        
        // 오디오 플레이어 설정
        const audioUrl = this.audioProcessor.getCombinedAudioUrl();
        this.elements.audioElement.src = audioUrl;
        
        // 결과 정보 표시
        this.elements.infoFileCount.textContent = `${this.files.length}개`;
        this.elements.infoTotalDuration.textContent = this.formatTime(this.audioProcessor.getCombinedDuration());
        this.elements.infoFileSize.textContent = this.formatFileSize(this.audioProcessor.getCombinedFileSize());
        this.elements.infoFormat.textContent = `${format.toUpperCase()} (${quality}kbps)`;
        
        // 화면 전환
        this.showSection('result');
    }

    /**
     * 섹션 표시 전환
     */
    showSection(section) {
        this.elements.uploadSection.style.display = section === 'upload' ? 'flex' : 'none';
        this.elements.processingSection.style.display = section === 'processing' ? 'block' : 'none';
        this.elements.resultSection.style.display = section === 'result' ? 'flex' : 'none';
    }

    /**
     * 재생/일시정지 토글
     */
    togglePlay() {
        if (this.elements.audioElement.paused) {
            this.elements.audioElement.play();
            this.elements.playBtn.textContent = '⏸️';
        } else {
            this.elements.audioElement.pause();
            this.elements.playBtn.textContent = '▶️';
        }
    }

    /**
     * 오디오 진행률 업데이트
     */
    updateAudioProgress() {
        const audio = this.elements.audioElement;
        const percent = (audio.currentTime / audio.duration) * 100;
        this.elements.audioProgress.style.width = `${percent}%`;
        this.elements.currentTime.textContent = this.formatTime(audio.currentTime);
    }

    /**
     * 오디오 로드 완료
     */
    onAudioLoaded() {
        this.elements.totalTime.textContent = this.formatTime(this.elements.audioElement.duration);
    }

    /**
     * 오디오 재생 완료
     */
    onAudioEnded() {
        this.elements.playBtn.textContent = '▶️';
        this.elements.audioProgress.style.width = '0%';
        this.elements.audioElement.currentTime = 0;
    }

    /**
     * 오디오 시크
     */
    seekAudio(e) {
        const container = this.elements.audioProgressContainer;
        const rect = container.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.elements.audioElement.currentTime = percent * this.elements.audioElement.duration;
    }

    /**
     * 볼륨 변경
     */
    changeVolume(e) {
        const volume = e.target.value / 100;
        this.elements.audioElement.volume = volume;
        this.updateVolumeIcon(volume);
    }

    /**
     * 음소거 토글
     */
    toggleMute() {
        const audio = this.elements.audioElement;
        audio.muted = !audio.muted;
        
        if (audio.muted) {
            this.elements.volumeIcon.textContent = '🔇';
        } else {
            this.updateVolumeIcon(audio.volume);
        }
    }

    /**
     * 볼륨 아이콘 업데이트
     */
    updateVolumeIcon(volume) {
        if (volume === 0) {
            this.elements.volumeIcon.textContent = '🔇';
        } else if (volume < 0.5) {
            this.elements.volumeIcon.textContent = '🔉';
        } else {
            this.elements.volumeIcon.textContent = '🔊';
        }
    }

    /**
     * 결과 다운로드
     */
    downloadResult() {
        const blob = this.audioProcessor.combinedBlob;
        if (!blob) {
            this.showToast('다운로드할 파일이 없습니다.', 'error');
            return;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.resultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('다운로드가 시작되었습니다.', 'success');
    }

    /**
     * 새로 시작
     */
    startNew() {
        // 오디오 정지
        this.elements.audioElement.pause();
        this.elements.audioElement.src = '';
        this.elements.playBtn.textContent = '▶️';
        
        // 프로세서 정리
        this.audioProcessor.cleanup();
        
        // 파일 초기화
        this.files = [];
        this.updateFileListUI();
        this.updateUI();
        
        // 진행률 초기화
        this.elements.progressBar.style.width = '0%';
        this.elements.progressText.textContent = '0% 완료';
        
        // 오디오 플레이어 초기화
        this.elements.audioProgress.style.width = '0%';
        this.elements.currentTime.textContent = '0:00';
        this.elements.totalTime.textContent = '0:00';
        
        // 화면 전환
        this.showSection('upload');
    }

    /**
     * 시간 포맷팅
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 파일 크기 포맷팅
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        const toastMessage = this.elements.toastMessage;
        
        toast.className = 'toast';
        if (type === 'error') toast.classList.add('error');
        if (type === 'success') toast.classList.add('success');
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        if (this.previewAudio) {
            this.previewAudio.pause();
            URL.revokeObjectURL(this.previewAudio.src);
        }
        this.audioProcessor.cleanup();
        
        // Converter 결과 정리
        this.convertedResults.forEach(result => {
            if (result.blob) {
                URL.revokeObjectURL(URL.createObjectURL(result.blob));
            }
        });
    }

    // ==================== CONVERTER 메서드 ====================

    /**
     * Converter 드래그 오버 처리
     */
    handleConverterDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.converterDropZone.classList.add('drag-over');
    }

    /**
     * Converter 드래그 떠남 처리
     */
    handleConverterDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.converterDropZone.classList.remove('drag-over');
    }

    /**
     * Converter 드롭 처리
     */
    handleConverterDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.converterDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        this.addConverterFiles(files);
    }

    /**
     * Converter 파일 선택 처리
     */
    handleConverterFileSelect(e) {
        const files = e.target.files;
        this.addConverterFiles(files);
        e.target.value = '';
    }

    /**
     * Converter 파일 추가
     */
    async addConverterFiles(fileList) {
        const newFiles = Array.from(fileList);
        
        // 파일 수 검증
        if (this.converterFiles.length + newFiles.length > this.config.maxFiles) {
            this.showToast(`최대 ${this.config.maxFiles}개의 파일만 업로드할 수 있습니다.`, 'error');
            return;
        }
        
        // 파일 검증 및 추가
        for (const file of newFiles) {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            const isValidFormat = this.config.supportedFormats.includes(ext) ||
                                  this.config.supportedMimeTypes.includes(file.type);
            
            if (!isValidFormat) {
                this.showToast(`'${file.name}'은(는) 지원하지 않는 형식입니다.`, 'error');
                continue;
            }
            
            if (file.size > this.config.maxFileSize) {
                this.showToast(`'${file.name}'의 크기가 50MB를 초과합니다.`, 'error');
                continue;
            }
            
            const isDuplicate = this.converterFiles.some(f => f.file.name === file.name && f.file.size === file.size);
            if (isDuplicate) {
                this.showToast(`'${file.name}'은(는) 이미 추가되었습니다.`, 'error');
                continue;
            }
            
            try {
                const audioInfo = await this.audioProcessor.getAudioInfo(file);
                this.converterFiles.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    duration: audioInfo.duration,
                    sampleRate: audioInfo.sampleRate,
                    channels: audioInfo.channels
                });
            } catch (error) {
                this.showToast(`'${file.name}'을(를) 읽을 수 없습니다.`, 'error');
                console.error('Error reading file:', error);
            }
        }
        
        this.updateConverterFileListUI();
        this.updateConverterUI();
    }

    /**
     * Converter 파일 목록 UI 업데이트
     */
    updateConverterFileListUI() {
        this.elements.converterFileList.innerHTML = '';
        
        this.converterFiles.forEach((fileData, index) => {
            const fileItem = this.createConverterFileItemElement(fileData, index);
            this.elements.converterFileList.appendChild(fileItem);
        });
        
        this.elements.converterFileCount.textContent = `${this.converterFiles.length}개 파일`;
        
        const totalDuration = this.converterFiles.reduce((sum, f) => sum + f.duration, 0);
        this.elements.converterTotalDuration.textContent = `총 재생시간: ${this.formatTime(totalDuration)}`;
    }

    /**
     * Converter 파일 아이템 요소 생성
     */
    createConverterFileItemElement(fileData, index) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.id = fileData.id;
        
        const ext = fileData.file.name.split('.').pop().toUpperCase();
        
        div.innerHTML = `
            <span class="file-number">${index + 1}.</span>
            <span class="file-name" title="${fileData.file.name}">${fileData.file.name}</span>
            <span class="format-badge">${ext}</span>
            <span class="file-duration">${this.formatTime(fileData.duration)}</span>
            <div class="file-actions">
                <button class="preview-btn" title="미리듣기">🔊</button>
                <button class="delete-btn" title="삭제">🗑️</button>
            </div>
        `;
        
        div.querySelector('.preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewFile(fileData);
        });
        
        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeConverterFile(fileData.id);
        });
        
        return div;
    }

    /**
     * Converter 파일 제거
     */
    removeConverterFile(fileId) {
        this.converterFiles = this.converterFiles.filter(f => f.id !== fileId);
        this.updateConverterFileListUI();
        this.updateConverterUI();
    }

    /**
     * Converter 모든 파일 삭제
     */
    clearAllConverterFiles() {
        if (this.converterFiles.length === 0) return;
        
        this.converterFiles = [];
        this.updateConverterFileListUI();
        this.updateConverterUI();
        this.showToast('모든 파일이 삭제되었습니다.');
    }

    /**
     * Converter UI 상태 업데이트
     */
    updateConverterUI() {
        const hasFiles = this.converterFiles.length > 0;
        
        this.elements.converterFileListSection.style.display = hasFiles ? 'block' : 'none';
        this.elements.converterOptionsSection.style.display = hasFiles ? 'block' : 'none';
        this.elements.convertButtonSection.style.display = hasFiles ? 'flex' : 'none';
    }

    /**
     * 파일 변환 시작
     */
    async convertFiles() {
        if (this.converterFiles.length === 0) {
            this.showToast('변환할 파일이 없습니다.', 'error');
            return;
        }
        
        // 화면 전환
        this.showConverterSection('processing');
        this.updateConverterProgress(0, '파일 변환 준비 중...');
        
        try {
            const format = this.elements.converterOutputFormat.value;
            const quality = parseInt(this.elements.converterOutputQuality.value);
            const sampleRate = parseInt(this.elements.converterSampleRate.value);
            
            const files = this.converterFiles.map(f => f.file);
            
            this.convertedResults = await this.audioProcessor.convertFiles(
                files,
                format,
                quality,
                sampleRate,
                (progress) => {
                    this.updateConverterProgress(progress, '파일 변환 중...');
                }
            );
            
            // 결과 화면 표시
            this.showConverterResult(format, quality);
            
        } catch (error) {
            console.error('Convert error:', error);
            this.showToast('파일 변환 중 오류가 발생했습니다: ' + error.message, 'error');
            this.showConverterSection('upload');
        }
    }

    /**
     * Converter 진행률 업데이트
     */
    updateConverterProgress(percent, text) {
        this.elements.converterProgressBar.style.width = `${percent}%`;
        this.elements.converterProgressText.textContent = `${Math.round(percent)}% 완료 - ${text}`;
    }

    /**
     * Converter 섹션 표시 전환
     */
    showConverterSection(section) {
        this.elements.converterUploadSection.style.display = section === 'upload' ? 'flex' : 'none';
        this.elements.converterProcessingSection.style.display = section === 'processing' ? 'block' : 'none';
        this.elements.converterResultSection.style.display = section === 'result' ? 'flex' : 'none';
    }

    /**
     * Converter 결과 화면 표시
     */
    showConverterResult(format, quality) {
        // 변환된 파일 목록 표시
        this.elements.convertedFilesList.innerHTML = '';
        
        const successResults = this.convertedResults.filter(r => !r.error);
        
        successResults.forEach((result, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'converted-file-item';
            
            fileItem.innerHTML = `
                <div class="converted-file-info">
                    <span class="converted-file-icon">🎵</span>
                    <div class="converted-file-details">
                        <span class="converted-file-name">${result.newFilename}</span>
                        <span class="converted-file-meta">${this.formatTime(result.duration)} · ${this.formatFileSize(result.size)}</span>
                    </div>
                </div>
                <div class="converted-file-actions">
                    <button class="btn btn-primary download-single-btn" data-index="${index}">📥 다운로드</button>
                </div>
            `;
            
            fileItem.querySelector('.download-single-btn').addEventListener('click', () => {
                this.downloadConvertedFile(index);
            });
            
            this.elements.convertedFilesList.appendChild(fileItem);
        });
        
        // 결과 정보 표시
        this.elements.converterInfoFileCount.textContent = `${successResults.length}개`;
        this.elements.converterInfoFormat.textContent = `${format.toUpperCase()} (${quality}kbps)`;
        
        const totalSize = successResults.reduce((sum, r) => sum + r.size, 0);
        this.elements.converterInfoTotalSize.textContent = this.formatFileSize(totalSize);
        
        // 화면 전환
        this.showConverterSection('result');
    }

    /**
     * 개별 변환 파일 다운로드
     */
    downloadConvertedFile(index) {
        const result = this.convertedResults.filter(r => !r.error)[index];
        if (!result || !result.blob) {
            this.showToast('다운로드할 파일이 없습니다.', 'error');
            return;
        }
        
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.newFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`'${result.newFilename}' 다운로드가 시작되었습니다.`, 'success');
    }

    /**
     * 모든 변환 파일 다운로드
     */
    downloadAllConverted() {
        const successResults = this.convertedResults.filter(r => !r.error);
        
        if (successResults.length === 0) {
            this.showToast('다운로드할 파일이 없습니다.', 'error');
            return;
        }
        
        // 개별 파일 순차 다운로드
        successResults.forEach((result, index) => {
            setTimeout(() => {
                this.downloadConvertedFile(index);
            }, index * 500); // 0.5초 간격으로 다운로드
        });
    }

    /**
     * Converter 새로 시작
     */
    startNewConvert() {
        // 결과 정리
        this.convertedResults.forEach(result => {
            if (result.blob) {
                URL.revokeObjectURL(URL.createObjectURL(result.blob));
            }
        });
        this.convertedResults = [];
        
        // 파일 초기화
        this.converterFiles = [];
        this.updateConverterFileListUI();
        this.updateConverterUI();
        
        // 진행률 초기화
        this.elements.converterProgressBar.style.width = '0%';
        this.elements.converterProgressText.textContent = '0% 완료';
        
        // 화면 전환
        this.showConverterSection('upload');
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MP3CombinerApp();
});
