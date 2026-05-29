<template>
  <view class="container">
    <!-- 未开始：显示开始界面 -->
    <view class="start-screen" v-if="!started">
      <view class="start-icon">🎯</view>
      <view class="start-title">模拟考试</view>
      <view class="start-info">
        <view class="info-row">
          <text class="info-label">考试类型</text>
          <text class="info-value">{{ typeName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">题目数量</text>
          <text class="info-value">{{ examQuestions.length }} 题</text>
        </view>
        <view class="info-row">
          <text class="info-label">考试时间</text>
          <text class="info-value">{{ totalMinutes }} 分钟</text>
        </view>
      </view>
      <view class="start-btn" @tap="startExam">开始考试</view>
      <view class="start-tip">考试期间不可查看答案，交卷后显示成绩</view>
    </view>

    <!-- 考试中 -->
    <template v-if="started && !finished">
      <!-- 顶部栏 -->
      <view class="top-bar">
        <view class="timer">
          <text class="timer-icon">⏱</text>
          <text class="timer-text" :class="{ urgent: remainSeconds < 300 }">{{ formatTime(remainSeconds) }}</text>
        </view>
        <view class="progress-text">{{ currentIdx + 1 }}/{{ questions.length }}</view>
        <view class="top-action" @tap="showIndex = true">☰</view>
      </view>

      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>

      <!-- 题目 -->
      <scroll-view scroll-y class="question-area" v-if="currentQ">
        <view class="q-type">【{{ currentQ.type || '选择题' }}】</view>
        <view class="q-stem">{{ currentIdx + 1 }}. {{ currentQ.stem }}</view>

        <view class="options">
          <view
            v-for="(opt, oi) in currentQ.options"
            :key="oi"
            class="option-item"
            :class="{ selected: answers[currentIdx] === opt.label }"
            @tap="selectOption(opt.label)"
          >
            <view class="opt-label">{{ opt.label }}</view>
            <view class="opt-text">{{ opt.text }}</view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部导航 -->
      <view class="bottom-nav">
        <view class="nav-btn" :disabled="currentIdx <= 0" @tap="prevQ">上一题</view>
        <view class="nav-btn" @tap="showIndex = true">答题卡</view>
        <view class="nav-btn primary" v-if="currentIdx < questions.length - 1" @tap="nextQ">下一题</view>
        <view class="nav-btn danger" v-else @tap="confirmSubmit">交卷</view>
      </view>

      <!-- 答题卡 -->
      <view class="index-mask" v-if="showIndex" @tap="showIndex = false">
        <view class="index-panel" @tap.stop>
          <view class="index-header">
            <view class="index-title">答题卡</view>
            <view class="index-stats">
              已答 {{ answeredCount }}/{{ questions.length }}
            </view>
          </view>
          <view class="index-grid">
            <view
              v-for="(q, qi) in questions"
              :key="qi"
              class="index-item"
              :class="{ current: qi === currentIdx, answered: answers[qi] }"
              @tap="jumpTo(qi)"
            >{{ qi + 1 }}</view>
          </view>
          <view class="index-legend">
            <text class="legend-item"><text class="dot answered-dot"></text> 已答</text>
            <text class="legend-item"><text class="dot current-dot"></text> 当前</text>
            <text class="legend-item"><text class="dot empty-dot"></text> 未答</text>
          </view>
          <view class="index-submit" @tap="confirmSubmit">交卷</view>
        </view>
      </view>
    </template>

    <!-- 考试结果 -->
    <template v-if="finished">
      <scroll-view scroll-y class="result-area">
        <view class="result-header">
          <view class="result-icon" :class="resultLevel">🏆</view>
          <view class="result-score">{{ score }}</view>
          <view class="result-label">分</view>
          <view class="result-level">{{ resultText }}</view>
        </view>

        <view class="result-card">
          <view class="result-row">
            <text class="rl">总题数</text><text class="rv">{{ questions.length }}</text>
          </view>
          <view class="result-row">
            <text class="rl">答对</text><text class="rv correct">{{ correctCount }}</text>
          </view>
          <view class="result-row">
            <text class="rl">答错</text><text class="rv wrong">{{ wrongCount }}</text>
          </view>
          <view class="result-row">
            <text class="rl">未答</text><text class="rv">{{ unansweredCount }}</text>
          </view>
          <view class="result-row">
            <text class="rl">正确率</text><text class="rv">{{ accuracy }}%</text>
          </view>
          <view class="result-row">
            <text class="rl">用时</text><text class="rv">{{ usedTime }}</text>
          </view>
        </view>

        <!-- 错题列表 -->
        <view class="wrong-section" v-if="wrongList.length > 0">
          <view class="wrong-title">错题回顾 ({{ wrongList.length }}题)</view>
          <view class="wrong-item" v-for="(item, wi) in wrongList" :key="wi">
            <view class="wrong-stem">{{ wi + 1 }}. {{ item.stem }}</view>
            <view class="wrong-opts">
              <text class="wo">你的答案: <text class="wo-wrong">{{ item.userAnswer || '未答' }}</text></text>
              <text class="wo">正确答案: <text class="wo-correct">{{ item.answer }}</text></text>
            </view>
            <view class="wrong-explain" v-if="item.explanation">
              <text class="we-label">【解析】</text>{{ item.explanation }}
            </view>
          </view>
        </view>

        <view class="result-actions">
          <view class="result-btn" @tap="goBack">返回首页</view>
          <view class="result-btn primary" @tap="retryExam">再来一次</view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script>
import { initExamData, getExamQuestions, getExamTypes } from '@/utils/data.js'

export default {
  data() {
    return {
      typeId: '',
      typeName: '',
      examQuestions: [],
      totalMinutes: 100,
      started: false,
      finished: false,
      questions: [],
      answers: [],
      currentIdx: 0,
      showIndex: false,
      remainSeconds: 0,
      timer: null,
      startTime: 0,
      endTime: 0
    }
  },
  computed: {
    currentQ() {
      return this.questions[this.currentIdx] || null
    },
    progressPercent() {
      return this.questions.length > 0 ? Math.round((this.currentIdx + 1) / this.questions.length * 100) : 0
    },
    answeredCount() {
      return this.answers.filter(function(a) { return a }).length
    },
    correctCount() {
      var self = this
      var count = 0
      this.questions.forEach(function(q, i) {
        if (self.answers[i] && self.answers[i] === q.answer) count++
      })
      return count
    },
    wrongCount() {
      var self = this
      var count = 0
      this.questions.forEach(function(q, i) {
        if (self.answers[i] && self.answers[i] !== q.answer) count++
      })
      return count
    },
    unansweredCount() {
      return this.questions.length - this.answeredCount
    },
    score() {
      if (this.questions.length === 0) return 0
      return Math.round(this.correctCount / this.questions.length * 100)
    },
    accuracy() {
      if (this.answeredCount === 0) return 0
      return Math.round(this.correctCount / this.answeredCount * 100)
    },
    resultLevel() {
      if (this.score >= 90) return 'excellent'
      if (this.score >= 60) return 'good'
      return 'fail'
    },
    resultText() {
      if (this.score >= 90) return '优秀'
      if (this.score >= 60) return '及格'
      return '不及格'
    },
    usedTime() {
      if (!this.startTime || !this.endTime) return '0分钟'
      var secs = Math.round((this.endTime - this.startTime) / 1000)
      var m = Math.floor(secs / 60)
      var s = secs % 60
      return m + '分' + s + '秒'
    },
    wrongList() {
      var self = this
      var list = []
      this.questions.forEach(function(q, i) {
        if (self.answers[i] && self.answers[i] !== q.answer) {
          list.push({
            stem: q.stem,
            answer: q.answer,
            userAnswer: self.answers[i],
            explanation: q.explanation
          })
        }
      })
      return list
    }
  },
  async onLoad(options) {
    this.typeId = options.typeId
    var types = getExamTypes()
    var t = types.find(function(e) { return e.id === this.typeId }.bind(this))
    this.typeName = t ? t.name : ''

    await initExamData(this.typeId)
    var result = getExamQuestions(this.typeId)
    this.examQuestions = result.questions
    this.totalMinutes = result.totalMinutes
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    startExam() {
      this.questions = this.examQuestions
      this.answers = new Array(this.questions.length).fill('')
      this.started = true
      this.currentIdx = 0
      this.remainSeconds = this.totalMinutes * 60
      this.startTime = Date.now()
      this.startTimer()
    },
    startTimer() {
      var self = this
      this.timer = setInterval(function() {
        self.remainSeconds--
        if (self.remainSeconds <= 0) {
          clearInterval(self.timer)
          self.submitExam()
          uni.showToast({ title: '时间到，已自动交卷', icon: 'none', duration: 2000 })
        }
      }, 1000)
    },
    formatTime(seconds) {
      var h = Math.floor(seconds / 3600)
      var m = Math.floor((seconds % 3600) / 60)
      var s = seconds % 60
      var pad = function(n) { return n < 10 ? '0' + n : '' + n }
      if (h > 0) return pad(h) + ':' + pad(m) + ':' + pad(s)
      return pad(m) + ':' + pad(s)
    },
    selectOption(label) {
      this.$set(this.answers, this.currentIdx, label)
    },
    prevQ() {
      if (this.currentIdx > 0) this.currentIdx--
    },
    nextQ() {
      if (this.currentIdx < this.questions.length - 1) this.currentIdx++
    },
    jumpTo(idx) {
      this.currentIdx = idx
      this.showIndex = false
    },
    confirmSubmit() {
      var self = this
      var unanswered = this.questions.length - this.answeredCount
      var msg = '确定交卷吗？'
      if (unanswered > 0) msg = '还有 ' + unanswered + ' 题未作答，确定交卷吗？'
      uni.showModal({
        title: '交卷确认',
        content: msg,
        success: function(res) {
          if (res.confirm) self.submitExam()
        }
      })
    },
    submitExam() {
      if (this.timer) clearInterval(this.timer)
      this.endTime = Date.now()
      this.finished = true
    },
    goBack() {
      uni.navigateBack()
    },
    retryExam() {
      this.started = false
      this.finished = false
      this.answers = []
      this.currentIdx = 0
      // 重新生成题目
      var result = getExamQuestions(this.typeId)
      this.examQuestions = result.questions
    }
  }
}
</script>

<style scoped>
.container { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }

/* 开始界面 */
.start-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60rpx;
}
.start-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.start-title { font-size: 44rpx; font-weight: bold; color: #333; margin-bottom: 40rpx; }
.start-info {
  width: 100%; background: #fff; border-radius: 16rpx;
  padding: 32rpx; margin-bottom: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.info-row {
  display: flex; justify-content: space-between;
  padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0;
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 28rpx; color: #666; }
.info-value { font-size: 28rpx; color: #333; font-weight: bold; }
.start-btn {
  width: 100%; text-align: center; background: #2e7d32;
  color: #fff; padding: 28rpx; border-radius: 48rpx;
  font-size: 34rpx; font-weight: bold;
}
.start-tip { font-size: 24rpx; color: #999; margin-top: 24rpx; }

/* 考试中 */
.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16rpx 24rpx; background: #fff;
}
.timer { display: flex; align-items: center; }
.timer .timer-icon { margin-right: 8rpx; }
.timer-icon { font-size: 32rpx; }
.timer-text { font-size: 30rpx; font-weight: bold; color: #333; }
.timer-text.urgent { color: #e53935; }
.progress-text { font-size: 28rpx; color: #666; }
.top-action { font-size: 40rpx; color: #666; padding: 8rpx; }

.progress-bar { height: 6rpx; background: #e0e0e0; }
.progress-fill { height: 100%; background: #2e7d32; transition: width 0.3s; }

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
.opt-label {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  background: #f0f0f0; display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; font-weight: bold; color: #666; flex-shrink: 0;
}
.option-item.selected .opt-label { background: #2196f3; color: #fff; }
.opt-text { flex: 1; margin-left: 16rpx; font-size: 28rpx; color: #333; line-height: 1.5; }

.bottom-nav {
  display: flex; padding: 16rpx 24rpx; background: #fff;
  border-top: 1rpx solid #e0e0e0;
}
.bottom-nav .nav-btn { margin-left: 16rpx; }
.bottom-nav .nav-btn:first-child { margin-left: 0; }
.nav-btn {
  flex: 1; text-align: center; padding: 20rpx; border-radius: 40rpx;
  font-size: 28rpx; background: #f0f0f0; color: #666;
}
.nav-btn[disabled] { opacity: 0.4; }
.nav-btn.primary { background: #2e7d32; color: #fff; }
.nav-btn.danger { background: #e53935; color: #fff; }

/* 答题卡 */
.index-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 999;
  display: flex; align-items: flex-end; justify-content: center;
}
.index-panel {
  width: 100%; max-height: 75vh; background: #fff;
  border-radius: 24rpx 24rpx 0 0; padding: 32rpx;
}
.index-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx;
}
.index-title { font-size: 32rpx; font-weight: bold; }
.index-stats { font-size: 26rpx; color: #666; }
.index-grid { display: flex; flex-wrap: wrap; }
.index-grid .index-item { margin: 0 16rpx 16rpx 0; }
.index-item {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; background: #f0f0f0; color: #666;
}
.index-item.current { background: #2196f3; color: #fff; }
.index-item.answered { background: #4caf50; color: #fff; }
.index-legend { display: flex; justify-content: center; margin-top: 24rpx; }
.legend-item { font-size: 24rpx; color: #666; display: flex; align-items: center; margin-right: 32rpx; }
.legend-item:last-child { margin-right: 0; }
.legend-item .dot { margin-right: 8rpx; }
.dot { display: inline-block; width: 20rpx; height: 20rpx; border-radius: 50%; }
.answered-dot { background: #4caf50; }
.current-dot { background: #2196f3; }
.empty-dot { background: #f0f0f0; }
.index-submit {
  margin-top: 32rpx; text-align: center; background: #e53935;
  color: #fff; padding: 24rpx; border-radius: 40rpx;
  font-size: 30rpx; font-weight: bold;
}

/* 结果 */
.result-area { flex: 1; padding: 24rpx; }
.result-header {
  text-align: center; padding: 48rpx 0 32rpx;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 16rpx; margin-bottom: 24rpx;
  color: #fff;
}
.result-icon { font-size: 80rpx; margin-bottom: 12rpx; }
.result-score { font-size: 80rpx; font-weight: bold; }
.result-label { font-size: 28rpx; opacity: 0.8; }
.result-level { font-size: 32rpx; margin-top: 12rpx; font-weight: bold; }
.result-header.excellent { background: linear-gradient(135deg, #ff9800, #ffb74d); }
.result-header.good { background: linear-gradient(135deg, #2e7d32, #4caf50); }
.result-header.fail { background: linear-gradient(135deg, #c62828, #e53935); }

.result-card {
  background: #fff; border-radius: 16rpx; padding: 24rpx;
  margin-bottom: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.result-row {
  display: flex; justify-content: space-between;
  padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0;
}
.result-row:last-child { border-bottom: none; }
.rl { font-size: 28rpx; color: #666; }
.rv { font-size: 28rpx; font-weight: bold; color: #333; }
.rv.correct { color: #4caf50; }
.rv.wrong { color: #e53935; }

.wrong-section { margin-bottom: 32rpx; }
.wrong-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; }
.wrong-item {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  margin-bottom: 16rpx; border-left: 6rpx solid #e53935;
}
.wrong-stem { font-size: 28rpx; color: #333; line-height: 1.6; margin-bottom: 12rpx; }
.wrong-opts { display: flex; margin-bottom: 12rpx; }
.wrong-opts .wo { margin-right: 32rpx; }
.wrong-opts .wo:last-child { margin-right: 0; }
.wo { font-size: 26rpx; color: #666; }
.wo-wrong { color: #e53935; font-weight: bold; }
.wo-correct { color: #4caf50; font-weight: bold; }
.wrong-explain { font-size: 24rpx; color: #555; line-height: 1.6; background: #f9f9f9; padding: 16rpx; border-radius: 8rpx; }
.we-label { color: #1565c0; font-weight: bold; }

.result-actions {
  display: flex; padding: 24rpx 0 48rpx;
}
.result-actions .result-btn { margin-right: 24rpx; }
.result-actions .result-btn:last-child { margin-right: 0; }
.result-btn {
  flex: 1; text-align: center; padding: 24rpx; border-radius: 40rpx;
  font-size: 30rpx; background: #f0f0f0; color: #666;
}
.result-btn.primary { background: #2e7d32; color: #fff; }
</style>
