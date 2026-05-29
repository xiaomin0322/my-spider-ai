<template>
  <view class="container">
    <view class="header">
      <view class="header-title">我的收藏</view>
      <view class="header-sub">{{ favList.length }} 道题</view>
    </view>

    <view class="list" v-if="favList.length > 0">
      <view class="item" v-for="(item, idx) in favList" :key="idx" @tap="goPractice(idx)">
        <view class="item-star">★</view>
        <view class="item-content">
          <view class="item-type">【{{ item.question.type || '选择题' }}】</view>
          <view class="item-stem">{{ item.question.stem }}</view>
          <view class="item-meta">
            <text>{{ item.question.subject }}</text>
            <text class="meta-time">{{ item.favData.time }}</text>
          </view>
        </view>
        <view class="item-del" @tap.stop="removeItem(idx)">✖</view>
      </view>
    </view>

    <view class="empty" v-else>
      <view class="empty-icon">⭐</view>
      <view class="empty-text">暂无收藏题目</view>
    </view>
  </view>
</template>

<script>
import { initExamData, getAllQuestions } from '@/utils/data.js'
import { getFavorites, removeFavorite } from '@/utils/storage.js'

function getTypeId() { return uni.getStorageSync('last_type_id') || 'ZHIYEYISHI' }

export default {
  data() {
    return {
      favList: []
    }
  },
  onLoad() {
    this.loadFavorites()
  },
  onShow() {
    this.loadFavorites()
  },
  methods: {
    async loadFavorites() {
      await initExamData(getTypeId())
      const favMap = getFavorites(getTypeId())
      const allQ = getAllQuestions(getTypeId())
      const qMap = {}
      allQ.forEach(q => { qMap[q.question_id] = q })

      this.favList = Object.keys(favMap)
        .map(qid => ({
          questionId: qid,
          question: qMap[qid] || { question_id: qid, stem: '题目已删除', type: '', subject: '' },
          favData: favMap[qid]
        }))
        .sort((a, b) => (b.favData.time || '').localeCompare(a.favData.time || ''))
    },
    goPractice(idx) {
      uni.navigateTo({ url: `/pages/practice/index?typeId=${getTypeId()}&mode=fav&index=${idx}` })
    },
    removeItem(idx) {
      const item = this.favList[idx]
      removeFavorite(getTypeId(), item.questionId)
      this.favList.splice(idx, 1)
      uni.showToast({ title: '已取消收藏', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }

.header {
  background: linear-gradient(135deg, #e65100, #ff9800);
  padding: 60rpx 40rpx 40rpx; color: #fff;
}
.header-title { font-size: 44rpx; font-weight: bold; }
.header-sub { font-size: 26rpx; opacity: 0.8; margin-top: 8rpx; }

.list { padding: 24rpx; }
.item {
  display: flex; align-items: flex-start;
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx;
}
.item-star { font-size: 36rpx; color: #ff9800; flex-shrink: 0; margin-right: 12rpx; }
.item-content { flex: 1; }
.item-type { font-size: 22rpx; color: #999; }
.item-stem {
  font-size: 28rpx; color: #333; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  margin: 8rpx 0;
}
.item-meta { display: flex; justify-content: space-between; font-size: 22rpx; color: #999; }
.meta-time { color: #bbb; }
.item-del { color: #ccc; font-size: 28rpx; padding: 8rpx; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }
</style>
