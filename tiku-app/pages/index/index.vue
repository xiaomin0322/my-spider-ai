<template>
  <view class="container">
    <!-- 顶部统计 -->
    <view class="header">
      <view class="header-title">中医题库</view>
      <view class="header-sub" @tap="showTypePicker">
        {{ currentTypeName }} ▾
      </view>
    </view>

    <!-- 考试类型选择弹窗 -->
    <view class="type-mask" v-if="typePickerVisible" @tap="typePickerVisible = false">
      <view class="type-picker" @tap.stop>
        <view class="type-picker-title">选择考试类型</view>
        <view class="type-picker-list">
          <view
            class="type-picker-item"
            :class="{ active: t.id === currentTypeId }"
            v-for="t in examTypes"
            :key="t.id"
            @tap="switchType(t.id)"
          >
            <text>{{ t.name }}</text>
            <text class="type-category">{{ t.category }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <view class="stat-num">{{ stats.answered }}</view>
        <view class="stat-label">已答题</view>
      </view>
      <view class="stat-item">
        <view class="stat-num correct">{{ stats.correct }}</view>
        <view class="stat-label">答对</view>
      </view>
      <view class="stat-item">
        <view class="stat-num wrong">{{ stats.wrongCount }}</view>
        <view class="stat-label">错题</view>
      </view>
      <view class="stat-item">
        <view class="stat-num fav">{{ stats.favoriteCount }}</view>
        <view class="stat-label">收藏</view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="func-grid">
      <view class="func-item" @tap="goExam">
        <view class="func-icon exam-icon">🎯</view>
        <view class="func-info">
          <view class="func-name">模拟考试</view>
          <view class="func-desc">按考试标准出题</view>
        </view>
        <view class="func-arrow">›</view>
      </view>
      <view class="func-item" @tap="goDaily">
        <view class="func-icon daily-icon">📖</view>
        <view class="func-info">
          <view class="func-name">每日一练</view>
          <view class="func-desc">每天10题</view>
        </view>
        <view class="func-arrow">›</view>
      </view>
      <view class="func-item" @tap="goWrong">
        <view class="func-icon wrong-icon">❌</view>
        <view class="func-info">
          <view class="func-name">错题本</view>
          <view class="func-desc">{{ stats.wrongCount }}题</view>
        </view>
        <view class="func-arrow">›</view>
      </view>
      <view class="func-item" @tap="goFavorites">
        <view class="func-icon fav-icon">⭐</view>
        <view class="func-info">
          <view class="func-name">收藏</view>
          <view class="func-desc">{{ stats.favoriteCount }}题</view>
        </view>
        <view class="func-arrow">›</view>
      </view>
      <view class="func-item" @tap="goNotes">
        <view class="func-icon note-icon">📝</view>
        <view class="func-info">
          <view class="func-name">笔记</view>
          <view class="func-desc">{{ stats.noteCount }}条</view>
        </view>
        <view class="func-arrow">›</view>
      </view>
    </view>

    <!-- 科目列表 -->
    <view class="section-title">章节练习</view>
    <view class="no-data" v-if="!loading && subjects.length === 0">
      <text>暂无题库数据，请先运行抓取脚本获取 {{ currentTypeName }} 的题库</text>
    </view>
    <view class="subject-list" v-else>
      <view
        class="subject-item"
        v-for="(subj, idx) in subjects"
        :key="idx"
        @tap="goChapter(subj)"
      >
        <view class="subject-idx">{{ idx + 1 }}</view>
        <view class="subject-info">
          <view class="subject-name">{{ subj.name }}</view>
          <view class="subject-meta">{{ subj.chapters.length }}个章节 · {{ subj.totalQuestions }}题</view>
        </view>
        <view class="subject-arrow">›</view>
      </view>
    </view>

    <!-- 底部重置 -->
    <view class="footer">
      <view class="reset-btn" @tap="handleReset">重置所有数据</view>
    </view>
    <view class="version">v{{ version }}</view>
  </view>
</template>

<script>
import { initExamData, getSubjectList, getExamTypes } from '@/utils/data.js'
import { getGlobalStats, resetAllData } from '@/utils/storage.js'

export default {
  data() {
    return {
      examTypes: [],
      currentTypeId: 'ZHIYEYISHI',
      subjects: [],
      stats: { answered: 0, correct: 0, wrongCount: 0, favoriteCount: 0, noteCount: 0 },
      loading: true,
      typePickerVisible: false,
      version: '1.0.0'
    }
  },
  computed: {
    currentTypeName() {
      const t = this.examTypes.find(e => e.id === this.currentTypeId)
      return t ? t.name : ''
    }
  },
  onShow() {
    this.loadData()
  },
  methods: {
    showTypePicker() {
      this.typePickerVisible = true
    },
    switchType(typeId) {
      this.currentTypeId = typeId
      this.typePickerVisible = false
      uni.setStorageSync('last_type_id', typeId)
      this.loadData()
    },
    async loadData() {
      this.loading = true
      this.examTypes = getExamTypes()

      const savedType = uni.getStorageSync('last_type_id')
      if (savedType && this.examTypes.find(t => t.id === savedType)) {
        this.currentTypeId = savedType
      }

      await initExamData(this.currentTypeId)
      this.subjects = getSubjectList(this.currentTypeId)
      this.stats = getGlobalStats(this.currentTypeId)
      this.loading = false
    },
    goChapter(subj) {
      uni.navigateTo({ url: `/pages/chapter/index?typeId=${this.currentTypeId}&subject=${encodeURIComponent(subj.name)}` })
    },
    goExam() {
      uni.navigateTo({ url: `/pages/exam/index?typeId=${this.currentTypeId}` })
    },
    goDaily() {
      uni.switchTab({ url: '/pages/daily/index' })
    },
    goWrong() {
      uni.switchTab({ url: '/pages/wrong/index' })
    },
    goFavorites() {
      uni.navigateTo({ url: `/pages/favorites/index?typeId=${this.currentTypeId}` })
    },
    goNotes() {
      uni.switchTab({ url: '/pages/note/index' })
    },
    handleReset() {
      uni.showModal({
        title: '确认重置',
        content: '将清除当前类型的答题记录、错题、收藏和笔记，确定吗？',
        success: (res) => {
          if (res.confirm) {
            resetAllData(this.currentTypeId)
            this.loadData()
            uni.showToast({ title: '已重置', icon: 'success' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container { padding: 0 0 30rpx 0; background: #f5f5f5; min-height: 100vh; }

.header {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  padding: 60rpx 40rpx 40rpx;
  color: #fff;
}
.header-title { font-size: 44rpx; font-weight: bold; }
.header-sub { font-size: 28rpx; opacity: 0.9; margin-top: 10rpx; }

/* 考试类型选择器 */
.type-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}
.type-picker {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 30rpx;
  max-height: 70vh;
}
.type-picker-title {
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20rpx;
  color: #333;
}
.type-picker-list {
  max-height: 55vh;
  overflow-y: auto;
}
.type-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
  color: #333;
}
.type-picker-item.active {
  color: #2e7d32;
  font-weight: bold;
}
.type-category { font-size: 24rpx; color: #999; }

.stats-card {
  display: flex;
  background: #fff;
  margin: -20rpx 24rpx 24rpx;
  border-radius: 16rpx;
  padding: 30rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 40rpx; font-weight: bold; color: #333; }
.stat-num.correct { color: #4caf50; }
.stat-num.wrong { color: #e53935; }
.stat-num.fav { color: #ff9800; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 6rpx; }

.func-grid {
  padding: 0 24rpx;
  margin-bottom: 24rpx;
}
.func-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.func-icon { font-size: 48rpx; margin-right: 20rpx; flex-shrink: 0; }
.exam-icon { color: #e53935; }
.func-info { flex: 1; }
.func-name { font-size: 30rpx; font-weight: bold; color: #333; }
.func-desc { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.func-arrow { font-size: 36rpx; color: #ccc; flex-shrink: 0; }

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  padding: 16rpx 32rpx;
}

.no-data {
  text-align: center;
  padding: 60rpx 40rpx;
  color: #999;
  font-size: 26rpx;
}

.subject-list { padding: 0 24rpx; }
.subject-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.subject-idx {
  width: 56rpx; height: 56rpx;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: bold;
  flex-shrink: 0;
}
.subject-info { flex: 1; margin-left: 20rpx; }
.subject-name { font-size: 30rpx; font-weight: bold; color: #333; }
.subject-meta { font-size: 24rpx; color: #999; margin-top: 6rpx; }
.subject-arrow { font-size: 36rpx; color: #ccc; }

.footer { text-align: center; padding: 40rpx 0; }
.reset-btn {
  display: inline-block;
  font-size: 24rpx;
  color: #999;
  padding: 12rpx 32rpx;
  border: 1rpx solid #ddd;
  border-radius: 32rpx;
}
.version {
  text-align: center;
  font-size: 22rpx;
  color: #ccc;
  padding-bottom: 30rpx;
}
</style>
