/**
 * Landing page chinoise (/zh) — cible les organisateurs d'événementiel
 * sinophones en France (mariages, entreprises, congrès, circuits) qui
 * cherchent en mandarin sur Google : 法国大巴租赁, 巴黎包车, 婚礼用车…
 *
 * Fichier de données pur (aucun import) : partagé entre la page React
 * et le script de prérendu. Une seule page, pas une 5e langue du site —
 * le suivi client se fait en anglais ou en français (précisé sur la page).
 */

export const zhMeta = {
  path: '/zh',
  title: '法国大巴租赁（含司机）— 婚礼、企业活动、旅游包车 | Busmoov',
  description: '在法国租用带司机的大巴、中巴：巴黎接机、婚礼用车、企业活动、展会接送、旅游包车。24小时内免费获取多家法国正规车行的报价。',
  h1: '法国大巴与中巴租赁（含专业司机）',
  sousTitre: '婚礼、企业活动、会议接送、旅游包车 — 我们为您比较多家法国正规车行的报价，24小时内回复，价格固定透明。',
}

export const zhIntro = [
  'Busmoov 是法国本土的巴士租赁平台，与遍布全法的持牌车行合作。无论是巴黎的婚礼车队、企业年会与团建、展会与会议接送，还是巴黎—凡尔赛—卢瓦尔河谷—普罗旺斯的旅游包车，您只需提交一次需求，即可在24小时内收到多家车行的报价，选择最合适的一家在线确认。',
  '所有车辆均配备法国职业司机（法国法规规定，9座以上车辆必须由持D照的职业司机驾驶），报价包含司机、燃油和高速过路费，无隐藏费用。',
]

export const zhServices = [
  { titre: '机场接送', desc: '戴高乐（CDG）、奥利（Orly）及全法机场的团队接送机，航班延误自动跟踪。' },
  { titre: '婚礼用车', desc: '宾客往返教堂、酒庄与酒店的接送车队，含深夜返程，大巴与中巴灵活搭配。' },
  { titre: '企业活动与团建', desc: '年会、研讨会、奖励旅游：全程一辆车、一位司机，行程灵活。' },
  { titre: '展会与会议', desc: '巴黎凡尔赛门展览中心、维勒班特展览中心等：酒店与展馆之间的班车服务。' },
  { titre: '旅游包车', desc: '凡尔赛宫、卢瓦尔河谷城堡、香槟区、普罗旺斯、瑞士与意大利跨境线路。' },
  { titre: '购物行程', desc: '河谷购物村（La Vallée Village）、老佛爷、奥斯曼大道的往返包车。' },
]

export const zhVehicules = [
  { titre: '商务中巴（8-20座）', desc: '适合小型团队与VIP接待，真皮座椅，机动灵活。' },
  { titre: '标准大巴（21-59座）', desc: '最常用也最经济的车型：空调、行李舱、安全带齐全。' },
  { titre: '大容量与双层大巴（60-90座）', desc: '大型活动首选，配Wi-Fi、USB充电与卫生间。' },
]

export const zhFaq = [
  {
    q: '在法国租一辆大巴多少钱？',
    a: '标准大巴（59座以内）本地一日行程含税690欧元起，价格取决于行程距离、用车时长和车型。中巴约便宜10%，大容量车型贵15%到70%。报价为固定总价，包含司机、燃油和过路费。',
  },
  {
    q: '司机会说中文吗？',
    a: '司机通常讲法语，多数也能用英语沟通。如团队需要中文服务，建议随行安排一位翻译或领队；我们可以提前把行程要点用英文整理给司机。',
  },
  {
    q: '如何预订和付款？',
    a: '在线提交行程后24小时内收到报价，确认后支付30%定金即可锁定车辆（出发前30天内为50%，15天内为全款），支持银行卡和银行转账，可开具正规法国发票。',
  },
  {
    q: '页面是中文的，后续沟通用什么语言？',
    a: '本页为中文介绍，报价单、合同与后续沟通以英语或法语进行，预订表单为法语/英语界面。我们的团队习惯与国际客户合作，邮件往来用英语完全没有问题。',
  },
]

export const zhTexte = {
  servicesTitre: '我们的服务',
  vehiculesTitre: '车型选择',
  faqTitre: '常见问题',
  commentTitre: '如何预订',
  commentEtapes: [
    '填写行程表单（法语/英语界面）：出发地、目的地、日期、人数',
    '24小时内收到多家法国正规车行的报价，价格固定透明',
    '在线确认并支付定金，出发前收到司机姓名与联系电话',
  ],
  ctaTitre: '获取免费报价',
  ctaTexte: '两分钟提交需求，24小时内回复 — 也可直接发邮件至 infos@busmoov.com（英文）。',
  noteLangue: '提示：以下表单为法语/英语界面，后续沟通以英语或法语进行。',
}
