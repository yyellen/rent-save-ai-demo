// ====== DEMO MOCK MODE (純前端展示，無需後端) ======

const MOCK_RESULT = {
  summary: {
    monthly_rent: { amount: 18000 },
    deposit: {
      amount: 72000,          // 4 個月租金，超過法定上限
      status: 'illegal',
      legal_limit: 36000      // 法定上限：2 個月租金
    },
    lease_term: {
      start: '114/06/01',
      end:   '115/05/31'
    }
  },
  risk_clauses: [
    {
      title: '押金超收（超過法定上限）',
      clause_number: '第五條',
      severity: 'illegal',
      plain_explanation:
        '經比對發現，本合約約定之押金數額（四個月租金，計 72,000 元）已逾越法定上限。' +
        '依現行法規，押金最高僅得收取兩個月租金（計 36,000 元），超出部分依法無效。',
      legal_basis:
        '《住宅租賃定型化契約應記載及不得記載事項》應記載事項第五條：' +
        '押金最高不得超過二個月租金之總額。',
      negotiation_script:
        '「房東您好，我看到合約上寫押金是四個月，不過根據內政部最新規定，押金上限是兩個月租金喔，' +
        '也就是 36,000 元。我想我們可以依照法規來調整，這樣對雙方都比較有保障，您覺得可以嗎？」'
    },
    {
      title: '電費計算方式違法',
      clause_number: '第六條',
      severity: 'illegal',
      plain_explanation:
        '合約約定電費按每度 6 元計收。然依現行法規，按度計費之電費不得超過台灣電力公司' +
        '當期電費單之「每度平均電價」，此計費標準有牴觸法規之虞。',
      legal_basis:
        '《住宅租賃定型化契約應記載及不得記載事項》應記載事項第六條：' +
        '電費若按度計費，每度不得超過台電電費單之「當期每度平均電價」。',
      negotiation_script:
        '「房東您好，合約上電費寫每度 6 元，但依據內政部規定，電費不能超過台電帳單上的每度平均電價。' +
        '我可以每期把台電帳單給您看，按實際電價計算，這樣對我們兩邊都比較公平，您看如何？」'
    },
    {
      title: '限制遷入戶籍及申報租金扣稅',
      clause_number: '第十二條',
      severity: 'illegal',
      plain_explanation:
        '本合約明文限制承租人遷入戶籍及申報租賃費用以扣抵所得稅。' +
        '上述限制皆違反內政部之「不得記載事項」規定，屬於無效條款，承租人仍依法享有前揭權利。',
      legal_basis:
        '《住宅租賃定型化契約應記載及不得記載事項》不得記載事項第三條（禁止限制申報費用）、' +
        '第四條（禁止限制遷入戶籍）。',
      negotiation_script:
        '「房東您好，合約中關於不能遷戶籍和不能申報租金費用這兩點，根據內政部規定都是不能寫進合約的條款，' +
        '就算寫了在法律上也是無效的。我希望能把這兩條刪掉，保留我應有的合法權利，謝謝您的理解！」'
    },
    {
      title: '逾期不遷讓須付雙倍租金違約金',
      clause_number: '第十七條',
      severity: 'high-risk',
      plain_explanation:
        '合約約定逾期遷讓房屋將課以雙倍租金之違約金。雖此約定具警示性質，' +
        '然若發生爭議，法院得視實際損害情形依職權酌減違約金數額。為確保權益，建議雙方得研議增列合理之搬遷寬限期。',
      legal_basis:
        '《民法》第 440 條及 《土地法》第 100 條關於違約金之規範。依法院實務，' +
        '違約金若與實際損害顯不相當，法院得依職權酌減，但仍應注意避免糾紛。',
      negotiation_script:
        '「房東您好，關於逾期未搬離要賠兩倍租金這條，我有些擔心萬一搬家公司臨時有狀況，' +
        '我沒辦法精準控制搬家日期。能否在合約中加入合理的寬限期，比如三到五天的緩衝期，' +
        '或是改以每日計算違約金，這樣對雙方都比較彈性，您覺得可以嗎？」'
    },
    {
      title: '禁止開火、禁止養寵物',
      clause_number: '第八條',
      severity: 'notice',
      plain_explanation:
        '合約載明禁止室內開火及飼養寵物。此類使用限制雖屬雙方得自由約定之範疇，' +
        '然為避免日後衍生爭議，建議於簽約前進一步釐清「開火」之具體定義（如是否包含電磁爐等無明火設備）與相關限制。',
      legal_basis:
        '《住宅租賃定型化契約應記載及不得記載事項》應記載事項第八條：' +
        '住宅限居住使用，不得存放危險物品，其他使用限制由雙方協議約定。',
      negotiation_script:
        '「房東您好，關於不能開火的部分，我想確認一下這個限制的範圍：電磁爐或氣炸鍋這類不明火的烹飪方式可以嗎？' +
        '另外養寵物這部分，我目前養了一隻小型犬，平常都關在籠子裡不會有噪音，' +
        '不知道是否有機會通融？我可以額外繳交寵物保證金作為保障。」'
    }
  ]
};

// ====== Mock 談判話術（按需展示，模擬串流效果）======
const MOCK_SCRIPTS = MOCK_RESULT.risk_clauses.map(c => c.negotiation_script);

/**
 * 模擬合約分析 (Mock — 無需呼叫後端)
 * @param {File[]} files - 使用者上傳的檔案陣列（Demo 模式下不實際使用）
 */
async function analyzeContract(files) {
  // 模擬 AI 分析的網路延遲
  await new Promise(resolve => setTimeout(resolve, 2800));

  console.log('\n========== [DEMO MOCK] /api/analyze 模擬回傳 ==========');
  console.dir(MOCK_RESULT);
  console.log('=======================================================\n');

  return MOCK_RESULT;
}

/**
 * 模擬產生談判話術 (Mock — 無需呼叫後端)
 * @param {Object} clauseData - 單一條款物件
 */
async function generateNegotiationScript(clauseData) {
  // 模擬 AI 生成的網路延遲
  await new Promise(resolve => setTimeout(resolve, 1200));

  // 依照條款標題比對對應的 Mock 話術
  const matched = MOCK_RESULT.risk_clauses.find(
    c => c.title === clauseData.title
  );
  const script = matched
    ? matched.negotiation_script
    : '建議您禮貌地向房東提出此條款的疑慮，並要求依照法規修改合約內容。';

  console.log('\n========== [DEMO MOCK] /api/generate-script 模擬回傳 ==========');
  console.log({ script });
  console.log('================================================================\n');

  return { success: true, script };
}
