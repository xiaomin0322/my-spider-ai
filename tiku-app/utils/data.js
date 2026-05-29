/**
 * 数据加载模块
 *
 * H5模式：构建时用 require() 直接加载 JSON 文件（数据打包进JS）
 * 小程序模式：从远程 Gitee 服务器加载（需配置域名白名单）
 *
 * 新增考试类型时：
 *   1. 在 EXAM_REGISTRY 中添加注册信息
 *   2. 在 H5_DATA 和 DATA_FILES 中添加映射
 *   3. 在 EXAM_CONFIG 中添加模拟考试配置
 *   4. 将 JSON 文件放入 data/ 目录
 */

// 考试类型注册表（只保留有数据文件的类型）
const EXAM_REGISTRY = {
  ZHONGYIZHIYE: { id: 'ZHONGYIZHIYE', name: '中医执业', category: '中医类' },
  ZHONGYIZHULI: { id: 'ZHONGYIZHULI', name: '中医助理', category: '中医类' },
  ZHIYEYISHI: { id: 'ZHIYEYISHI', name: '执业医师', category: '中医类' },
  SCZHONGYIZHULI: { id: 'SCZHONGYIZHULI', name: '中医师承确有专长', category: '中医类' },
  ZHONGXIYIZHIYE: { id: 'ZHONGXIYIZHIYE', name: '中西医执业', category: '中医类' },
  ZHONGXIYIZHULI: { id: 'ZHONGXIYIZHULI', name: '中西医助理', category: '中医类' },
  ZHONGYINEIKEZHUZHI: { id: 'ZHONGYINEIKEZHUZHI', name: '中医内科主治', category: '中医类' },
  ZHONGYIWAIKEZHUZHI: { id: 'ZHONGYIWAIKEZHUZHI', name: '中医外科主治', category: '中医类' },
  ZHONGYIZHENJIUKEZHUZHI: { id: 'ZHONGYIZHENJIUKEZHUZHI', name: '中医针灸主治', category: '中医类' },
  ZHONGYIZONGHE: { id: 'ZHONGYIZONGHE', name: '考研中医综合', category: '中医类' },
}

// 远程数据服务器地址（小程序发布时修改此处）
// #ifndef H5
var DATA_BASE_URL = 'https://raw.giteeusercontent.com/xiaomin0322/boxhook/raw/master/ai/zy3'
// #endif

// H5模式：构建时直接加载JSON文件（webpack require）
// #ifdef H5
var H5_DATA = {
  ZHONGYIZHIYE: require('../data/ZHONGYIZHIYE.json'),
  ZHONGYIZHULI: require('../data/ZHONGYIZHULI.json'),
  ZHIYEYISHI: require('../data/ZHIYEYISHI.json'),
  SCZHONGYIZHULI: require('../data/SCZHONGYIZHULI.json'),
  ZHONGXIYIZHIYE: require('../data/ZHONGXIYIZHIYE.json'),
  ZHONGXIYIZHULI: require('../data/ZHONGXIYIZHULI.json'),
  ZHONGYINEIKEZHUZHI: require('../data/ZHONGYINEIKEZHUZHI.json'),
  ZHONGYIWAIKEZHUZHI: require('../data/ZHONGYIWAIKEZHUZHI.json'),
  ZHONGYIZHENJIUKEZHUZHI: require('../data/ZHONGYIZHENJIUKEZHUZHI.json'),
  ZHONGYIZONGHE: require('../data/ZHONGYIZONGHE.json'),
}
// #endif

// 数据文件路径映射（仅小程序使用远程URL）
var DATA_FILES = {}
// #ifndef H5
DATA_FILES = {
  ZHONGYIZHIYE: DATA_BASE_URL + '/ZHONGYIZHIYE.json',
  ZHONGYIZHULI: DATA_BASE_URL + '/ZHONGYIZHULI.json',
  ZHIYEYISHI: DATA_BASE_URL + '/ZHIYEYISHI.json',
  SCZHONGYIZHULI: DATA_BASE_URL + '/SCZHONGYIZHULI.json',
  ZHONGXIYIZHIYE: DATA_BASE_URL + '/ZHONGXIYIZHIYE.json',
  ZHONGXIYIZHULI: DATA_BASE_URL + '/ZHONGXIYIZHULI.json',
  ZHONGYINEIKEZHUZHI: DATA_BASE_URL + '/ZHONGYINEIKEZHUZHI.json',
  ZHONGYIWAIKEZHUZHI: DATA_BASE_URL + '/ZHONGYIWAIKEZHUZHI.json',
  ZHONGYIZHENJIUKEZHUZHI: DATA_BASE_URL + '/ZHONGYIZHENJIUKEZHUZHI.json',
  ZHONGYIZONGHE: DATA_BASE_URL + '/ZHONGYIZONGHE.json',
}
// #endif

const DATA_PREFIX = 'exam_data_'

// 内存缓存
const memoryCache = {}

// #ifdef H5
/**
 * H5模式：从require加载的数据初始化
 */
export async function initExamData(typeId) {
  if (memoryCache[typeId] && memoryCache[typeId].length > 0) return true
  const key = DATA_PREFIX + typeId
  const cached = uni.getStorageSync(key)
  if (cached && cached.length > 0) {
    memoryCache[typeId] = cached
    return true
  }
  const data = H5_DATA[typeId] || null
  if (!data || !Array.isArray(data) || data.length === 0) return false
  memoryCache[typeId] = data
  uni.setStorageSync(key, data)
  return true
}
// #endif

// #ifndef H5
// 清除旧版本可能遗留的大数据缓存
var _cleanedOldCache = false
function cleanOldCache() {
  if (_cleanedOldCache) return
  _cleanedOldCache = true
  try {
    var res = uni.getStorageInfoSync()
    var keys = res.keys || []
    keys.forEach(function(k) {
      if (k.indexOf('exam_data_') === 0) {
        uni.removeStorageSync(k)
      }
    })
  } catch (e) {}
}

/**
 * 小程序模式：从远程加载，只用内存缓存
 */
export async function initExamData(typeId) {
  cleanOldCache()
  if (memoryCache[typeId] && memoryCache[typeId].length > 0) return true
  const filePath = DATA_FILES[typeId]
  if (!filePath) return false
  const typeName = (EXAM_REGISTRY[typeId] || {}).name || typeId
  uni.showLoading({ title: '正在加载' + typeName + '题库...', mask: true })
  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: filePath,
        method: 'GET',
        dataType: 'json',
        header: { 'Accept': 'application/json' },
        success: (r) => {
          if (r.statusCode !== 200) {
            reject(new Error('HTTP ' + r.statusCode))
          } else if (typeof r.data === 'string') {
            reject(new Error('请检查域名白名单'))
          } else {
            resolve(r)
          }
        },
        fail: (e) => reject(e)
      })
    })
    const data = res.data
    if (!data || !Array.isArray(data) || data.length === 0) throw new Error('数据为空')
    memoryCache[typeId] = data
    uni.hideLoading()
    uni.showToast({ title: '题库加载完成', icon: 'success' })
    return true
  } catch (e) {
    console.error('加载题库数据失败:', typeId, e)
    uni.hideLoading()
    uni.showToast({ title: '加载失败：' + (e.message || '网络错误'), icon: 'none', duration: 3000 })
    return false
  }
}
// #endif

/**
 * 获取全部题目
 * @param {string} typeId
 * @returns {Array}
 */
// #ifdef H5
export function getAllQuestions(typeId) {
  if (memoryCache[typeId]) return memoryCache[typeId]
  const data = uni.getStorageSync(DATA_PREFIX + typeId) || []
  if (data.length > 0) memoryCache[typeId] = data
  return data
}
// #endif
// #ifndef H5
export function getAllQuestions(typeId) {
  return memoryCache[typeId] || []
}
// #endif

/**
 * 获取按科目→章节分组的数据
 * @param {string} typeId
 * @returns {Object}
 */
export function getStructuredData(typeId) {
  const questions = getAllQuestions(typeId)
  const structure = {}
  questions.forEach(function(q) {
    const subj = q.subject || '未分类'
    const chap = q.chapter || '未分类'
    if (!structure[subj]) structure[subj] = {}
    if (!structure[subj][chap]) structure[subj][chap] = []
    structure[subj][chap].push(q)
  })
  return structure
}

/**
 * 获取科目列表（含统计）
 * @param {string} typeId
 * @returns {Array}
 */
export function getSubjectList(typeId) {
  const structure = getStructuredData(typeId)
  return Object.keys(structure).map(function(subjName) {
    const chapters = structure[subjName]
    const chapterList = Object.keys(chapters).map(function(chapName) {
      return { name: chapName, count: chapters[chapName].length }
    })
    return {
      name: subjName,
      totalQuestions: chapterList.reduce(function(s, c) { return s + c.count }, 0),
      chapters: chapterList
    }
  })
}

/**
 * 获取指定科目的章节列表
 * @param {string} typeId
 * @param {string} subjectName
 * @returns {Array}
 */
export function getChapterList(typeId, subjectName) {
  const chapters = getStructuredData(typeId)[subjectName] || {}
  return Object.keys(chapters).map(function(name) {
    return { name: name, count: chapters[name].length, questions: chapters[name] }
  })
}

/**
 * 获取指定章节的题目
 * @param {string} typeId
 * @param {string} subjectName
 * @param {string} chapterName
 * @returns {Array}
 */
export function getChapterQuestions(typeId, subjectName, chapterName) {
  const s = getStructuredData(typeId)
  return (s[subjectName] && s[subjectName][chapterName]) || []
}

/**
 * 模拟考试配置
 * 每种考试类型的题数和时间（分钟）
 */
const EXAM_CONFIG = {
  ZHONGYIZHIYE: { total: 100, minutes: 100 },
  ZHONGYIZHULI: { total: 100, minutes: 100 },
  ZHIYEYISHI: { total: 100, minutes: 100 },
  SCZHONGYIZHULI: { total: 100, minutes: 100 },
  ZHONGXIYIZHIYE: { total: 100, minutes: 100 },
  ZHONGXIYIZHULI: { total: 100, minutes: 100 },
  ZHONGYINEIKEZHUZHI: { total: 100, minutes: 90 },
  ZHONGYIWAIKEZHUZHI: { total: 100, minutes: 90 },
  ZHONGYIZHENJIUKEZHUZHI: { total: 100, minutes: 90 },
  ZHONGYIZONGHE: { total: 180, minutes: 180 },
}

/**
 * 获取模拟考试题目（按科目比例随机抽取）
 * @param {string} typeId
 * @returns {{ questions: Array, totalMinutes: number }}
 */
export function getExamQuestions(typeId) {
  const config = EXAM_CONFIG[typeId] || { total: 100, minutes: 100 }
  const structure = getStructuredData(typeId)
  const subjects = Object.keys(structure)

  // 统计每个科目的题目总数
  const subjectCounts = {}
  let grandTotal = 0
  subjects.forEach(function(subj) {
    let count = 0
    Object.values(structure[subj]).forEach(function(chap) { count += chap.length })
    subjectCounts[subj] = count
    grandTotal += count
  })

  // 按比例分配每个科目的抽取数量
  const subjectAlloc = {}
  let allocated = 0
  subjects.forEach(function(subj, i) {
    if (i === subjects.length - 1) {
      subjectAlloc[subj] = config.total - allocated
    } else {
      const n = Math.max(1, Math.round(config.total * subjectCounts[subj] / grandTotal))
      subjectAlloc[subj] = n
      allocated += n
    }
  })

  // 从每个科目随机抽取
  const selected = []
  subjects.forEach(function(subj) {
    const allSubjQ = []
    Object.values(structure[subj]).forEach(function(chap) {
      chap.forEach(function(q) { allSubjQ.push(q) })
    })
    // shuffle and take
    const shuffled = allSubjQ.slice().sort(function() { return Math.random() - 0.5 })
    const take = Math.min(subjectAlloc[subj], shuffled.length)
    for (let i = 0; i < take; i++) selected.push(shuffled[i])
  })

  // 最终打乱顺序
  selected.sort(function() { return Math.random() - 0.5 })

  return { questions: selected, totalMinutes: config.minutes }
}

/**
 * 获取每日一练题目（随机10题）
 * @param {string} typeId
 * @param {number} count
 * @returns {Array}
 */
export function getDailyQuestions(typeId, count) {
  count = count || 10
  const all = getAllQuestions(typeId)
  const progress = uni.getStorageSync('progress_' + typeId) || {}
  const today = new Date().toISOString().slice(0, 10)
  const dailyKey = 'daily_' + typeId + '_' + today

  const saved = uni.getStorageSync(dailyKey)
  if (saved && saved.length > 0) return saved

  const unanswered = all.filter(function(q) { return !progress[q.question_id] })
  const pool = unanswered.length >= count ? unanswered : all
  const selected = pool.slice().sort(function() { return Math.random() - 0.5 }).slice(0, count)

  uni.setStorageSync(dailyKey, selected)
  return selected
}

/**
 * 获取已注册的考试类型列表
 * @returns {Array}
 */
export function getExamTypes() {
  return Object.values(EXAM_REGISTRY)
}

/**
 * 注册新的考试类型
 * @param {Object} config
 */
export function registerExamType(config) {
  EXAM_REGISTRY[config.id] = config
}
