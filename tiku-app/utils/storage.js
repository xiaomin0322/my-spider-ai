/**
 * 用户数据存储模块
 * 管理答题进度、错题、收藏、笔记
 *
 * 存储结构：
 *   progress_{typeId}  — { question_id: { correct: bool, answer: str, time: str } }
 *   wrong_{typeId}     — { question_id: { times: int, lastAnswer: str, lastTime: str } }
 *   favorites_{typeId} — { question_id: { time: str } }
 *   notes_{typeId}     — { question_id: { content: str, time: str } }
 */

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

// ============ 答题进度 ============

/**
 * 获取答题进度
 * @param {string} typeId
 * @returns {Object} { question_id: { correct, answer, time } }
 */
export function getProgress(typeId) {
  return uni.getStorageSync('progress_' + typeId) || {}
}

/**
 * 记录答题结果
 * @param {string} typeId
 * @param {string} questionId
 * @param {boolean} correct
 * @param {string} userAnswer
 */
export function recordAnswer(typeId, questionId, correct, userAnswer) {
  const progress = getProgress(typeId)
  progress[questionId] = {
    correct,
    answer: userAnswer,
    time: now()
  }
  uni.setStorageSync('progress_' + typeId, progress)

  // 如果答错，记录到错题本
  if (!correct) {
    recordWrong(typeId, questionId, userAnswer)
  } else {
    // 答对了，从错题本中移除
    removeWrong(typeId, questionId)
  }
}

/**
 * 获取指定章节的答题统计
 * @param {string} typeId
 * @param {Array} questionIds
 * @returns {Object} { total, answered, correct, wrong }
 */
export function getChapterStats(typeId, questionIds) {
  const progress = getProgress(typeId)
  let answered = 0, correct = 0

  questionIds.forEach(id => {
    const p = progress[id]
    if (p) {
      answered++
      if (p.correct) correct++
    }
  })

  return {
    total: questionIds.length,
    answered,
    correct,
    wrong: answered - correct
  }
}

// ============ 错题本 ============

/**
 * 获取错题列表
 * @param {string} typeId
 * @returns {Object} { question_id: { times, lastAnswer, lastTime } }
 */
export function getWrongList(typeId) {
  return uni.getStorageSync('wrong_' + typeId) || {}
}

/**
 * 记录错题
 * @param {string} typeId
 * @param {string} questionId
 * @param {string} userAnswer
 */
function recordWrong(typeId, questionId, userAnswer) {
  const wrong = getWrongList(typeId)
  const existing = wrong[questionId]
  wrong[questionId] = {
    times: existing ? existing.times + 1 : 1,
    lastAnswer: userAnswer,
    lastTime: now()
  }
  uni.setStorageSync('wrong_' + typeId, wrong)
}

/**
 * 从错题本移除
 * @param {string} typeId
 * @param {string} questionId
 */
export function removeWrong(typeId, questionId) {
  const wrong = getWrongList(typeId)
  if (wrong[questionId]) {
    delete wrong[questionId]
    uni.setStorageSync('wrong_' + typeId, wrong)
  }
}

/**
 * 清空错题本
 * @param {string} typeId
 */
export function clearWrong(typeId) {
  uni.setStorageSync('wrong_' + typeId, {})
}

// ============ 收藏 ============

/**
 * 获取收藏列表
 * @param {string} typeId
 * @returns {Object} { question_id: { time } }
 */
export function getFavorites(typeId) {
  return uni.getStorageSync('favorites_' + typeId) || {}
}

/**
 * 切换收藏状态
 * @param {string} typeId
 * @param {string} questionId
 * @returns {boolean} 当前是否已收藏
 */
export function toggleFavorite(typeId, questionId) {
  const favs = getFavorites(typeId)
  if (favs[questionId]) {
    delete favs[questionId]
    uni.setStorageSync('favorites_' + typeId, favs)
    return false
  } else {
    favs[questionId] = { time: now() }
    uni.setStorageSync('favorites_' + typeId, favs)
    return true
  }
}

/**
 * 检查是否已收藏
 * @param {string} typeId
 * @param {string} questionId
 * @returns {boolean}
 */
export function isFavorite(typeId, questionId) {
  const favs = getFavorites(typeId)
  return !!favs[questionId]
}

/**
 * 取消收藏
 * @param {string} typeId
 * @param {string} questionId
 */
export function removeFavorite(typeId, questionId) {
  const favs = getFavorites(typeId)
  delete favs[questionId]
  uni.setStorageSync('favorites_' + typeId, favs)
}

// ============ 笔记 ============

/**
 * 获取全部笔记
 * @param {string} typeId
 * @returns {Object} { question_id: { content, time } }
 */
export function getNotes(typeId) {
  return uni.getStorageSync('notes_' + typeId) || {}
}

/**
 * 获取指定题目的笔记
 * @param {string} typeId
 * @param {string} questionId
 * @returns {Object|null}
 */
export function getNote(typeId, questionId) {
  const notes = getNotes(typeId)
  return notes[questionId] || null
}

/**
 * 保存笔记
 * @param {string} typeId
 * @param {string} questionId
 * @param {string} content
 */
export function saveNote(typeId, questionId, content) {
  const notes = getNotes(typeId)
  if (!content || !content.trim()) {
    delete notes[questionId]
  } else {
    notes[questionId] = { content: content.trim(), time: now() }
  }
  uni.setStorageSync('notes_' + typeId, notes)
}

/**
 * 删除笔记
 * @param {string} typeId
 * @param {string} questionId
 */
export function removeNote(typeId, questionId) {
  const notes = getNotes(typeId)
  delete notes[questionId]
  uni.setStorageSync('notes_' + typeId, notes)
}

// ============ 广告解锁 ============

// 广告开关：true=开启广告解锁模式，false=所有科目直接可用
const AD_ENABLED = false

// 免费科目（广告模式下不需要看广告即可使用的科目）
const FREE_SUBJECTS = ['中医基础理论', '中医诊断学']
const AD_UNLOCK_HOURS = 24

export function isSubjectUnlocked(typeId, subjectName) {
  if (!AD_ENABLED) return true
  if (FREE_SUBJECTS.includes(subjectName)) return true
  const adUnlocks = uni.getStorageSync('ad_unlock_' + typeId) || {}
  const unlockTime = adUnlocks[subjectName]
  if (unlockTime && (Date.now() - unlockTime) < AD_UNLOCK_HOURS * 60 * 60 * 1000) {
    return true
  }
  return false
}

export function isAdEnabled() {
  return AD_ENABLED
}

export function unlockByAd(typeId, subjectName) {
  const adUnlocks = uni.getStorageSync('ad_unlock_' + typeId) || {}
  adUnlocks[subjectName] = Date.now()
  uni.setStorageSync('ad_unlock_' + typeId, adUnlocks)
}

export function getUnlockRemaining(typeId, subjectName) {
  if (!AD_ENABLED) return 0
  const adUnlocks = uni.getStorageSync('ad_unlock_' + typeId) || {}
  const unlockTime = adUnlocks[subjectName]
  if (!unlockTime) return 0
  const remaining = AD_UNLOCK_HOURS * 60 * 60 * 1000 - (Date.now() - unlockTime)
  if (remaining <= 0) return 0
  return Math.ceil(remaining / (60 * 1000))
}

// ============ 统计 ============

/**
 * 获取全局统计数据
 * @param {string} typeId
 * @returns {Object}
 */
export function getGlobalStats(typeId) {
  const progress = getProgress(typeId)
  const wrong = getWrongList(typeId)
  const favs = getFavorites(typeId)
  const notes = getNotes(typeId)

  const answered = Object.keys(progress).length
  const correct = Object.values(progress).filter(p => p.correct).length

  return {
    answered,
    correct,
    wrongCount: Object.keys(wrong).length,
    favoriteCount: Object.keys(favs).length,
    noteCount: Object.keys(notes).length
  }
}

/**
 * 重置指定考试类型的全部用户数据
 * @param {string} typeId
 */
export function resetAllData(typeId) {
  uni.removeStorageSync('progress_' + typeId)
  uni.removeStorageSync('wrong_' + typeId)
  uni.removeStorageSync('favorites_' + typeId)
  uni.removeStorageSync('notes_' + typeId)
  // 清除每日一练缓存
  const today = new Date().toISOString().slice(0, 10)
  uni.removeStorageSync('daily_' + typeId + '_' + today)
  // 清除广告解锁记录
  uni.removeStorageSync('ad_unlock_' + typeId)
}
