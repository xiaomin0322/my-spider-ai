<template>
  <view class="container">
    <view class="header">
      <view class="header-title">{{ subject }}</view>
      <view class="header-sub">共 {{ totalQuestions }} 题</view>
    </view>

    <view class="chapter-list">
      <view
        class="chapter-item"
        v-for="(chap, idx) in chapters"
        :key="idx"
        @tap="goPractice(chap, idx)"
      >
        <view class="chap-idx">{{ idx + 1 }}</view>
        <view class="chap-info">
          <view class="chap-name">{{ chap.name }}</view>
          <view class="chap-meta">
            <text>{{ chap.count }}题</text>
            <text v-if="chapStats[chap.name]" class="chap-progress">
              · 已答{{ chapStats[chap.name].answered }}题
              · 正确率{{ chapStats[chap.name].rate }}%
            </text>
          </view>
        </view>
        <view class="chap-arrow">›</view>
      </view>
    </view>
  </view>
</template>

<script>
import { initExamData, getChapterList } from '@/utils/data.js'
import { getChapterStats } from '@/utils/storage.js'

export default {
  data() {
    return {
      typeId: '',
      subject: '',
      chapters: [],
      chapStats: {},
      totalQuestions: 0
    }
  },
  async onLoad(options) {
    this.typeId = options.typeId
    this.subject = decodeURIComponent(options.subject)
    await initExamData(this.typeId)
    this.loadChapters()
  },
  onShow() {
    if (this.typeId) this.loadChapters()
  },
  methods: {
    loadChapters() {
      this.chapters = getChapterList(this.typeId, this.subject)
      this.totalQuestions = this.chapters.reduce((s, c) => s + c.count, 0)

      const stats = {}
      this.chapters.forEach(chap => {
        const ids = chap.questions.map(q => q.question_id)
        const s = getChapterStats(this.typeId, ids)
        stats[chap.name] = {
          answered: s.answered,
          rate: s.answered > 0 ? Math.round(s.correct / s.answered * 100) : 0
        }
      })
      this.chapStats = stats
    },
    goPractice(chap, idx) {
      uni.navigateTo({
        url: `/pages/practice/index?typeId=${this.typeId}&subject=${encodeURIComponent(this.subject)}&chapter=${encodeURIComponent(chap.name)}`
      })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }

.header {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  padding: 40rpx;
  color: #fff;
}
.header-title { font-size: 36rpx; font-weight: bold; }
.header-sub { font-size: 24rpx; opacity: 0.8; margin-top: 8rpx; }

.chapter-list { padding: 24rpx; }
.chapter-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.chap-idx {
  width: 52rpx; height: 52rpx;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; font-weight: bold;
  flex-shrink: 0;
}
.chap-info { flex: 1; margin-left: 20rpx; }
.chap-name { font-size: 30rpx; color: #333; font-weight: 500; }
.chap-meta { font-size: 24rpx; color: #999; margin-top: 6rpx; }
.chap-progress { color: #4caf50; }
.chap-arrow { font-size: 36rpx; color: #ccc; }
</style>
