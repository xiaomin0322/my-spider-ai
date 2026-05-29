<template>
  <view class="container">
    <view class="header">
      <view class="header-title">我的笔记</view>
      <view class="header-sub">{{ noteList.length }} 条笔记</view>
    </view>

    <view class="list" v-if="noteList.length > 0">
      <view class="item" v-for="(item, idx) in noteList" :key="idx" @tap="goQuestion(idx)">
        <view class="item-icon">📝</view>
        <view class="item-content">
          <view class="item-stem">{{ item.question.stem }}</view>
          <view class="item-note">{{ item.noteData.content }}</view>
          <view class="item-meta">
            <text>{{ item.question.subject }} · {{ item.question.chapter }}</text>
            <text class="meta-time">{{ item.noteData.time }}</text>
          </view>
        </view>
        <view class="item-del" @tap.stop="removeItem(idx)">✖</view>
      </view>
    </view>

    <view class="empty" v-else>
      <view class="empty-icon">📝</view>
      <view class="empty-text">暂无笔记</view>
      <view class="empty-hint">答题时可添加笔记记录学习心得</view>
    </view>
  </view>
</template>

<script>
import { initExamData, getAllQuestions } from '@/utils/data.js'
import { getNotes, removeNote } from '@/utils/storage.js'

function getTypeId() { return uni.getStorageSync('last_type_id') || 'ZHIYEYISHI' }

export default {
  data() {
    return {
      noteList: []
    }
  },
  onShow() {
    this.loadNotes()
  },
  methods: {
    async loadNotes() {
      await initExamData(getTypeId())
      const notesMap = getNotes(getTypeId())
      const allQ = getAllQuestions(getTypeId())
      const qMap = {}
      allQ.forEach(q => { qMap[q.question_id] = q })

      this.noteList = Object.keys(notesMap)
        .map(qid => ({
          questionId: qid,
          question: qMap[qid] || { question_id: qid, stem: '题目已删除', subject: '', chapter: '' },
          noteData: notesMap[qid]
        }))
        .sort((a, b) => (b.noteData.time || '').localeCompare(a.noteData.time || ''))
    },
    goQuestion(idx) {
      uni.navigateTo({ url: `/pages/practice/index?typeId=${getTypeId()}&mode=note&index=${idx}` })
    },
    removeItem(idx) {
      uni.showModal({
        title: '删除笔记',
        content: '确定删除这条笔记吗？',
        success: (res) => {
          if (res.confirm) {
            const item = this.noteList[idx]
            removeNote(getTypeId(), item.questionId)
            this.noteList.splice(idx, 1)
            uni.showToast({ title: '已删除', icon: 'success' })
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
  background: linear-gradient(135deg, #4a148c, #7b1fa2);
  padding: 60rpx 40rpx 40rpx; color: #fff;
}
.header-title { font-size: 44rpx; font-weight: bold; }
.header-sub { font-size: 26rpx; opacity: 0.8; margin-top: 8rpx; }

.list { padding: 24rpx; }
.item {
  display: flex; align-items: flex-start;
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx;
}
.item-icon { font-size: 36rpx; flex-shrink: 0; margin-right: 12rpx; }
.item-content { flex: 1; }
.item-stem {
  font-size: 26rpx; color: #666; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
  margin-bottom: 8rpx;
}
.item-note {
  font-size: 28rpx; color: #333; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.item-meta {
  display: flex; justify-content: space-between;
  font-size: 22rpx; color: #999; margin-top: 12rpx;
}
.meta-time { color: #bbb; }
.item-del { color: #ccc; font-size: 28rpx; padding: 8rpx; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999; }
.empty-hint { font-size: 24rpx; color: #bbb; margin-top: 12rpx; }
</style>
