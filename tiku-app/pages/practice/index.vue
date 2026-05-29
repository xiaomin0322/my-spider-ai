<template>
  <view class="container">
    <!-- 顶部进度 -->
    <view class="top-bar">
      <view class="progress-text">{{ currentIdx + 1 }} / {{ questions.length }}</view>
      <view class="top-actions">
        <view class="action-btn" :class="{ active: isFav }" @tap="toggleFav">★</view>
        <view class="action-btn" @tap="showIndex = true">☰</view>
      </view>
    </view>

    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>

    <!-- 题目内容 -->
    <scroll-view scroll-y class="question-area" v-if="currentQ">
      <!-- 题型 -->
      <view class="q-type">【{{ currentQ.type || '选择题' }}】</view>

      <!-- 题干 -->
      <view class="q-stem">{{ currentIdx + 1 }}. {{ currentQ.stem }}</view>

      <!-- 选项 -->
      <view class="options">
        <view
          v-for="(opt, oi) in currentQ.options"
          :key="oi"
          class="option-item"
          :class="{ selected: !showAnswer && selected === opt.label, correct: showAnswer && opt.label === currentQ.answer, wrong: showAnswer && opt.label === selected && !isCorrect }"
          @tap="selectOption(opt.label)"
        >
          <view class="opt-label">{{ opt.label }}</view>
          <view class="opt-text">{{ opt.text }}</view>
          <view class="opt-icon" v-if="showAnswer">
            <text v-if="opt.label === currentQ.answer" class="icon-correct">✔</text>
            <text v-else-if="opt.label === selected && opt.label !== currentQ.answer" class="icon-wrong">✘</text>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-area" v-if="!showAnswer">
        <button class="submit-btn" :disabled="!selected" @tap="submitAnswer">提交答案</button>
      </view>

      <!-- 答案解析 -->
      <view class="answer-section" v-if="showAnswer">
        <view class="answer-box" :class="isCorrect ? 'correct' : 'wrong'">
          <text class="answer-label">{{ isCorrect ? '回答正确！' : '回答错误' }}</text>
          <text class="answer-value"> 正确答案：{{ currentQ.answer }}</text>
        </view>
        <view class="explain-box" v-if="currentQ.explanation">
          <view class="explain-label">【解析】</view>
          <view class="explain-text">{{ currentQ.explanation }}</view>
        </view>
      </view>

      <!-- 笔记区域 -->
      <view class="note-section" v-if="showAnswer">
        <view class="note-header" @tap="showNoteInput = !showNoteInput">
          <text>笔记 {{ noteText ? '查看笔记' : '添加笔记' }}</text>
        </view>
        <view class="note-body" v-if="showNoteInput || noteText">
          <textarea
            class="note-textarea"
            v-model="noteText"
            placeholder="写下你的笔记..."
            :maxlength="500"
          ></textarea>
          <view class="note-actions">
            <text class="note-count">{{ noteText.length }}/500</text>
            <view class="note-save-btn" @tap="saveNote">保存</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <view class="nav-btn" :disabled="currentIdx <= 0" @tap="prevQ">上一题</view>
      <view class="nav-btn primary" @tap="nextQ">
        {{ currentIdx >= questions.length - 1 ? '完成' : '下一题' }}
      </view>
    </view>

    <!-- 题号面板 -->
    <view class="index-mask" v-if="showIndex" @tap="showIndex = false">
      <view class="index-panel" @tap.stop>
        <view class="index-title">答题卡</view>
        <view class="index-grid">
          <view
            v-for="(q, qi) in questions"
            :key="qi"
            class="index-item"
            :class="indexClasses[qi]"
            @tap="jumpTo(qi)"
          >{{ qi + 1 }}</view>
        </view>
        <view class="index-legend">
          <text class="legend-item"><text class="dot correct-dot"></text> 正确</text>
          <text class="legend-item"><text class="dot wrong-dot"></text> 错误</text>
          <text class="legend-item"><text class="dot current-dot"></text> 当前</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { initExamData, getChapterQuestions, getDailyQuestions, getAllQuestions } from '@/utils/data.js'
import { recordAnswer, getProgress, toggleFavorite, isFavorite, getNote, saveNote as saveNoteStorage, getFavorites, getNotes } from '@/utils/storage.js'

export default {
  data() {
    return {
      typeId: '',
      questions: [],
      currentIdx: 0,
      selected: '',
      showAnswer: false,
      isCorrect: false,
      showIndex: false,
      isFav: false,
      noteText: '',
      showNoteInput: false,
      progress: {}
    }
  },
  computed: {
    currentQ() {
      return this.questions[this.currentIdx] || null
    },
    progressPercent() {
      return this.questions.length > 0 ? Math.round((this.currentIdx + 1) / this.questions.length * 100) : 0
    },
    indexClasses() {
      var self = this
      return this.questions.map(function(q, idx) {
        var p = self.progress[q.question_id]
        if (idx === self.currentIdx) return 'current'
        if (p) return p.correct ? 'correct' : 'wrong'
        return ''
      })
    }
  },
  async onLoad(options) {
    this.typeId = options.typeId
    await initExamData(this.typeId)
    const mode = options.mode || 'chapter'

    if (mode === 'daily') {
      this.questions = getDailyQuestions(this.typeId)
    } else if (mode === 'wrong') {
      const ids = uni.getStorageSync('_wrong_practice_ids') || []
      const allQ = getAllQuestions(this.typeId)
      const qMap = {}
      allQ.forEach(q => { qMap[q.question_id] = q })
      this.questions = ids.map(id => qMap[id]).filter(Boolean)
    } else if (mode === 'fav') {
      const allQ = getAllQuestions(this.typeId)
      const favMap = getFavorites(this.typeId)
      this.questions = allQ.filter(q => favMap[q.question_id])
      if (options.index) this.currentIdx = parseInt(options.index)
    } else if (mode === 'note') {
      const allQ = getAllQuestions(this.typeId)
      const notesMap = getNotes(this.typeId)
      this.questions = allQ.filter(q => notesMap[q.question_id])
      if (options.index) this.currentIdx = parseInt(options.index)
    } else {
      const subject = decodeURIComponent(options.subject || '')
      const chapter = decodeURIComponent(options.chapter || '')
      this.questions = getChapterQuestions(this.typeId, subject, chapter)
    }

    this.progress = getProgress(this.typeId)
    this.initState()
  },
  methods: {
    initState() {
      this.selected = ''
      this.showAnswer = false
      this.isCorrect = false
      this.showNoteInput = false

      if (!this.currentQ) return
      const qid = this.currentQ.question_id
      const p = this.progress[qid]
      if (p) {
        this.selected = p.answer
        this.showAnswer = true
        this.isCorrect = p.correct
      }
      this.isFav = isFavorite(this.typeId, qid)
      const note = getNote(this.typeId, qid)
      this.noteText = note ? note.content : ''
    },
    selectOption(label) {
      if (this.showAnswer) return
      this.selected = label
    },
    submitAnswer() {
      if (!this.selected) return
      const q = this.currentQ
      this.isCorrect = this.selected === q.answer
      this.showAnswer = true
      recordAnswer(this.typeId, q.question_id, this.isCorrect, this.selected)
      this.progress = getProgress(this.typeId)
    },
    optionClass(label) {
      if (!this.showAnswer) {
        return this.selected === label ? 'selected' : ''
      }
      if (label === this.currentQ.answer) return 'correct'
      if (label === this.selected && !this.isCorrect) return 'wrong'
      return ''
    },
    indexItemClass(idx) {
      const q = this.questions[idx]
      const p = this.progress[q.question_id]
      if (idx === this.currentIdx) return 'current'
      if (p) return p.correct ? 'correct' : 'wrong'
      return ''
    },
    prevQ() {
      if (this.currentIdx > 0) {
        this.currentIdx--
        this.initState()
      }
    },
    nextQ() {
      if (this.currentIdx < this.questions.length - 1) {
        this.currentIdx++
        this.initState()
      } else {
        uni.navigateBack()
      }
    },
    jumpTo(idx) {
      this.currentIdx = idx
      this.showIndex = false
      this.initState()
    },
    toggleFav() {
      this.isFav = toggleFavorite(this.typeId, this.currentQ.question_id)
      uni.showToast({ title: this.isFav ? '已收藏' : '已取消收藏', icon: 'none' })
    },
    saveNote() {
      saveNoteStorage(this.typeId, this.currentQ.question_id, this.noteText)
      uni.showToast({ title: '笔记已保存', icon: 'success' })
    }
  }
}
</script>

<style scoped>
.container { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }

.top-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 24rpx; background: #fff;
}
.progress-text { font-size: 28rpx; color: #333; font-weight: bold; }
.top-actions { display: flex; }
.top-actions .action-btn { margin-left: 24rpx; }
.action-btn { font-size: 40rpx; color: #999; padding: 8rpx; }
.action-btn.active { color: #ff9800; }

.progress-bar { height: 6rpx; background: #e0e0e0; }
.progress-fill { height: 100%; background: #4caf50; transition: width 0.3s; }

.question-area { flex: 1; padding: 24rpx; }

.q-type { font-size: 24rpx; color: #999; margin-bottom: 12rpx; }
.q-stem { font-size: 32rpx; color: #333; line-height: 1.6; margin-bottom: 24rpx; font-weight: 500; }

.options { margin-bottom: 24rpx; }
.option-item {
  display: flex; align-items: flex-start;
  background: #fff; border: 2rpx solid #e0e0e0;
  border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx;
  transition: all 0.2s;
}
.option-item.selected { border-color: #2196f3; background: #e3f2fd; }
.option-item.correct { border-color: #4caf50; background: #e8f5e9; }
.option-item.wrong { border-color: #e53935; background: #ffebee; }

.opt-label {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  background: #f0f0f0; display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; font-weight: bold; color: #666; flex-shrink: 0;
}
.option-item.selected .opt-label { background: #2196f3; color: #fff; }
.option-item.correct .opt-label { background: #4caf50; color: #fff; }
.option-item.wrong .opt-label { background: #e53935; color: #fff; }

.opt-text { flex: 1; margin-left: 16rpx; font-size: 28rpx; color: #333; line-height: 1.5; }
.opt-icon { margin-left: 12rpx; font-size: 32rpx; }
.icon-correct { color: #4caf50; }
.icon-wrong { color: #e53935; }

.submit-area { text-align: center; padding: 20rpx 0; }
.submit-btn {
  background: #2e7d32; color: #fff; border: none;
  border-radius: 40rpx; padding: 20rpx 80rpx; font-size: 30rpx;
}
.submit-btn[disabled] { background: #ccc; }

.answer-section { margin-top: 16rpx; }
.answer-box {
  padding: 20rpx; border-radius: 12rpx; margin-bottom: 16rpx;
}
.answer-box.correct { background: #e8f5e9; border-left: 8rpx solid #4caf50; }
.answer-box.wrong { background: #ffebee; border-left: 8rpx solid #e53935; }
.answer-label { font-weight: bold; font-size: 28rpx; }
.answer-box.correct .answer-label { color: #2e7d32; }
.answer-box.wrong .answer-label { color: #c62828; }
.answer-value { font-size: 28rpx; margin-left: 12rpx; }

.explain-box { background: #fff; padding: 20rpx; border-radius: 12rpx; }
.explain-label { font-size: 26rpx; color: #1565c0; font-weight: bold; margin-bottom: 8rpx; }
.explain-text { font-size: 26rpx; color: #555; line-height: 1.7; }

.note-section { margin-top: 20rpx; background: #fff; border-radius: 12rpx; overflow: hidden; }
.note-header { padding: 20rpx; font-size: 26rpx; color: #666; border-bottom: 1rpx solid #f0f0f0; }
.note-body { padding: 20rpx; }
.note-textarea {
  width: 100%; height: 160rpx; font-size: 26rpx; color: #333;
  border: 1rpx solid #e0e0e0; border-radius: 8rpx; padding: 16rpx; box-sizing: border-box;
}
.note-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.note-count { font-size: 22rpx; color: #999; }
.note-save-btn {
  background: #2e7d32; color: #fff; font-size: 24rpx;
  padding: 10rpx 32rpx; border-radius: 24rpx;
}

.bottom-nav {
  display: flex; padding: 16rpx 24rpx; background: #fff;
  border-top: 1rpx solid #e0e0e0;
}
.bottom-nav .nav-btn { margin-left: 20rpx; }
.bottom-nav .nav-btn:first-child { margin-left: 0; }
.nav-btn {
  flex: 1; text-align: center; padding: 20rpx; border-radius: 40rpx;
  font-size: 28rpx; background: #f0f0f0; color: #666;
}
.nav-btn.primary { background: #2e7d32; color: #fff; }

.index-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 999;
  display: flex; align-items: flex-end; justify-content: center;
}
.index-panel {
  width: 100%; max-height: 70vh; background: #fff;
  border-radius: 24rpx 24rpx 0 0; padding: 32rpx;
}
.index-title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 24rpx; }
.index-grid { display: flex; flex-wrap: wrap; }
.index-grid .index-item { margin: 0 16rpx 16rpx 0; }
.index-item {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; background: #f0f0f0; color: #666;
}
.index-item.current { background: #2196f3; color: #fff; }
.index-item.correct { background: #4caf50; color: #fff; }
.index-item.wrong { background: #e53935; color: #fff; }

.index-legend { display: flex; justify-content: center; margin-top: 24rpx; }
.legend-item { font-size: 24rpx; color: #666; display: flex; align-items: center; margin-right: 32rpx; }
.legend-item:last-child { margin-right: 0; }
.legend-item .dot { margin-right: 8rpx; }
.dot { display: inline-block; width: 20rpx; height: 20rpx; border-radius: 50%; }
.correct-dot { background: #4caf50; }
.wrong-dot { background: #e53935; }
.current-dot { background: #2196f3; }
</style>
