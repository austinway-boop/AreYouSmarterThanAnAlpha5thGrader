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
    en: { chalkLine1: "Are you smarter than a", chalkLine2: "5th Grader", chalkLine3: "@ Alpha?", notSmarterThan: "Not smarter than", continue: "Continue", submit: "Submit", noCalc: "No calculator", sciCalc: "Scientific calc OK", graphCalc: "Graphing calc OK", placeholder: "Type your answer...", performAt: "Alpha students perform at", estGlobal: "An est. {pct} of the world population cannot perform at this level", dataMethod: "Data & Methodology", fullMethod: "Full methodology", playAgain: "Play Again", postX: "Post to X", saveImg: "↓ Save Image", scored: "How was this scored?", letsFind: "Let's Find Out", handle: "Your X handle", language: "Language", recentAttempts: "RECENT ATTEMPTS" },
    es: { chalkLine1: "¿Eres más listo que un", chalkLine2: "alumno de 5°", chalkLine3: "de Alpha?", notSmarterThan: "No más listo que", continue: "Continuar", submit: "Enviar", noCalc: "Sin calculadora", sciCalc: "Calculadora científica OK", graphCalc: "Calculadora gráfica OK", placeholder: "Escribe tu respuesta...", performAt: "Los estudiantes Alpha rinden a nivel de", estGlobal: "Aprox. el {pct} de la población mundial no puede rendir a este nivel", dataMethod: "Datos y Metodología", fullMethod: "Metodología completa", playAgain: "Jugar de nuevo", postX: "Publicar en X", saveImg: "↓ Guardar imagen", scored: "¿Cómo se calificó?", letsFind: "Descúbrelo", handle: "Tu usuario de X", language: "Idioma", recentAttempts: "INTENTOS RECIENTES" },
    fr: { chalkLine1: "Es-tu plus intelligent qu'un", chalkLine2: "élève de CM2", chalkLine3: "chez Alpha ?", notSmarterThan: "Pas plus intelligent que", continue: "Continuer", submit: "Soumettre", noCalc: "Pas de calculatrice", sciCalc: "Calculatrice scientifique OK", graphCalc: "Calculatrice graphique OK", placeholder: "Tapez votre réponse...", performAt: "Les élèves Alpha performent au niveau de", estGlobal: "Env. {pct} de la population mondiale ne peut pas atteindre ce niveau", dataMethod: "Données et Méthodologie", fullMethod: "Méthodologie complète", playAgain: "Rejouer", postX: "Publier sur X", saveImg: "↓ Sauvegarder", scored: "Comment c'est noté ?", letsFind: "Découvrons", handle: "Votre pseudo X", language: "Langue", recentAttempts: "TENTATIVES RÉCENTES" },
    de: { chalkLine1: "Bist du schlauer als ein", chalkLine2: "Fünftklässler", chalkLine3: "bei Alpha?", notSmarterThan: "Nicht schlauer als", continue: "Weiter", submit: "Absenden", noCalc: "Kein Taschenrechner", sciCalc: "Wissenschaftlicher TR OK", graphCalc: "Grafik-TR OK", placeholder: "Antwort eingeben...", performAt: "Alpha-Schüler leisten auf dem Niveau von", estGlobal: "Ca. {pct} der Weltbevölkerung kann dieses Niveau nicht erreichen", dataMethod: "Daten & Methodik", fullMethod: "Vollständige Methodik", playAgain: "Nochmal spielen", postX: "Auf X posten", saveImg: "↓ Bild speichern", scored: "Wie wurde bewertet?", letsFind: "Finden wir's heraus", handle: "Dein X-Handle", language: "Sprache", recentAttempts: "LETZTE VERSUCHE" },
    pt: { chalkLine1: "Você é mais esperto que um", chalkLine2: "aluno do 5° ano", chalkLine3: "da Alpha?", notSmarterThan: "Não mais esperto que", continue: "Continuar", submit: "Enviar", noCalc: "Sem calculadora", sciCalc: "Calculadora científica OK", graphCalc: "Calculadora gráfica OK", placeholder: "Digite sua resposta...", performAt: "Alunos Alpha performam no nível de", estGlobal: "Aprox. {pct} da população mundial não consegue performar neste nível", dataMethod: "Dados e Metodologia", fullMethod: "Metodologia completa", playAgain: "Jogar novamente", postX: "Postar no X", saveImg: "↓ Salvar imagem", scored: "Como foi pontuado?", letsFind: "Vamos descobrir", handle: "Seu @ do X", language: "Idioma", recentAttempts: "TENTATIVAS RECENTES" },
    zh: { chalkLine1: "你比Alpha的", chalkLine2: "五年级学生", chalkLine3: "更聪明吗？", notSmarterThan: "不比...聪明", continue: "继续", submit: "提交", noCalc: "不能使用计算器", sciCalc: "允许科学计算器", graphCalc: "允许图形计算器", placeholder: "输入你的答案...", performAt: "Alpha学生的表现水平为", estGlobal: "全球约{pct}的人口无法达到这个水平", dataMethod: "数据与方法论", fullMethod: "完整方法论", playAgain: "再玩一次", postX: "发布到X", saveImg: "↓ 保存图片", scored: "如何评分？", letsFind: "来试试", handle: "你的X账号", language: "语言", recentAttempts: "最近尝试" },
    ja: { chalkLine1: "Alphaの", chalkLine2: "5年生", chalkLine3: "より賢い？", notSmarterThan: "より賢くない", continue: "続ける", submit: "送信", noCalc: "電卓禁止", sciCalc: "関数電卓OK", graphCalc: "グラフ電卓OK", placeholder: "答えを入力...", performAt: "Alphaの生徒のレベル：", estGlobal: "世界人口の約{pct}がこのレベルに達していません", dataMethod: "データと方法論", fullMethod: "詳細な方法論", playAgain: "もう一度", postX: "Xに投稿", saveImg: "↓ 画像保存", scored: "採点方法", letsFind: "挑戦する", handle: "X アカウント", language: "言語", recentAttempts: "最近の挑戦" },
    ko: { chalkLine1: "Alpha의", chalkLine2: "5학년", chalkLine3: "보다 똑똑한가?", notSmarterThan: "보다 똑똑하지 않다", continue: "계속", submit: "제출", noCalc: "계산기 없음", sciCalc: "공학 계산기 OK", graphCalc: "그래프 계산기 OK", placeholder: "답을 입력하세요...", performAt: "Alpha 학생들의 수준:", estGlobal: "세계 인구의 약 {pct}가 이 수준에 도달하지 못합니다", dataMethod: "데이터 및 방법론", fullMethod: "전체 방법론", playAgain: "다시 플레이", postX: "X에 게시", saveImg: "↓ 이미지 저장", scored: "채점 방법", letsFind: "알아보자", handle: "X 핸들", language: "언어", recentAttempts: "최근 시도" },
    ar: { chalkLine1: "هل أنت أذكى من", chalkLine2: "طالب صف خامس", chalkLine3: "في ألفا؟", notSmarterThan: "ليس أذكى من", continue: "متابعة", submit: "إرسال", noCalc: "بدون آلة حاسبة", sciCalc: "آلة حاسبة علمية مسموح", graphCalc: "آلة حاسبة بيانية مسموح", placeholder: "اكتب إجابتك...", performAt: "طلاب ألفا يؤدون بمستوى", estGlobal: "ما يقدر بـ {pct} من سكان العالم لا يستطيعون الأداء بهذا المستوى", dataMethod: "البيانات والمنهجية", fullMethod: "المنهجية الكاملة", playAgain: "العب مرة أخرى", postX: "نشر على X", saveImg: "↓ حفظ الصورة", scored: "كيف تم التقييم؟", letsFind: "لنكتشف", handle: "حسابك على X", language: "اللغة", recentAttempts: "المحاولات الأخيرة" },
    hi: { chalkLine1: "क्या आप Alpha के", chalkLine2: "5वीं कक्षा", chalkLine3: "के छात्र से होशियार हैं?", notSmarterThan: "से ज़्यादा होशियार नहीं", continue: "जारी रखें", submit: "जमा करें", noCalc: "कैलकुलेटर नहीं", sciCalc: "वैज्ञानिक कैलकुलेटर OK", graphCalc: "ग्राफिंग कैलकुलेटर OK", placeholder: "अपना उत्तर टाइप करें...", performAt: "Alpha छात्र इस स्तर पर प्रदर्शन करते हैं:", estGlobal: "विश्व जनसंख्या का अनु. {pct} इस स्तर पर प्रदर्शन नहीं कर सकता", dataMethod: "डेटा और कार्यप्रणाली", fullMethod: "पूर्ण कार्यप्रणाली", playAgain: "फिर से खेलें", postX: "X पर पोस्ट करें", saveImg: "↓ छवि सहेजें", scored: "स्कोर कैसे हुआ?", letsFind: "पता करें", handle: "आपका X हैंडल", language: "भाषा", recentAttempts: "हाल के प्रयास" },
    ru: { chalkLine1: "Ты умнее", chalkLine2: "пятиклассника", chalkLine3: "из Alpha?", notSmarterThan: "Не умнее чем", continue: "Продолжить", submit: "Отправить", noCalc: "Без калькулятора", sciCalc: "Научный калькулятор OK", graphCalc: "Графический калькулятор OK", placeholder: "Введите ответ...", performAt: "Ученики Alpha работают на уровне", estGlobal: "Ок. {pct} населения мира не может достичь этого уровня", dataMethod: "Данные и методология", fullMethod: "Полная методология", playAgain: "Играть снова", postX: "Опубликовать в X", saveImg: "↓ Сохранить", scored: "Как оценивалось?", letsFind: "Узнаем", handle: "Ваш X", language: "Язык", recentAttempts: "ПОСЛЕДНИЕ ПОПЫТКИ" },
    tr: { chalkLine1: "Alpha'daki bir", chalkLine2: "5. sınıf öğrencisinden", chalkLine3: "daha mı akıllısın?", notSmarterThan: "Daha akıllı değil", continue: "Devam", submit: "Gönder", noCalc: "Hesap makinesi yok", sciCalc: "Bilimsel hesap makinesi OK", graphCalc: "Grafik hesap makinesi OK", placeholder: "Cevabınızı yazın...", performAt: "Alpha öğrencileri şu seviyede performans gösteriyor:", estGlobal: "Dünya nüfusunun tahminen {pct}'i bu seviyede performans gösteremiyor", dataMethod: "Veri ve Metodoloji", fullMethod: "Tam metodoloji", playAgain: "Tekrar oyna", postX: "X'e gönder", saveImg: "↓ Resmi kaydet", scored: "Nasıl puanlandı?", letsFind: "Öğrenelim", handle: "X kullanıcı adınız", language: "Dil", recentAttempts: "SON DENEMELER" },
    it: { chalkLine1: "Sei più intelligente di un", chalkLine2: "alunno di 5ª", chalkLine3: "di Alpha?", notSmarterThan: "Non più intelligente di", continue: "Continua", submit: "Invia", noCalc: "Nessuna calcolatrice", sciCalc: "Calcolatrice scientifica OK", graphCalc: "Calcolatrice grafica OK", placeholder: "Scrivi la tua risposta...", performAt: "Gli studenti Alpha performano a livello di", estGlobal: "Circa il {pct} della popolazione mondiale non riesce a questo livello", dataMethod: "Dati e Metodologia", fullMethod: "Metodologia completa", playAgain: "Gioca di nuovo", postX: "Pubblica su X", saveImg: "↓ Salva immagine", scored: "Come è stato valutato?", letsFind: "Scopriamolo", handle: "Il tuo handle X", language: "Lingua", recentAttempts: "TENTATIVI RECENTI" },
    nl: { chalkLine1: "Ben je slimmer dan een", chalkLine2: "5e-klasser", chalkLine3: "op Alpha?", notSmarterThan: "Niet slimmer dan", continue: "Doorgaan", submit: "Verzenden", noCalc: "Geen rekenmachine", sciCalc: "Wetenschappelijke rekenmachine OK", graphCalc: "Grafische rekenmachine OK", placeholder: "Typ je antwoord...", performAt: "Alpha-leerlingen presteren op niveau van", estGlobal: "Ongeveer {pct} van de wereldbevolking kan dit niveau niet bereiken", dataMethod: "Gegevens en Methodologie", fullMethod: "Volledige methodologie", playAgain: "Opnieuw spelen", postX: "Plaatsen op X", saveImg: "↓ Afbeelding opslaan", scored: "Hoe werd dit beoordeeld?", letsFind: "Laten we kijken", handle: "Je X-handle", language: "Taal", recentAttempts: "RECENTE POGINGEN" },
    uk: { chalkLine1: "Чи ти розумніший за", chalkLine2: "п'ятикласника", chalkLine3: "з Alpha?", notSmarterThan: "Не розумніший за", continue: "Продовжити", submit: "Надіслати", noCalc: "Без калькулятора", sciCalc: "Науковий калькулятор OK", graphCalc: "Графічний калькулятор OK", placeholder: "Введіть відповідь...", performAt: "Учні Alpha показують рівень", estGlobal: "Прибл. {pct} населення світу не може досягти цього рівня", dataMethod: "Дані та методологія", fullMethod: "Повна методологія", playAgain: "Грати знову", postX: "Опублікувати в X", saveImg: "↓ Зберегти зображення", scored: "Як оцінювалося?", letsFind: "Давайте дізнаємося", handle: "Ваш X", language: "Мова", recentAttempts: "ОСТАННІ СПРОБИ" },
    pl: { chalkLine1: "Czy jesteś mądrzejszy od", chalkLine2: "ucznia 5 klasy", chalkLine3: "z Alpha?", notSmarterThan: "Nie mądrzejszy niż", continue: "Kontynuuj", submit: "Wyślij", noCalc: "Bez kalkulatora", sciCalc: "Kalkulator naukowy OK", graphCalc: "Kalkulator graficzny OK", placeholder: "Wpisz odpowiedź...", performAt: "Uczniowie Alpha osiągają poziom", estGlobal: "Szac. {pct} ludności świata nie osiąga tego poziomu", dataMethod: "Dane i Metodologia", fullMethod: "Pełna metodologia", playAgain: "Zagraj ponownie", postX: "Opublikuj na X", saveImg: "↓ Zapisz obraz", scored: "Jak oceniano?", letsFind: "Sprawdźmy", handle: "Twój X", language: "Język", recentAttempts: "OSTATNIE PRÓBY" },
    ro: { chalkLine1: "Ești mai deștept decât un", chalkLine2: "elev de clasa a 5-a", chalkLine3: "de la Alpha?", notSmarterThan: "Nu mai deștept decât", continue: "Continuă", submit: "Trimite", noCalc: "Fără calculator", sciCalc: "Calculator științific OK", graphCalc: "Calculator grafic OK", placeholder: "Scrie răspunsul...", performAt: "Elevii Alpha performează la nivel de", estGlobal: "Aprox. {pct} din populația mondială nu poate atinge acest nivel", dataMethod: "Date și Metodologie", fullMethod: "Metodologie completă", playAgain: "Joacă din nou", postX: "Postează pe X", saveImg: "↓ Salvează imaginea", scored: "Cum s-a punctat?", letsFind: "Să aflăm", handle: "Contul tău X", language: "Limbă", recentAttempts: "ÎNCERCĂRI RECENTE" },
    cs: { chalkLine1: "Jsi chytřejší než", chalkLine2: "žák 5. třídy", chalkLine3: "z Alpha?", continue: "Pokračovat", submit: "Odeslat", noCalc: "Bez kalkulačky", sciCalc: "Vědecká kalkulačka OK", graphCalc: "Grafická kalkulačka OK", placeholder: "Napište odpověď...", performAt: "Žáci Alpha dosahují úrovně", estGlobal: "Odhadovaně {pct} světové populace nedosáhne této úrovně", dataMethod: "Data a Metodologie", fullMethod: "Plná metodologie", playAgain: "Hrát znovu", postX: "Publikovat na X", saveImg: "↓ Uložit obrázek", scored: "Jak se bodovalo?", letsFind: "Pojďme zjistit", handle: "Váš X účet", language: "Jazyk", recentAttempts: "POSLEDNÍ POKUSY" },
    sv: { chalkLine1: "Är du smartare än en", chalkLine2: "femteklassare", chalkLine3: "på Alpha?", notSmarterThan: "Inte smartare än", continue: "Fortsätt", submit: "Skicka", noCalc: "Ingen miniräknare", sciCalc: "Vetenskaplig miniräknare OK", graphCalc: "Grafritande miniräknare OK", placeholder: "Skriv ditt svar...", performAt: "Alpha-elever presterar på nivå med", estGlobal: "Uppskattningsvis {pct} av världens befolkning når inte denna nivå", dataMethod: "Data och Metodologi", fullMethod: "Fullständig metodologi", playAgain: "Spela igen", postX: "Posta på X", saveImg: "↓ Spara bild", scored: "Hur poängsattes det?", letsFind: "Låt oss ta reda på", handle: "Ditt X-konto", language: "Språk", recentAttempts: "SENASTE FÖRSÖK" },
    da: { chalkLine1: "Er du klogere end en", chalkLine2: "5. klasser", chalkLine3: "på Alpha?", notSmarterThan: "Ikke smartere end", continue: "Fortsæt", submit: "Send", noCalc: "Ingen lommeregner", sciCalc: "Videnskabelig lommeregner OK", graphCalc: "Grafregner OK", placeholder: "Skriv dit svar...", performAt: "Alpha-elever performerer på niveau med", estGlobal: "Est. {pct} af verdens befolkning kan ikke nå dette niveau", dataMethod: "Data og Metodologi", fullMethod: "Fuld metodologi", playAgain: "Spil igen", postX: "Post på X", saveImg: "↓ Gem billede", scored: "Hvordan blev det scoret?", letsFind: "Lad os finde ud af det", handle: "Dit X-handle", language: "Sprog", recentAttempts: "SENESTE FORSØG" },
    no: { chalkLine1: "Er du smartere enn en", chalkLine2: "5. klassing", chalkLine3: "på Alpha?", notSmarterThan: "Ikke smartere enn", continue: "Fortsett", submit: "Send inn", noCalc: "Ingen kalkulator", sciCalc: "Vitenskapelig kalkulator OK", graphCalc: "Grafkalkulator OK", placeholder: "Skriv svaret ditt...", performAt: "Alpha-elever presterer på nivå med", estGlobal: "Est. {pct} av verdens befolkning når ikke dette nivået", dataMethod: "Data og Metodologi", fullMethod: "Fullstendig metodologi", playAgain: "Spill igjen", postX: "Post på X", saveImg: "↓ Lagre bilde", scored: "Hvordan ble det poengsatt?", letsFind: "La oss finne ut", handle: "Ditt X-brukernavn", language: "Språk", recentAttempts: "SISTE FORSØK" },
    fi: { chalkLine1: "Oletko älykkäämpi kuin", chalkLine2: "5. luokan oppilas", chalkLine3: "Alpha:ssa?", notSmarterThan: "Ei fiksumpi kuin", continue: "Jatka", submit: "Lähetä", noCalc: "Ei laskinta", sciCalc: "Tieteellinen laskin OK", graphCalc: "Graafinen laskin OK", placeholder: "Kirjoita vastauksesi...", performAt: "Alpha-oppilaat suoriutuvat tasolla", estGlobal: "Arviolta {pct} maailman väestöstä ei yllä tähän tasoon", dataMethod: "Data ja Metodologia", fullMethod: "Täysi metodologia", playAgain: "Pelaa uudelleen", postX: "Julkaise X:ssä", saveImg: "↓ Tallenna kuva", scored: "Miten pisteytettiin?", letsFind: "Selvitetään", handle: "X-käyttäjätunnuksesi", language: "Kieli", recentAttempts: "VIIMEISimmät yritykset" },
    el: { chalkLine1: "Είσαι πιο έξυπνος από", chalkLine2: "μαθητή 5ης δημοτικού", chalkLine3: "στο Alpha?", notSmarterThan: "Όχι πιο έξυπνος από", continue: "Συνέχεια", submit: "Υποβολή", noCalc: "Χωρίς αριθμομηχανή", sciCalc: "Επιστημονική αριθμομηχανή OK", graphCalc: "Γραφική αριθμομηχανή OK", placeholder: "Πληκτρολόγησε την απάντησή σου...", performAt: "Οι μαθητές Alpha επιδίδονται σε επίπεδο", estGlobal: "Περίπου το {pct} του παγκόσμιου πληθυσμού δεν φτάνει σε αυτό το επίπεδο", dataMethod: "Δεδομένα και Μεθοδολογία", fullMethod: "Πλήρης μεθοδολογία", playAgain: "Παίξε ξανά", postX: "Δημοσίευση στο X", saveImg: "↓ Αποθήκευση εικόνας", scored: "Πώς βαθμολογήθηκε;", letsFind: "Ας μάθουμε", handle: "Το X handle σου", language: "Γλώσσα", recentAttempts: "ΠΡΟΣΦΑΤΕΣ ΠΡΟΣΠΑΘΕΙΕΣ" },
    he: { chalkLine1: "האם אתה חכם יותר מ", chalkLine2: "תלמיד כיתה ה'", chalkLine3: "ב-Alpha?", notSmarterThan: "לא חכם יותר מ", continue: "המשך", submit: "שלח", noCalc: "בלי מחשבון", sciCalc: "מחשבון מדעי OK", graphCalc: "מחשבון גרפי OK", placeholder: "הקלד את תשובתך...", performAt: "תלמידי Alpha מבצעים ברמת", estGlobal: "כ־{pct} מאוכלוסיית העולם לא מגיעים לרמה זו", dataMethod: "נתונים ומתודולוגיה", fullMethod: "מתודולוגיה מלאה", playAgain: "שחק שוב", postX: "פרסם ב-X", saveImg: "↓ שמור תמונה", scored: "איך חושב הציון?", letsFind: "בואו נגלה", handle: "ה-X handle שלך", language: "שפה", recentAttempts: "ניסיונות אחרונים" },
    fa: { chalkLine1: "آیا از یک", chalkLine2: "دانش‌آموز کلاس پنجم", chalkLine3: "در Alpha باهوش‌ترید؟", notSmarterThan: "باهوش‌تر نیست از", continue: "ادامه", submit: "ارسال", noCalc: "بدون ماشین‌حساب", sciCalc: "ماشین‌حساب علمی مجاز", graphCalc: "ماشین‌حساب گرافیکی مجاز", placeholder: "پاسخ خود را بنویسید...", performAt: "دانش‌آموزان Alpha در سطح", estGlobal: "تقریباً {pct} جمعیت جهان به این سطح نمی‌رسند", dataMethod: "داده و روش‌شناسی", fullMethod: "روش‌شناسی کامل", playAgain: "دوباره بازی کن", postX: "ارسال در X", saveImg: "↓ ذخیره تصویر", scored: "چگونه امتیازدهی شد؟", letsFind: "بیایید بفهمیم", handle: "حساب X شما", language: "زبان", recentAttempts: "تلاش‌های اخیر" },
    bn: { chalkLine1: "আপনি কি Alpha-র", chalkLine2: "৫ম শ্রেণির ছাত্রের", chalkLine3: "চেয়ে বুদ্ধিমান?", notSmarterThan: "এর চেয়ে বুদ্ধিমান নয়", continue: "চালিয়ে যান", submit: "জমা দিন", noCalc: "ক্যালকুলেটর নেই", sciCalc: "বৈজ্ঞানিক ক্যালকুলেটর OK", graphCalc: "গ্রাফ ক্যালকুলেটর OK", placeholder: "আপনার উত্তর টাইপ করুন...", performAt: "Alpha ছাত্ররা এই স্তরে পারফর্ম করে:", estGlobal: "বিশ্ব জনসংখ্যার আনুমানিক {pct} এই স্তরে পারফর্ম করতে পারে না", dataMethod: "ডেটা ও পদ্ধতি", fullMethod: "সম্পূর্ণ পদ্ধতি", playAgain: "আবার খেলুন", postX: "X-এ পোস্ট করুন", saveImg: "↓ ছবি সংরক্ষণ", scored: "কিভাবে স্কোর করা হয়েছিল?", letsFind: "চলুন জানি", handle: "আপনার X হ্যান্ডেল", language: "ভাষা", recentAttempts: "সাম্প্রতিক প্রচেষ্টা" },
    ta: { chalkLine1: "நீங்கள் Alpha-வின்", chalkLine2: "5வது வகுப்பு மாணவரை", chalkLine3: "விட புத்திசாலியா?", notSmarterThan: "விட புத்திசாலி அல்ல", continue: "தொடரவும்", submit: "சமர்ப்பிக்கவும்", noCalc: "கணிப்பான் இல்லை", sciCalc: "அறிவியல் கணிப்பான் OK", graphCalc: "வரைபட கணிப்பான் OK", placeholder: "உங்கள் பதிலை தட்டச்சு செய்யுங்கள்...", performAt: "Alpha மாணவர்கள் இந்த நிலையில் செயல்படுகிறார்கள்:", estGlobal: "உலக மக்கள் தொகையில் தோராயமாக {pct} இந்த நிலையை அடைய முடியாது", dataMethod: "தரவு மற்றும் முறை", fullMethod: "முழு முறை", playAgain: "மீண்டும் விளையாடு", postX: "X-இல் இடுகை", saveImg: "↓ படத்தை சேமி", scored: "எப்படி மதிப்பெண் கணக்கிடப்பட்டது?", letsFind: "கண்டுபிடிப்போம்", handle: "உங்கள் X ஹேண்டில்", language: "மொழி", recentAttempts: "சமீபத்திய முயற்சிகள்" },
    te: { chalkLine1: "మీరు Alpha యొక్క", chalkLine2: "5వ తరగతి విద్యార్థి", chalkLine3: "కంటే తెలివైనవారా?", notSmarterThan: "కంటే తెలివైనది కాదు", continue: "కొనసాగించు", submit: "సమర్పించు", noCalc: "కాల్క్యులేటర్ లేదు", sciCalc: "సైంటిఫిక్ కాల్క్యులేటర్ OK", graphCalc: "గ్రాఫ్ కాల్క్యులేటర్ OK", placeholder: "మీ సమాధానం టైప్ చేయండి...", performAt: "Alpha విద్యార్థులు ఈ స్థాయిలో పనిచేస్తారు:", estGlobal: "ప్రపంచ జనాభాలో సుమారు {pct} ఈ స్థాయిని చేరుకోలేరు", dataMethod: "డేటా మరియు పద్ధతి", fullMethod: "పూర్తి పద్ధతి", playAgain: "మళ్ళీ ఆడండి", postX: "Xలో పోస్ట్ చేయండి", saveImg: "↓ చిత్రాన్ని సేవ్ చేయండి", scored: "ఎలా స్కోర్ చేయబడింది?", letsFind: "తెలుసుకుందాం", handle: "మీ X హ్యాండిల్", language: "భాష", recentAttempts: "ఇటీవలి ప్రయత్నాలు" },
    ur: { chalkLine1: "کیا آپ Alpha کے", chalkLine2: "پانچویں جماعت کے طالب علم", chalkLine3: "سے زیادہ ذہین ہیں؟", notSmarterThan: "سے زیادہ ہوشیار نہیں", continue: "جاری رکھیں", submit: "جمع کروائیں", noCalc: "کوئی کیلکولیٹر نہیں", sciCalc: "سائنسی کیلکولیٹر OK", graphCalc: "گراف کیلکولیٹر OK", placeholder: "اپنا جواب ٹائپ کریں...", performAt: "Alpha طلباء اس سطح پر کارکردگی دکھاتے ہیں:", estGlobal: "دنیا کی آبادی کا تقریباً {pct} اس سطح پر کارکردگی نہیں دکھا سکتا", dataMethod: "ڈیٹا اور طریقہ کار", fullMethod: "مکمل طریقہ کار", playAgain: "دوبارہ کھیلیں", postX: "X پر پوسٹ کریں", saveImg: "↓ تصویر محفوظ کریں", scored: "سکور کیسے ہوا؟", letsFind: "آئیں معلوم کریں", handle: "آپ کا X ہینڈل", language: "زبان", recentAttempts: "حالیہ کوششیں" },
    vi: { chalkLine1: "Bạn có thông minh hơn", chalkLine2: "học sinh lớp 5", chalkLine3: "ở Alpha không?", notSmarterThan: "Không thông minh hơn", continue: "Tiếp tục", submit: "Gửi", noCalc: "Không máy tính", sciCalc: "Máy tính khoa học OK", graphCalc: "Máy tính đồ thị OK", placeholder: "Nhập câu trả lời...", performAt: "Học sinh Alpha đạt mức", estGlobal: "Ước tính {pct} dân số thế giới không đạt mức này", dataMethod: "Dữ liệu và Phương pháp", fullMethod: "Phương pháp đầy đủ", playAgain: "Chơi lại", postX: "Đăng lên X", saveImg: "↓ Lưu ảnh", scored: "Cách chấm điểm?", letsFind: "Hãy tìm hiểu", handle: "Tài khoản X của bạn", language: "Ngôn ngữ", recentAttempts: "LẦN THỬ GẦN ĐÂY" },
    th: { chalkLine1: "คุณฉลาดกว่า", chalkLine2: "นักเรียน ป.5", chalkLine3: "ที่ Alpha ไหม?", notSmarterThan: "ไม่ฉลาดกว่า", continue: "ดำเนินการต่อ", submit: "ส่ง", noCalc: "ไม่มีเครื่องคิดเลข", sciCalc: "เครื่องคิดเลขวิทยาศาสตร์ OK", graphCalc: "เครื่องคิดเลขกราฟ OK", placeholder: "พิมพ์คำตอบของคุณ...", performAt: "นักเรียน Alpha ทำได้ในระดับ", estGlobal: "ประมาณ {pct} ของประชากรโลกทำได้ไม่ถึงระดับนี้", dataMethod: "ข้อมูลและวิธีวิทยา", fullMethod: "วิธีวิทยาเต็มรูปแบบ", playAgain: "เล่นอีกครั้ง", postX: "โพสต์บน X", saveImg: "↓ บันทึกรูป", scored: "ให้คะแนนอย่างไร?", letsFind: "มาหาคำตอบกัน", handle: "แฮนเดิล X ของคุณ", language: "ภาษา", recentAttempts: "ความพยายามล่าสุด" },
    id: { chalkLine1: "Apakah kamu lebih pintar dari", chalkLine2: "siswa kelas 5", chalkLine3: "di Alpha?", notSmarterThan: "Tidak lebih pintar dari", continue: "Lanjutkan", submit: "Kirim", noCalc: "Tanpa kalkulator", sciCalc: "Kalkulator ilmiah OK", graphCalc: "Kalkulator grafik OK", placeholder: "Ketik jawabanmu...", performAt: "Siswa Alpha berprestasi di tingkat", estGlobal: "Sekitar {pct} populasi dunia tidak mencapai tingkat ini", dataMethod: "Data dan Metodologi", fullMethod: "Metodologi lengkap", playAgain: "Main lagi", postX: "Posting ke X", saveImg: "↓ Simpan gambar", scored: "Bagaimana penilaiannya?", letsFind: "Mari cari tahu", handle: "Akun X Anda", language: "Bahasa", recentAttempts: "PERCOBAAN TERBARU" },
    ms: { chalkLine1: "Adakah anda lebih bijak daripada", chalkLine2: "pelajar darjah 5", chalkLine3: "di Alpha?", notSmarterThan: "Tidak lebih bijak dari", continue: "Teruskan", submit: "Hantar", noCalc: "Tiada kalkulator", sciCalc: "Kalkulator saintifik OK", graphCalc: "Kalkulator grafik OK", placeholder: "Taip jawapan anda...", performAt: "Pelajar Alpha berprestasi pada tahap", estGlobal: "Anggaran {pct} penduduk dunia tidak mencapai tahap ini", dataMethod: "Data dan Metodologi", fullMethod: "Metodologi penuh", playAgain: "Main lagi", postX: "Siarkan di X", saveImg: "↓ Simpan imej", scored: "Bagaimana dinilai?", letsFind: "Mari kita ketahui", handle: "Nama X anda", language: "Bahasa", recentAttempts: "PERCUBAAN TERKINI" },
    tl: { chalkLine1: "Mas matalino ka ba kaysa sa", chalkLine2: "estudyante ng 5th grade", chalkLine3: "sa Alpha?", notSmarterThan: "Hindi mas matalino sa", continue: "Magpatuloy", submit: "Isumite", noCalc: "Walang calculator", sciCalc: "Scientific calculator OK", graphCalc: "Graphing calculator OK", placeholder: "I-type ang iyong sagot...", performAt: "Ang mga estudyante ng Alpha ay nagsasagawa sa antas ng", estGlobal: "Tinatayang {pct} ng populasyon ng mundo ay hindi maabot ang antas na ito", dataMethod: "Data at Metodolohiya", fullMethod: "Buong metodolohiya", playAgain: "Maglaro muli", postX: "I-post sa X", saveImg: "↓ I-save ang larawan", scored: "Paano naka-score?", letsFind: "Alamin natin", handle: "Iyong X handle", language: "Wika", recentAttempts: "KAMAKAILANG PAGSUBOK" },
    sw: { chalkLine1: "Je wewe mwerevu kuliko", chalkLine2: "mwanafunzi wa darasa la 5", chalkLine3: "Alpha?", notSmarterThan: "Si mjanja kuliko", continue: "Endelea", submit: "Wasilisha", noCalc: "Hakuna kikokotoo", sciCalc: "Kikokotoo cha kisayansi OK", graphCalc: "Kikokotoo cha grafu OK", placeholder: "Andika jibu lako...", performAt: "Wanafunzi wa Alpha wanafanya kwa kiwango cha", estGlobal: "Takriban {pct} ya watu duniani hawawezi kufikia kiwango hiki", dataMethod: "Data na Methodolojia", fullMethod: "Methodolojia kamili", playAgain: "Cheza tena", postX: "Chapisha kwenye X", saveImg: "↓ Hifadhi picha", scored: "Ilipewa alama vipi?", letsFind: "Tujue", handle: "Akaunti yako ya X", language: "Lugha", recentAttempts: "MAJARIBIO YA HUKI" },
    am: { chalkLine1: "ከAlpha ውስጥ ያለ", chalkLine2: "5ኛ ክፍል ተማሪ", chalkLine3: "በላይ ብልጥ ነህ?", notSmarterThan: "ከ...የበለጠ ብልጥ አይደለም", continue: "ቀጥል", submit: "አስገባ", noCalc: "ካልኩሌተር የለም", sciCalc: "ሳይንሳዊ ካልኩሌተር OK", graphCalc: "ግራፍ ካልኩሌተር OK", placeholder: "መልስህን ጻፍ...", performAt: "የAlpha ተማሪዎች በዚህ ደረጃ ይሰራሉ:", estGlobal: "የዓለም ህዝብ በግምት {pct} ይህን ደረጃ ማሳካት አይችልም", dataMethod: "ውሂብ እና ዘዴ", fullMethod: "ሙሉ ዘዴ", playAgain: "እንደገና ተጫወት", postX: "በX ላይ ለጥፍ", saveImg: "↓ ምስል አስቀምጥ", scored: "እንዴት ነጥብ ተሰጠ?", letsFind: "እንፈትሽ", handle: "የX ሃንድልህ", language: "ቋንቋ", recentAttempts: "የቅርብ ጊዜ ሙከራዎች" },
    yo: { chalkLine1: "Ṣe o jù lọ ju", chalkLine2: "akẹ́kọ̀ 5th grade", chalkLine3: "ni Alpha?", notSmarterThan: "Kò gbọ́n ju", continue: "Tẹ̀ síwájú", submit: "Firanṣẹ́", noCalc: "Kò sí kalkulẹ́tọ̀", sciCalc: "Kalkulẹ́tọ̀ sáyẹ́nsì OK", graphCalc: "Kalkulẹ́tọ̀ gráfì OK", placeholder: "Tẹ ọrọ̀ rẹ̀ sí...", performAt: "Awọn akẹ́kọ̀ Alpha ṣiṣẹ ni ipele", estGlobal: "Àkọlé {pct} ti àwọn èniyàn ayé kò le dé ipele yìí", dataMethod: "Dátà àti Mẹ́tódù", fullMethod: "Mẹ́tódù kíkún", playAgain: "Ṣere lẹẹkansi", postX: "Fi sílẹ̀ lori X", saveImg: "↓ Fi àwòrán pamọ́", scored: "Bawo ni a ṣe ṣe àkọlé?", letsFind: "Jẹ́ ká mọ̀", handle: "X handle rẹ", language: "Èdè", recentAttempts: "ÌGBẹ̀YÀWỌ LẸ́Ẹ̀KAN" },
    ig: { chalkLine1: "Ị dị nkọ karịa", chalkLine2: "nwa akwụkwọ 5th grade", chalkLine3: "na Alpha?", notSmarterThan: "Enweghị ọgụgụ karịa", continue: "Gaa n'ihu", submit: "Nyefee", noCalc: "Enweghị mgbako", sciCalc: "Mgbako sayensị OK", graphCalc: "Mgbako eserese OK", placeholder: "Pịnye azịza gị...", performAt: "Ụmụ akwụkwọ Alpha na-arụ ọrụ na ọkwa", estGlobal: "Ihe dị ka {pct} nke ndị bi n'ụwa enweghị ike iru ọkwa a", dataMethod: "Data na Usoro", fullMethod: "Usoro zuru ezu", playAgain: "Kpọọ ọzọ", postX: "Biputere na X", saveImg: "↓ Chekwa onyonyo", scored: "Kedu ka e si gụọ akara?", letsFind: "Ka anyị chọpụta", handle: "X handle gị", language: "Asụsụ", recentAttempts: "ỌRỊỌỌ ỌHỤRỤ" },
    ha: { chalkLine1: "Shin kana da hankali fiye da", chalkLine2: "ɗalibin aji 5", chalkLine3: "a Alpha?", notSmarterThan: "Ba shi da wayo fiye da", continue: "Ci gaba", submit: "Ɗauka", noCalc: "Babu kalkuleta", sciCalc: "Kalkuleta na kimiyya OK", graphCalc: "Kalkuleta na zane OK", placeholder: "Buga amsarka...", performAt: "Dalibai Alpha suna yin aiki a matakin", estGlobal: "Kimanin {pct} na al'ummar duniya ba za su iya kai matakin nan ba", dataMethod: "Bayanai da Hanyar", fullMethod: "Cikakken hanyar", playAgain: "Kunna sake", postX: "Buga akan X", saveImg: "↓ Ajiye hoto", scored: "Yaya aka ƙidaya?", letsFind: "Mu gano", handle: "X handle naka", language: "Harshe", recentAttempts: "ƘOƘARIN KUSA" },
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
    $('[for="lang-select"]').textContent = t("language");
    $("#free-input").placeholder = t("placeholder");
    $("#btn-submit-free").textContent = t("submit");
    $("#gt-continue").textContent = t("continue");
    renderLeaderboard();
  }

  $("#lang-select").addEventListener("change", applyLang);

  let authedUser = null;

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        authedUser = await res.json();
        $("#auth-prompt").classList.add("hidden");
        $("#auth-user").classList.remove("hidden");
        $("#auth-avatar").src = authedUser.avatar || "";
        $("#auth-handle").textContent = authedUser.handle;
        userHandle = authedUser.handle;
        $("#btn-start").disabled = false;
      } else if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        authedUser = { id: 0, handle: "@localhost", name: "Local Dev", avatar: "" };
        userHandle = "@localhost";
        $("#auth-prompt").classList.add("hidden");
        $("#auth-user").classList.remove("hidden");
        $("#auth-handle").textContent = "@localhost";
        $("#btn-start").disabled = false;
      }
    } catch (e) {}
  }


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

  let leaderboardData = [];

  function lbResult(grade, passedAll) {
    if (passedAll) return "Smarter than all!";
    const label = GRADE_LABELS[grade] || grade;
    return `${t("notSmarterThan")} ${label}`;
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) leaderboardData = await res.json();
    } catch (e) {}
    renderLeaderboard();
  }

  function buildLeaderboardHTML() {
    const medals = ["🥇", "🥈", "🥉"];
    if (leaderboardData.length === 0) {
      return '<div class="lb-empty">No attempts yet. Be the first!</div>';
    }
    let html = "";
    leaderboardData.forEach((entry, i) => {
      const rank = i + 1;
      const badge = rank <= 3 ? medals[rank - 1] : rank;
      const cls = rank <= 3 ? ` lb-top` : "";
      const isYou = authedUser && entry.handle === authedUser.handle;
      html += `
        <div class="lb-row${cls}${isYou ? " lb-you" : ""}">
          <span class="lb-rank">${badge}</span>
          <div class="lb-info">
            <span class="lb-handle">${entry.handle}${isYou ? " (you)" : ""}</span>
            <span class="lb-result">${lbResult(entry.grade_reached, entry.passed_all)}</span>
          </div>
        </div>`;
    });
    return html;
  }

  function renderLeaderboard() {
    $("#lb-rows").innerHTML = buildLeaderboardHTML();
    const resultsLb = $("#results-lb-rows");
    if (resultsLb) resultsLb.innerHTML = buildLeaderboardHTML();
  }

  fetchLeaderboard();
  checkAuth();

  // auto-run on load
  runChalkAnimation();

  // ═══════════ START ═══════════

  $("#btn-start").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!authedUser) return;

    currentLang = $("#lang-select").value;

    state = {
      gradeIdx: 0, qIdx: 0, expanded: false,
      gradeStrikes: 0, answers: [], streak: 0,
      bestStreak: 0, locked: false, ended: false,
    };
    exitShownThisQuiz = false;
    showScreen("quiz");
    lastShownGrade = null;
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

  const METHODOLOGY_TEXT = `Population base: 8.1 billion. Among children 5–17 (~2.3B), the World Bank estimates learning poverty at ~53% in low/middle-income countries. Among adults 18+ (~5.8B), PIAAC 2023 data shows ~25% of OECD adults score at Level 1 or below in numeracy. Globally, only ~44% of adults over 25 have completed upper secondary education.`;

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

  async function saveResults(highestPassed, passedAll, totalCorrect, totalQuestions) {
    if (!authedUser) return;
    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade_reached: highestPassed || "0",
          passed_all: passedAll,
          total_correct: totalCorrect,
          total_questions: totalQuestions,
          best_streak: state.bestStreak,
          language: currentLang,
          answers: state.answers,
        }),
      });
      fetchLeaderboard();
    } catch (e) {
      console.error("Failed to save results:", e);
    }
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

    // Lock the leaderboard until they share
    const lbWrapper = $("#results-lb-wrapper");
    if (lbWrapper) lbWrapper.classList.remove("unlocked");

    renderLeaderboard();

    if (passedAll && typeof confetti !== "undefined") {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
    }

    saveResults(highestPassed, passedAll, totalCorrect, state.answers.length);
  }

  // ═══════════ SHARE ═══════════

  const QUOTE_TWEET_URL = "https://x.com/AustinA_Way/status/2036211604984111577";

  $("#btn-share-x").addEventListener("click", () => {
    const { highestPassed } = computeGrade();
    const totalCorrect = state.answers.filter((a) => a.correct).length;
    const passedIdx = highestPassed ? QUIZ_GRADES.indexOf(highestPassed) : -1;
    const passedAll = passedIdx === QUIZ_GRADES.length - 1;
    const nextGrade = QUIZ_GRADES[passedIdx + 1];
    const nextInfo = nextGrade ? GRADE_INFO[nextGrade] : null;
    let text;
    if (passedAll) {
      text = `I just passed every grade at Alpha School 🎓\n\nTheir students are doing college-level calculus and I somehow kept up.\n\n${totalCorrect}/${state.answers.length} correct. Your turn 👇\n\n${QUOTE_TWEET_URL}`;
    } else if (!highestPassed) {
      text = `I just failed 1st grade at Alpha School 💀\n\nTheir 1st graders are doing ${GRADE_INFO["1"].performing} math. I couldn't keep up.\n\nNo way you do better 👇\n\n${QUOTE_TWEET_URL}`;
    } else {
      const failedAt = nextGrade ? GRADE_LABELS[nextGrade] : "???";
      const levelDesc = nextInfo ? `${nextInfo.performing} math` : "their curriculum";
      text = `I just failed ${failedAt} at Alpha School 😬\n\nTheir ${failedAt} students are doing ${levelDesc} and I couldn't keep up.\n\n${totalCorrect}/${state.answers.length} correct. Bet you can't beat me 👇\n\n${QUOTE_TWEET_URL}`;
    }
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "width=600,height=450");

    // Unlock leaderboard after sharing
    const lbWrapper = $("#results-lb-wrapper");
    if (lbWrapper) lbWrapper.classList.add("unlocked");
  });


  // ═══════════ EXIT-INTENT WARNING ═══════════

  let exitShownThisQuiz = false;
  const exitWarning = $("#exit-warning");
  const exitVignette = $("#exit-vignette");

  function isQuizActive() {
    return $("#screen-quiz").classList.contains("active") && !state.ended;
  }

  function getExitGradeLabel() {
    const prevIdx = state.gradeIdx - 1;
    if (prevIdx < 0) return GRADE_LABELS[QUIZ_GRADES[0]] || "1st Grade";
    return GRADE_LABELS[QUIZ_GRADES[prevIdx]] || QUIZ_GRADES[prevIdx];
  }

  function showExitWarning() {
    if (!isQuizActive() || exitShownThisQuiz) return;
    exitShownThisQuiz = true;
    $("#exit-warning-grade").textContent = getExitGradeLabel();
    exitWarning.classList.remove("hidden");
    exitVignette.classList.remove("active");
  }

  function hideExitWarning() {
    exitWarning.classList.add("hidden");
  }

  $("#exit-warning-stay").addEventListener("click", hideExitWarning);

  document.addEventListener("mouseleave", (e) => {
    if (e.clientY <= 0 && isQuizActive() && !exitShownThisQuiz) {
      showExitWarning();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isQuizActive() || exitShownThisQuiz) {
      exitVignette.classList.remove("active");
      return;
    }
    if (e.clientY < 50) {
      exitVignette.classList.add("active");
    } else {
      exitVignette.classList.remove("active");
    }
  });

  function beforeUnloadHandler(e) {
    if (isQuizActive()) {
      e.preventDefault();
      e.returnValue = "";
    }
  }
  window.addEventListener("beforeunload", beforeUnloadHandler);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && isQuizActive() && !exitShownThisQuiz) {
      exitShownThisQuiz = true;
    }
  });

})();
