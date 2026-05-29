<template>
  <view class="container">
    <view class="header">
      <view class="header-title">每日一练</view>
      <view class="header-sub">每天随机10题，坚持练习</view>
    </view>

    <!-- 今日统计 -->
    <view class="today-card" v-if="todayStats">
      <view class="today-title">今日进度</view>
      <view class="today-stats">
        <view class="ts-item">
          <view class="ts-num">{{ todayStats.answered }}</view>
          <view class="ts-label">已答</view>
        </view>
        <view class="ts-item">
          <view class="ts-num correct">{{ todayStats.correct }}</view>
          <view class="ts-label">正确</view>
        </view>
        <view class="ts-item">
          <view class="ts-num wrong">{{ todayStats.wrong }}</view>
          <view class="ts-label">错误</view>
        </view>
      </view>
    </view>

    <!-- 开始练习按钮 -->
    <view class="action-area">
      <button class="start-btn" @tap="startPractice">
        {{ todayStats && todayStats.answered > 0 ? '继续练习' : '开始今日练习' }}
      </button>
      <view class="refresh-btn" @tap="refreshDaily">换一批题目</view>
    </view>

    <!-- 历史记录 -->
    <view class="section-title" v-if="history.length > 0">历史记录</view>
    <view class="history-list">
      <view class="history-item" v-for="(h, idx) in history" :key="idx">
        <view class="h-date">{{ h.date }}</view>
        <view class="h-stats">
          <text>{{ h.answered }}题</text>
          <text class="h-rate">正确率 {{ h.rate }}%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { initExamData, getDailyQuestions, getAllQuestions } from '@/utils/data.js'
import { getProgress } from '@/utils/storage.js'

function getTypeId() { return uni.getStorageSync('last_type_id') || 'ZHIYEYISHI' }

export default {
  data() {
    return {
      todayStats: null,
      history: []
    }
  },
  onShow() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      await initExamData(getTypeId())
      const today = new Date().toISOString().slice(0, 10)
      const dailyKey = 'daily_' + getTypeId() + '_' + today
      const todayQ = uni.getStorageSync(dailyKey)
      const progress = getProgress(getTypeId())

      if (todayQ && todayQ.length > 0) {
        let answered = 0, correct = 0
        todayQ.forEach(q => {
          const p = progress[q.question_id]
          if (p) { answered++; if (p.correct) correct++ }
        })
        this.todayStats = { answered, correct, wrong: answered - correct }
      } else {
        this.todayStats = null
      }

      this.loadHistory()
    },
    loadHistory() {
      const info = uni.getStorageInfoSync()
      const keys = info.keys.filter(k => k.startsWith('daily_' + getTypeId() + '_'))
      const progress = getProgress(getTypeId())
      const history = []

      keys.sort().reverse().slice(0, 7).forEach(key => {
        const date = key.split('_').pop()
        const qs = uni.getStorageSync(key)
        if (!qs || qs.length === 0) return
        let answered = 0, correct = 0
        qs.forEach(q => {
          const p = progress[q.question_id]
          if (p) { answered++; if (p.correct) correct++ }
        })
        history.push({
          date,
          answered,
          correct,
          rate: answered > 0 ? Math.round(correct / answered * 100) : 0
        })
      })
      this.history = history
    },
    startPractice() {
      uni.navigateTo({ url: `/pages/practice/index?typeId=${getTypeId()}&mode=daily` })
    },
    refreshDaily() {
      const today = new Date().toISOString().slice(0, 10)
      const dailyKey = 'daily_' + getTypeId() + '_' + today
      uni.removeStorageSync(dailyKey)
      getDailyQuestions(getTypeId())
      this.loadStats()
      uni.showToast({ title: '已刷新题目', icon: 'success' })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }

.header {
  background: linear-gradient(135deg, #1565c0, #42a5f5);
  padding: 60rpx 40rpx 40rpx; color: #fff;
}
.header-title { font-size: 44rpx; font-weight: bold; }
.header-sub { font-size: 26rpx; opacity: 0.8; margin-top: 8rpx; }

.today-card {
  background: #fff; margin: -20rpx 24rpx 24rpx;
  border-radius: 16rpx; padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}
.today-title { font-size: 28rpx; color: #666; margin-bottom: 20rpx; }
.today-stats { display: flex; }
.ts-item { flex: 1; text-align: center; }
.ts-num { font-size: 44rpx; font-weight: bold; color: #333; }
.ts-num.correct { color: #4caf50; }
.ts-num.wrong { color: #e53935; }
.ts-label { font-size: 22rpx; color: #999; margin-top: 6rpx; }

.action-area { padding: 32rpx 24rpx; text-align: center; }
.start-btn {
  background: #1565c0; color: #fff; border: none;
  border-radius: 48rpx; padding: 24rpx 0; font-size: 32rpx; width: 80%;
}
.refresh-btn {
  font-size: 26rpx; color: #999; margin-top: 20rpx; padding: 12rpx;
}

.section-title {
  font-size: 30rpx; font-weight: bold; color: #333;
  padding: 16rpx 32rpx 8rpx;
}
.history-list { padding: 0 24rpx; }
.history-item {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 12rpx;
}
.h-date { font-size: 28rpx; color: #333; }
.h-stats { font-size: 26rpx; color: #666; }
.h-rate { margin-left: 16rpx; color: #4caf50; }
</style>
