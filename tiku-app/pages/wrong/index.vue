<template>
  <view class="container">
    <view class="header">
      <view class="header-title">错题本</view>
      <view class="header-sub">{{ wrongList.length }} 道错题</view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar" v-if="wrongList.length > 0">
      <view class="action-btn" @tap="practiceWrong">🎯 错题重做</view>
      <view class="action-btn danger" @tap="clearAll">🗑 清空</view>
    </view>

    <!-- 错题列表 -->
    <view class="list" v-if="wrongList.length > 0">
      <view class="item" v-for="(item, idx) in wrongList" :key="idx" @tap="goPractice(idx)">
        <view class="item-idx">{{ idx + 1 }}</view>
        <view class="item-content">
          <view class="item-type">【{{ item.question.type || '选择题' }}】</view>
          <view class="item-stem">{{ item.question.stem }}</view>
          <view class="item-meta">
            <text class="meta-wrong">错{{ item.wrongData.times }}次</text>
            <text class="meta-answer">我的答案：{{ item.wrongData.lastAnswer }}</text>
            <text class="meta-correct">正确：{{ item.question.answer }}</text>
          </view>
        </view>
        <view class="item-del" @tap.stop="removeItem(idx)">✖</view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-else>
      <view class="empty-icon">🎉</view>
      <view class="empty-text">暂无错题，继续保持！</view>
    </view>
  </view>
</template>

<script>
import { initExamData, getAllQuestions } from '@/utils/data.js'
import { getWrongList, removeWrong, clearWrong } from '@/utils/storage.js'

function getTypeId() { return uni.getStorageSync('last_type_id') || 'ZHIYEYISHI' }

export default {
  data() {
    return {
      wrongList: []
    }
  },
  onShow() {
    this.loadWrong()
  },
  methods: {
    async loadWrong() {
      await initExamData(getTypeId())
      const wrongMap = getWrongList(getTypeId())
      const allQ = getAllQuestions(getTypeId())
      const qMap = {}
      allQ.forEach(q => { qMap[q.question_id] = q })

      this.wrongList = Object.keys(wrongMap)
        .map(qid => ({
          questionId: qid,
          question: qMap[qid] || { question_id: qid, stem: '题目已删除', type: '', answer: '', options: [] },
          wrongData: wrongMap[qid]
        }))
        .sort((a, b) => (b.wrongData.times || 0) - (a.wrongData.times || 0))
    },
    goPractice(idx) {
      const ids = this.wrongList.map(w => w.questionId)
      uni.setStorageSync('_wrong_practice_ids', ids)
      uni.navigateTo({ url: `/pages/practice/index?typeId=${getTypeId()}&mode=wrong` })
    },
    removeItem(idx) {
      const item = this.wrongList[idx]
      removeWrong(getTypeId(), item.questionId)
      this.wrongList.splice(idx, 1)
    },
    practiceWrong() {
      if (this.wrongList.length === 0) return
      const ids = this.wrongList.map(w => w.questionId)
      uni.setStorageSync('_wrong_practice_ids', ids)
      uni.navigateTo({ url: `/pages/practice/index?typeId=${getTypeId()}&mode=wrong` })
    },
    clearAll() {
      uni.showModal({
        title: '确认清空',
        content: '确定清空所有错题记录吗？',
        success: (res) => {
          if (res.confirm) {
            clearWrong(getTypeId())
            this.wrongList = []
            uni.showToast({ title: '已清空', icon: 'success' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }

.header {
  background: linear-gradient(135deg, #c62828, #ef5350);
  padding: 60rpx 40rpx 40rpx; color: #fff;
}
.header-title { font-size: 44rpx; font-weight: bold; }
.header-sub { font-size: 26rpx; opacity: 0.8; margin-top: 8rpx; }

.action-bar {
  display: flex; padding: 20rpx 24rpx;
  background: #fff; margin-bottom: 16rpx;
}
.action-bar .action-btn { margin-right: 20rpx; }
.action-bar .action-btn:last-child { margin-right: 0; }

.action-btn {
  flex: 1; text-align: center; padding: 16rpx; border-radius: 8rpx;
  font-size: 26rpx; background: #e8f5e9; color: #2e7d32;
}
.action-btn.danger { background: #ffebee; color: #c62828; }

.list { padding: 0 24rpx; }
.item {
  display: flex; align-items: flex-start;
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx;
}
.item-idx {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  background: #ffebee; color: #c62828;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; font-weight: bold; flex-shrink: 0;
}
.item-content { flex: 1; margin-left: 16rpx; }
.item-type { font-size: 22rpx; color: #999; }
.item-stem {
  font-size: 28rpx; color: #333; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  margin: 8rpx 0;
}
.item-meta { display: flex; font-size: 22rpx; flex-wrap: wrap; }
.item-meta text { margin-right: 16rpx; }
.meta-wrong { color: #e53935; font-weight: bold; }
.meta-answer { color: #ff9800; }
.meta-correct { color: #4caf50; }

.item-del { color: #ccc; font-size: 28rpx; padding: 8rpx; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }
</style>
