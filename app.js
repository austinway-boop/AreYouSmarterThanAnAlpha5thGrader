(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const MAX_STRIKES = 2;
  const QUIZ_GRADES = ["1", "3", "5", "7", "11"];
  const INITIAL_QS = 3;

  const gradePool = {};
  QUIZ_GRADES.forEach(g => {
    gradePool[g] = QUESTIONS.filter(q => q.grade === g);
  });

  let state = {
    gradeIdx: 0,
    qIdx: 0,
    expanded: false,
    gradeStrikes: 0,
    answers: [],
    streak: 0,
    bestStreak: 0,
    locked: false,
    ended: false,
  };

  // ═══════════ I18N ═══════════

  const UI_STRINGS = {
    en: { chalkLine1: "Are you smarter than a", chalkLine2: "5th Grader", chalkLine3: "@ Alpha?", continue: "Continue", submit: "Submit", noCalc: "No calculator", sciCalc: "Scientific calc OK", graphCalc: "Graphing calc OK", placeholder: "Type your answer...", performAt: "Alpha students perform at", estGlobal: "An est. {pct} of the world population cannot perform at this level", dataMethod: "Data & Methodology", fullMethod: "Full methodology", playAgain: "Play Again", postX: "Post to X", saveImg: "↓ Save Image", scored: "How was this scored?", letsFind: "Let's Find Out", handle: "Your X handle", language: "Language", recentAttempts: "RECENT ATTEMPTS" },
    es: { chalkLine1: "¿Eres más listo que un", chalkLine2: "alumno de 5°", chalkLine3: "de Alpha?", continue: "Continuar", submit: "Enviar", noCalc: "Sin calculadora", sciCalc: "Calculadora científica OK", graphCalc: "Calculadora gráfica OK", placeholder: "Escribe tu respuesta...", performAt: "Los estudiantes Alpha rinden a nivel de", estGlobal: "Aprox. el {pct} de la población mundial no puede rendir a este nivel", dataMethod: "Datos y Metodología", fullMethod: "Metodología completa", playAgain: "Jugar de nuevo", postX: "Publicar en X", saveImg: "↓ Guardar imagen", scored: "¿Cómo se calificó?", letsFind: "Descúbrelo", handle: "Tu usuario de X", language: "Idioma", recentAttempts: "INTENTOS RECIENTES" },
    fr: { chalkLine1: "Es-tu plus intelligent qu'un", chalkLine2: "élève de CM2", chalkLine3: "chez Alpha ?", continue: "Continuer", submit: "Soumettre", noCalc: "Pas de calculatrice", sciCalc: "Calculatrice scientifique OK", graphCalc: "Calculatrice graphique OK", placeholder: "Tapez votre réponse...", performAt: "Les élèves Alpha performent au niveau de", estGlobal: "Env. {pct} de la population mondiale ne peut pas atteindre ce niveau", dataMethod: "Données et Méthodologie", fullMethod: "Méthodologie complète", playAgain: "Rejouer", postX: "Publier sur X", saveImg: "↓ Sauvegarder", scored: "Comment c'est noté ?", letsFind: "Découvrons", handle: "Votre pseudo X", language: "Langue", recentAttempts: "TENTATIVES RÉCENTES" },
    de: { chalkLine1: "Bist du schlauer als ein", chalkLine2: "Fünftklässler", chalkLine3: "bei Alpha?", continue: "Weiter", submit: "Absenden", noCalc: "Kein Taschenrechner", sciCalc: "Wissenschaftlicher TR OK", graphCalc: "Grafik-TR OK", placeholder: "Antwort eingeben...", performAt: "Alpha-Schüler leisten auf dem Niveau von", estGlobal: "Ca. {pct} der Weltbevölkerung kann dieses Niveau nicht erreichen", dataMethod: "Daten & Methodik", fullMethod: "Vollständige Methodik", playAgain: "Nochmal spielen", postX: "Auf X posten", saveImg: "↓ Bild speichern", scored: "Wie wurde bewertet?", letsFind: "Finden wir's heraus", handle: "Dein X-Handle", language: "Sprache", recentAttempts: "LETZTE VERSUCHE" },
    pt: { chalkLine1: "Você é mais esperto que um", chalkLine2: "aluno do 5° ano", chalkLine3: "da Alpha?", continue: "Continuar", submit: "Enviar", noCalc: "Sem calculadora", sciCalc: "Calculadora científica OK", graphCalc: "Calculadora gráfica OK", placeholder: "Digite sua resposta...", performAt: "Alunos Alpha performam no nível de", estGlobal: "Aprox. {pct} da população mundial não consegue performar neste nível", dataMethod: "Dados e Metodologia", fullMethod: "Metodologia completa", playAgain: "Jogar novamente", postX: "Postar no X", saveImg: "↓ Salvar imagem", scored: "Como foi pontuado?", letsFind: "Vamos descobrir", handle: "Seu @ do X", language: "Idioma", recentAttempts: "TENTATIVAS RECENTES" },
    zh: { chalkLine1: "你比Alpha的", chalkLine2: "五年级学生", chalkLine3: "更聪明吗？", continue: "继续", submit: "提交", noCalc: "不能使用计算器", sciCalc: "允许科学计算器", graphCalc: "允许图形计算器", placeholder: "输入你的答案...", performAt: "Alpha学生的表现水平为", estGlobal: "全球约{pct}的人口无法达到这个水平", dataMethod: "数据与方法论", fullMethod: "完整方法论", playAgain: "再玩一次", postX: "发布到X", saveImg: "↓ 保存图片", scored: "如何评分？", letsFind: "来试试", handle: "你的X账号", language: "语言", recentAttempts: "最近尝试" },
    ja: { chalkLine1: "Alphaの", chalkLine2: "5年生", chalkLine3: "より賢い？", continue: "続ける", submit: "送信", noCalc: "電卓禁止", sciCalc: "関数電卓OK", graphCalc: "グラフ電卓OK", placeholder: "答えを入力...", performAt: "Alphaの生徒のレベル：", estGlobal: "世界人口の約{pct}がこのレベルに達していません", dataMethod: "データと方法論", fullMethod: "詳細な方法論", playAgain: "もう一度", postX: "Xに投稿", saveImg: "↓ 画像保存", scored: "採点方法", letsFind: "挑戦する", handle: "X アカウント", language: "言語", recentAttempts: "最近の挑戦" },
    ko: { chalkLine1: "Alpha의", chalkLine2: "5학년", chalkLine3: "보다 똑똑한가?", continue: "계속", submit: "제출", noCalc: "계산기 없음", sciCalc: "공학 계산기 OK", graphCalc: "그래프 계산기 OK", placeholder: "답을 입력하세요...", performAt: "Alpha 학생들의 수준:", estGlobal: "세계 인구의 약 {pct}가 이 수준에 도달하지 못합니다", dataMethod: "데이터 및 방법론", fullMethod: "전체 방법론", playAgain: "다시 플레이", postX: "X에 게시", saveImg: "↓ 이미지 저장", scored: "채점 방법", letsFind: "알아보자", handle: "X 핸들", language: "언어", recentAttempts: "최근 시도" },
    ar: { chalkLine1: "هل أنت أذكى من", chalkLine2: "طالب صف خامس", chalkLine3: "في ألفا؟", continue: "متابعة", submit: "إرسال", noCalc: "بدون آلة حاسبة", sciCalc: "آلة حاسبة علمية مسموح", graphCalc: "آلة حاسبة بيانية مسموح", placeholder: "اكتب إجابتك...", performAt: "طلاب ألفا يؤدون بمستوى", estGlobal: "ما يقدر بـ {pct} من سكان العالم لا يستطيعون الأداء بهذا المستوى", dataMethod: "البيانات والمنهجية", fullMethod: "المنهجية الكاملة", playAgain: "العب مرة أخرى", postX: "نشر على X", saveImg: "↓ حفظ الصورة", scored: "كيف تم التقييم؟", letsFind: "لنكتشف", handle: "حسابك على X", language: "اللغة", recentAttempts: "المحاولات الأخيرة" },
    hi: { chalkLine1: "क्या आप Alpha के", chalkLine2: "5वीं कक्षा", chalkLine3: "के छात्र से होशियार हैं?", continue: "जारी रखें", submit: "जमा करें", noCalc: "कैलकुलेटर नहीं", sciCalc: "वैज्ञानिक कैलकुलेटर OK", graphCalc: "ग्राफिंग कैलकुलेटर OK", placeholder: "अपना उत्तर टाइप करें...", performAt: "Alpha छात्र इस स्तर पर प्रदर्शन करते हैं:", estGlobal: "विश्व जनसंख्या का अनु. {pct} इस स्तर पर प्रदर्शन नहीं कर सकता", dataMethod: "डेटा और कार्यप्रणाली", fullMethod: "पूर्ण कार्यप्रणाली", playAgain: "फिर से खेलें", postX: "X पर पोस्ट करें", saveImg: "↓ छवि सहेजें", scored: "स्कोर कैसे हुआ?", letsFind: "पता करें", handle: "आपका X हैंडल", language: "भाषा", recentAttempts: "हाल के प्रयास" },
    ru: { chalkLine1: "Ты умнее", chalkLine2: "пятиклассника", chalkLine3: "из Alpha?", continue: "Продолжить", submit: "Отправить", noCalc: "Без калькулятора", sciCalc: "Научный калькулятор OK", graphCalc: "Графический калькулятор OK", placeholder: "Введите ответ...", performAt: "Ученики Alpha работают на уровне", estGlobal: "Ок. {pct} населения мира не может достичь этого уровня", dataMethod: "Данные и методология", fullMethod: "Полная методология", playAgain: "Играть снова", postX: "Опубликовать в X", saveImg: "↓ Сохранить", scored: "Как оценивалось?", letsFind: "Узнаем", handle: "Ваш X", language: "Язык", recentAttempts: "ПОСЛЕДНИЕ ПОПЫТКИ" },
    tr: { chalkLine1: "Alpha'daki bir", chalkLine2: "5. sınıf öğrencisinden", chalkLine3: "daha mı akıllısın?", continue: "Devam", submit: "Gönder", noCalc: "Hesap makinesi yok", sciCalc: "Bilimsel hesap makinesi OK", graphCalc: "Grafik hesap makinesi OK", placeholder: "Cevabınızı yazın...", performAt: "Alpha öğrencileri şu seviyede performans gösteriyor:", estGlobal: "Dünya nüfusunun tahminen {pct}'i bu seviyede performans gösteremiyor", dataMethod: "Veri ve Metodoloji", fullMethod: "Tam metodoloji", playAgain: "Tekrar oyna", postX: "X'e gönder", saveImg: "↓ Resmi kaydet", scored: "Nasıl puanlandı?", letsFind: "Öğrenelim", handle: "X kullanıcı adınız", language: "Dil", recentAttempts: "SON DENEMELER" },
  };

  let currentLang = "en";
  let userHandle = "";

  function t(key) {
    return (UI_STRINGS[currentLang] || UI_STRINGS.en)[key] || UI_STRINGS.en[key] || key;
  }

  function setChalkText(line1, line2, line3) {
    [["#chalk-line-1", line1], ["#chalk-line-2", line2], ["#chalk-line-3", line3]].forEach(([sel, text]) => {
      const el = $(sel);
      el.innerHTML = "";
      [...text].forEach(ch => {
        const span = document.createElement("span");
        span.className = ch === " " ? "chalk-char space" : "chalk-char";
        span.textContent = ch === " " ? "\u00A0" : ch;
        span.style.animationDelay = "0ms";
        el.appendChild(span);
      });
    });
  }

  function applyLang() {
    currentLang = $("#lang-select").value;
    setChalkText(t("chalkLine1"), t("chalkLine2"), t("chalkLine3"));
    $("#btn-start").textContent = t("letsFind");
    $(".lb-label").textContent = t("recentAttempts");
    $('[for="x-handle"]').textContent = t("handle");
    $('[for="lang-select"]').textContent = t("language");
    $("#free-input").placeholder = t("placeholder");
    $("#btn-submit-free").textContent = t("submit");
    $("#gt-continue").textContent = t("continue");
    $("#btn-restart").textContent = t("playAgain");
    $(".methodology summary").textContent = t("scored");
  }

  $("#lang-select").addEventListener("change", applyLang);

  $("#x-handle").addEventListener("input", () => {
    $("#btn-start").disabled = !$("#x-handle").value.trim();
  });
  $("#x-handle").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && $("#x-handle").value.trim()) $("#btn-start").click();
  });

  let chalkAnimId = null;
  let chalkDone = false;

  function showScreen(id) {
    $$(".screen").forEach((s) => s.classList.remove("active"));
    $(`#screen-${id}`).classList.add("active");
    window.scrollTo(0, 0);
  }

  // ═══════════ CHALK ANIMATION ═══════════

  function runChalkAnimation() {
    chalkDone = false;
    const lines = [
      { el: "#chalk-line-1", text: t("chalkLine1") },
      { el: "#chalk-line-2", text: t("chalkLine2") },
      { el: "#chalk-line-3", text: t("chalkLine3") },
    ];

    lines.forEach(({ el }) => { $(el).innerHTML = ""; });
    $("#start-gate").classList.add("hidden");
    $("#leaderboard").classList.remove("visible");
    $("#chalk-hint").classList.add("visible");
    $("#chalk-hint").classList.remove("gone");

    const allChars = [];
    lines.forEach(({ el, text }, li) => {
      [...text].forEach((char, ci) => {
        allChars.push({ el, char, isSpace: char === " ", lineIdx: li });
      });
      if (li < lines.length - 1) {
        allChars.push({ el: null, char: null, isPause: true, duration: 250 });
      }
    });

    let i = 0;
    let cursorEl = null;

    function placeCursor(targetEl) {
      if (cursorEl) cursorEl.remove();
      cursorEl = document.createElement("span");
      cursorEl.className = "chalk-cursor";
      $(targetEl).appendChild(cursorEl);
    }

    function step() {
      if (i >= allChars.length) {
        if (cursorEl) cursorEl.remove();
        finishChalk();
        return;
      }
      const item = allChars[i];
      i++;

      if (item.isPause) {
        chalkAnimId = setTimeout(step, item.duration);
        return;
      }

      const span = document.createElement("span");
      span.className = item.isSpace ? "chalk-char space" : "chalk-char";
      span.textContent = item.isSpace ? "\u00A0" : item.char;
      span.style.animationDelay = "0ms";

      if (cursorEl) cursorEl.remove();
      $(item.el).appendChild(span);
      placeCursor(item.el);

      const delay = 30 + Math.floor(Math.random() * 30);
      chalkAnimId = setTimeout(step, delay);
    }

    chalkAnimId = setTimeout(step, 600);
  }

  function finishChalk() {
    chalkDone = true;
    clearTimeout(chalkAnimId);
    chalkAnimId = null;

    // make sure all text is visible
    setChalkText(t("chalkLine1"), t("chalkLine2"), t("chalkLine3"));

    // remove any cursor
    $$(".chalk-cursor").forEach((c) => c.remove());

    $("#chalk-hint").classList.remove("visible");
    setTimeout(() => $("#chalk-hint").classList.add("gone"), 400);

    setTimeout(() => {
      const gate = $("#start-gate");
      gate.classList.remove("hidden");
      gate.classList.add("fade-up");
      $("#btn-start").textContent = t("letsFind");
      $("#x-handle").focus();
    }, 200);

    setTimeout(() => {
      $("#leaderboard").classList.add("visible");
    }, 600);
  }

  // skip on click/tap during animation
  document.addEventListener("click", (e) => {
    if (!$('#screen-start').classList.contains('active')) return;
    if (chalkDone) return;
    if (e.target.id === "btn-start") return;
    finishChalk();
  });

  // ═══════════ LEADERBOARD ═══════════

  const LEADERBOARD = [
    { handle: "@naval", result: "Not smarter than a 4th Grader" },
    { handle: "@sophiaAI_", result: "Not smarter than a 3rd Grader" },
    { handle: "@balaboredd", result: "Not smarter than a 3rd Grader" },
    { handle: "@jack", result: "Not smarter than a 1st Grader" },
    { handle: "@chamath", result: "Not smarter than a 1st Grader" },
    { handle: "@lexfridman", result: "Not smarter than a 2nd Grader" },
    { handle: "@garaboredd", result: "Not smarter than a Kindergartener" },
    { handle: "@elonmusk", result: "Not smarter than a Kindergartener" },
    { handle: "@pmarca", result: "Not smarter than a Kindergartener" },
    { handle: "@david_perell", result: "Not smarter than a Kindergartener" },
  ];

  function renderLeaderboard() {
    const medals = ["🥇", "🥈", "🥉"];
    const container = $("#lb-rows");
    container.innerHTML = "";
    LEADERBOARD.forEach((entry, i) => {
      const rank = i + 1;
      const badge = rank <= 3 ? medals[rank - 1] : rank;
      const cls = rank <= 3 ? ` lb-top` : "";
      container.innerHTML += `
        <div class="lb-row${cls}">
          <span class="lb-rank">${badge}</span>
          <div class="lb-info">
            <span class="lb-handle">${entry.handle}</span>
            <span class="lb-result">${entry.result}</span>
          </div>
        </div>`;
    });
  }

  renderLeaderboard();

  // auto-run on load
  runChalkAnimation();

  // ═══════════ START ═══════════

  $("#btn-start").addEventListener("click", (e) => {
    e.stopPropagation();
    const raw = $("#x-handle").value.trim();
    const existing = $(".gate-error");
    if (existing) existing.remove();

    if (!raw) {
      const err = document.createElement("p");
      err.className = "gate-error";
      err.textContent = "Enter your X handle to continue";
      $("#x-handle").parentElement.appendChild(err);
      $("#x-handle").focus();
      return;
    }

    userHandle = raw.startsWith("@") ? raw : "@" + raw;
    currentLang = $("#lang-select").value;

    state = {
      gradeIdx: 0, qIdx: 0, expanded: false,
      gradeStrikes: 0, answers: [], streak: 0,
      bestStreak: 0, locked: false, ended: false,
    };
    showScreen("quiz");
    renderQuestion();
  });

  // ═══════════ HUD ═══════════

  function animateValue(el, to) {
    const from = parseInt(el.textContent) || 0;
    if (from === to) return;
    const diff = to - from;
    const steps = 12;
    let step = 0;
    const tick = () => {
      step++;
      el.textContent = Math.round(from + diff * (step / steps));
      if (step < steps) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function curGrade() { return QUIZ_GRADES[state.gradeIdx]; }
  function curQuestions() {
    const pool = gradePool[curGrade()];
    return state.expanded ? pool : pool.slice(0, INITIAL_QS);
  }
  function curQuestion() { return curQuestions()[state.qIdx]; }

  function updateHUD() {
    const g = curGrade();
    const qs = curQuestions();
    if (g) {
      $("#hud-grade-pill").textContent = GRADE_LABELS[g] || g;
      $("#hud-q-num").textContent = `${state.qIdx + 1} / ${qs.length}`;
    }
    $("#strike-1").className = `strike-dot ${state.gradeStrikes >= 1 ? "hit" : ""}`;
    $("#strike-2").className = `strike-dot ${state.gradeStrikes >= 2 ? "hit" : ""}`;
  }

  // ═══════════ QUIZ ═══════════

  let lastShownGrade = null;

  function renderQuestion() {
    if (state.ended) return;
    const g = curGrade();
    const q = curQuestion();

    if (g !== lastShownGrade) {
      lastShownGrade = g;
      showGradeTransition(g, () => showQuestion(q));
    } else {
      showQuestion(q);
    }
  }

  let gradeTransitionCb = null;

  const METHODOLOGY_TEXT = `These percentages are estimates — and they reflect a deeply unfortunate reality about global educational inequality, not something to celebrate. Billions of people lack access to the quality of education that would allow them to reach these levels. Population base: 8.1 billion, including ~650M children under 5 and ~750M adults with zero formal schooling (~1.4B who can't clear even the lowest bar). Among children 5–17 (~2.3B), the World Bank estimates learning poverty at ~53% in low/middle-income countries. In Sub-Saharan Africa it's ~87%. Among adults 18+ (~5.8B), PIAAC 2023 data shows ~25% of OECD adults score at Level 1 or below in numeracy — in the US it's 34%. Globally, only ~44% of adults over 25 have completed upper secondary education. I share these numbers to highlight the scale of the global education gap, not to diminish anyone.`;

  function showGradeTransition(grade, cb) {
    const el = $("#grade-transition");
    const info = GRADE_INFO[grade];

    $("#gt-grade").textContent = GRADE_LABELS[grade];
    $("#gt-detail").textContent = info
      ? `${t("performAt")} ${info.performing}`
      : "";

    $("#gt-topics").textContent = info?.topics || "";
    $("#gt-global").textContent = info?.globalPct
      ? t("estGlobal").replace("{pct}", info.globalPct)
      : "";

    const dataDetails = $("#gt-data-details");
    if (info) {
      dataDetails.style.display = "";
      dataDetails.removeAttribute("open");
      let body = `<div class="gt-data-row"><span>Math RIT Score</span><span>${info.rit}</span></div>`;
      if (info.percentile) {
        body += `<div class="gt-data-row"><span>NWEA Percentile</span><span>${info.percentile}</span></div>`;
      }
      body += `<div class="gt-data-row"><span>Performing at</span><span>${info.performing}</span></div>`;
      body += `<div class="gt-data-row"><span>Est. global outperformance</span><span>${info.globalPct}</span></div>`;
      body += `<p class="gt-data-source">Based on NWEA MAP scores (April 2025), World Bank learning poverty data, and PIAAC 2023 numeracy assessments.</p>`;
      body += `<p class="gt-data-disclaimer">⚠ These global estimates are approximations derived from available data. Actual figures may vary.</p>`;
      body += `<details class="gt-method"><summary>Full methodology</summary><p class="gt-method-text">${METHODOLOGY_TEXT}</p></details>`;
      $("#gt-data-body").innerHTML = body;
    } else {
      dataDetails.style.display = "none";
    }

    $("#gt-data-summary").textContent = t("dataMethod");
    $("#gt-continue").textContent = t("continue");

    gradeTransitionCb = cb;
    el.classList.remove("hidden", "fade-out");
    el.classList.add("fade-in");
  }

  $("#gt-continue").addEventListener("click", () => {
    const el = $("#grade-transition");
    el.classList.add("fade-out");
    setTimeout(() => {
      el.classList.add("hidden");
      el.classList.remove("fade-in", "fade-out");
      if (gradeTransitionCb) gradeTransitionCb();
      gradeTransitionCb = null;
    }, 300);
  });

  function renderMath(text) {
    return text.replace(/\$([^$]+)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr, { throwOnError: false, displayMode: false });
      } catch (e) {
        return expr;
      }
    });
  }

  function calcLabel(calc) {
    if (calc === "scientific") return t("sciCalc");
    if (calc === "graphing") return t("graphCalc");
    return t("noCalc");
  }

  function showQuestion(q) {
    updateHUD();
    state.locked = false;

    $("#q-subject").textContent = q.subject;
    $("#q-subject").className = `subject-tag ${q.isObscure ? "obscure" : ""}`;

    const calcEl = $("#q-calc");
    calcEl.classList.remove("hidden");
    calcEl.textContent = calcLabel(q.calc);
    calcEl.className = `calc-tag calc-${q.calc || "none"}`;

    $("#question-text").innerHTML = renderMath(q.question);

    const opts = $("#options-container");
    const free = $("#free-response-container");

    if (q.type === "free-response") {
      opts.classList.add("hidden");
      free.classList.remove("hidden");
      const inp = $("#free-input");
      inp.value = "";
      inp.disabled = false;
      inp.className = "free-input";
      $("#btn-submit-free").disabled = false;
      setTimeout(() => inp.focus(), 80);
    } else {
      free.classList.add("hidden");
      opts.classList.remove("hidden");
      opts.innerHTML = "";

      const correctIdx = q.answerIndex ?? 0;
      const indexed = q.options.map((opt, i) => ({ text: opt, isCorrect: i === correctIdx }));
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
      }

      const letters = ["A", "B", "C", "D"];
      indexed.forEach((item, i) => {
        const btn = document.createElement("button");
        btn.className = "opt-btn";
        btn.innerHTML = `<span class="opt-letter">${letters[i]}</span><span class="opt-text">${renderMath(item.text)}</span>`;
        btn.addEventListener("click", () => handleAnswer(item.isCorrect, btn));
        opts.appendChild(btn);
      });
    }

    const card = $("#quiz-card");
    card.classList.remove("slide-in", "shake", "correct-glow");
    void card.offsetWidth;
    card.classList.add("slide-in");
  }

  // ═══════════ ANSWER ═══════════

  function handleAnswer(given, btnEl) {
    if (state.locked) return;
    state.locked = true;

    const q = curQuestion();
    let correct = false;

    if (typeof given === "boolean") {
      correct = given;
    } else if (q.acceptedAnswers && q.acceptedAnswers.length > 0) {
      const norm = given.trim().toLowerCase().replace(/[\$°%]/g, "");
      correct = q.acceptedAnswers.some(
        (a) => a.toLowerCase().replace(/[\$°%]/g, "") === norm
      );
    } else {
      correct = given.trim().toLowerCase() === q.answer.trim().toLowerCase();
    }

    state.answers.push({ questionId: q.id, given: String(given), correct, grade: q.grade });

    if (correct) onCorrect(btnEl);
    else onWrong(btnEl);
  }

  function onCorrect(btnEl) {
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    if (btnEl) {
      btnEl.classList.add("opt-correct");
      $$(".opt-btn").forEach((b) => { if (b !== btnEl) b.classList.add("opt-dim"); });
    } else {
      $("#free-input").classList.add("input-correct");
    }

    $("#quiz-card").classList.add("correct-glow");
    updateHUD();

    if (state.streak === 3 || state.streak === 5 || state.streak === 10) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }

    setTimeout(advance, 900);
  }

  function onWrong(btnEl) {
    state.streak = 0;
    state.gradeStrikes++;

    if (btnEl) {
      btnEl.classList.add("opt-wrong");
      $$(".opt-btn").forEach((b) => { if (b !== btnEl) b.classList.add("opt-dim"); });
    } else {
      $("#free-input").classList.add("input-wrong");
    }

    $("#quiz-card").classList.add("shake");
    updateHUD();

    if (state.gradeStrikes >= MAX_STRIKES) {
      setTimeout(() => { state.ended = true; showResults(); }, 1200);
    } else {
      if (!state.expanded) {
        state.expanded = true;
      }
      setTimeout(advance, 1200);
    }
  }

  function advance() {
    state.qIdx++;
    const qs = curQuestions();

    if (state.qIdx >= qs.length) {
      state.gradeIdx++;
      if (state.gradeIdx >= QUIZ_GRADES.length) {
        showResults();
      } else {
        state.qIdx = 0;
        state.gradeStrikes = 0;
        state.expanded = false;
        renderQuestion();
      }
    } else {
      renderQuestion();
    }
  }

  // FRQ
  $("#btn-submit-free").addEventListener("click", submitFree);
  $("#free-input").addEventListener("keydown", (e) => { if (e.key === "Enter") submitFree(); });

  function submitFree() {
    const val = $("#free-input").value.trim();
    if (!val || state.locked) return;
    $("#free-input").disabled = true;
    $("#btn-submit-free").disabled = true;
    handleAnswer(val, null);
  }

  // keyboard MCQ shortcuts
  document.addEventListener("keydown", (e) => {
    if (state.locked || !$('#screen-quiz').classList.contains('active')) return;
    const q = curQuestion();
    if (!q || q.type === "free-response") return;
    const map = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
    const idx = map[e.key.toLowerCase()];
    if (idx !== undefined) {
      const btns = $$(".opt-btn");
      if (btns[idx]) btns[idx].click();
    }
  });

  // ═══════════ RESULTS ═══════════

  function computeGrade() {
    const gradeCorrect = {};
    const gradeTotal = {};
    QUIZ_GRADES.forEach((g) => { gradeCorrect[g] = 0; gradeTotal[g] = 0; });
    state.answers.forEach((a) => {
      gradeCorrect[a.grade] += a.correct ? 1 : 0;
      gradeTotal[a.grade] += 1;
    });
    let highestPassed = null;
    for (const g of QUIZ_GRADES) {
      if (gradeTotal[g] === 0) break;
      const wrong = gradeTotal[g] - gradeCorrect[g];
      if (wrong < MAX_STRIKES) highestPassed = g;
      else break;
    }
    return { highestPassed, gradeCorrect, gradeTotal };
  }

  function showResults() {
    showScreen("results");
    const { highestPassed, gradeCorrect, gradeTotal } = computeGrade();
    const totalCorrect = state.answers.filter((a) => a.correct).length;
    const passedIdx = highestPassed ? QUIZ_GRADES.indexOf(highestPassed) : -1;
    const passedAll = passedIdx === QUIZ_GRADES.length - 1;
    const nextGrade = QUIZ_GRADES[passedIdx + 1] || null;

    if (passedAll) {
      $("#rc-title").textContent = "You ARE Smarter Than an Alpha 11th Grader!";
      $("#rc-title").className = "rc-title smart";
      $("#rc-emoji").textContent = "🎓";
    } else if (!highestPassed) {
      $("#rc-title").textContent = "Not Smarter Than an Alpha 1st Grader";
      $("#rc-title").className = "rc-title not-smart";
      $("#rc-emoji").textContent = "💀";
    } else {
      const next = nextGrade ? GRADE_LABELS[nextGrade] : "???";
      $("#rc-title").textContent = `Not Smarter Than an Alpha ${next} Student`;
      $("#rc-title").className = "rc-title not-smart";
      $("#rc-emoji").textContent = passedIdx >= 3 ? "😅" : "😬";
    }

    let barsHtml = "";
    QUIZ_GRADES.forEach((g) => {
      const c = gradeCorrect[g];
      const t = gradeTotal[g];
      if (t === 0) return;
      const wrong = t - c;
      const passed = wrong < MAX_STRIKES;
      barsHtml += `
        <div class="bar-row ${passed ? "passed" : "failed"}">
          <span class="bar-label">${GRADE_LABELS[g]}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(c / t) * 100}%"></div></div>
          <span class="bar-score">${c}/${t}</span>
        </div>`;
    });
    $("#rc-bars").innerHTML = barsHtml;

    $("#rc-streak").textContent = `🔥 ${state.bestStreak}`;
    $("#rc-correct").textContent = `${totalCorrect}/${state.answers.length}`;

    if (highestPassed && GRADE_INFO[highestPassed]) {
      const info = GRADE_INFO[highestPassed];
      $("#rc-context").classList.remove("hidden");
      $("#rc-context").innerHTML =
        `You matched <strong>Alpha ${GRADE_LABELS[highestPassed]}</strong> students who perform at <strong>${info.performing}</strong>.`;
    } else if (!highestPassed) {
      $("#rc-context").classList.remove("hidden");
      $("#rc-context").innerHTML =
        `Alpha 1st graders perform at a <strong>${GRADE_INFO["1"].performing}</strong>. Yeah.`;
    } else {
      $("#rc-context").classList.add("hidden");
    }

    let rows = '<table class="bd-table"><tr><th>Grade</th><th>Subject</th><th></th></tr>';
    state.answers.forEach((a) => {
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      rows += `<tr class="${a.correct ? "r-ok" : "r-bad"}">
        <td>${GRADE_LABELS[q.grade]}</td><td>${q.subject}</td><td>${a.correct ? "✓" : "✗"}</td>
      </tr>`;
    });
    rows += "</table>";
    $("#methodology-breakdown").innerHTML = rows;

    if (passedAll && typeof confetti !== "undefined") {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
    }
  }

  // ═══════════ SHARE ═══════════

  $("#btn-share-x").addEventListener("click", () => {
    const { highestPassed } = computeGrade();
    const totalCorrect = state.answers.filter((a) => a.correct).length;
    const passedIdx = highestPassed ? QUIZ_GRADES.indexOf(highestPassed) : -1;
    const passedAll = passedIdx === QUIZ_GRADES.length - 1;
    const nextGrade = QUIZ_GRADES[passedIdx + 1];
    let text;
    if (passedAll) text = `I'm Smarter Than an Alpha School 11th Grader 🎓\n${totalCorrect}/${state.answers.length} correct · 🔥${state.bestStreak} streak`;
    else if (!highestPassed) text = `NOT smarter than an Alpha School 1st grader 💀\n${totalCorrect}/${state.answers.length} correct`;
    else text = `NOT smarter than an Alpha School ${GRADE_LABELS[nextGrade]} student 😬\n${totalCorrect}/${state.answers.length} correct · 🔥${state.bestStreak} streak`;
    text += "\n\nThink you can beat me?";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank", "width=600,height=450");
  });

  $("#btn-download").addEventListener("click", async () => {
    const card = $("#results-card");
    card.classList.add("capturing");
    try {
      const canvas = await html2canvas(card, { backgroundColor: "#1e3a2e", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = "alpha-school-result.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) { console.error(e); }
    card.classList.remove("capturing");
  });

  // ═══════════ RESTART ═══════════

  $("#btn-restart").addEventListener("click", () => {
    showScreen("start");
    runChalkAnimation();
  });
})();
