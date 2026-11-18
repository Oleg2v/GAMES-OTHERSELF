// All player-visible copy. Unicode source is UTF-8; no runtime CDN or translation service.
export const languages = [
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'he', name: 'עברית', dir: 'rtl' },
];

const copy = {
  brand: ['KIKKEY GAMES', 'KIKKEY GAMES', 'KIKKEY GAMES'],
  episode: ['ЭПИЗОД 01 · ПОСЛЕДНИЙ ОГОНЬ', 'EPISODE 01 · THE LAST LIGHT', 'פרק 01 · האור האחרון'],
  title: ['ЧУЖОЕ ТЕЛО', 'OTHERSELF', 'גוף אחר'],
  subtitle: ['Последний огонь', 'The last light', 'האור האחרון'],
  tagline: ['Маленькое тело. Чужие возможности.', 'Small footsteps. Borrowed possibilities.', 'גוף קטן. אפשרויות חדשות.'],
  intro: ['Этой ночью оранжерею закроют. Последний челнок ещё ждёт. Найди путь к морю — в своих и чужих шагах.', 'Tonight, the greenhouse closes. The last shuttle is still waiting. Find your way to the sea — in your own footsteps, and someone else’s.', 'הלילה יסגרו את החממה. המעבורת האחרונה עדיין מחכה. מצאו דרך אל הים — בצעדים שלכם, וגם של אחרים.'],
  begin: ['Начать путешествие', 'Begin the journey', 'לצאת לדרך'],
  continue: ['Продолжить', 'Continue', 'להמשיך'],
  newGame: ['Новое путешествие', 'New journey', 'מסע חדש'],
  settings: ['Настройки', 'Settings', 'הגדרות'],
  credits: ['Авторы и материалы', 'Credits & materials', 'יוצרים וחומרים'],
  back: ['Назад', 'Back', 'חזרה'],
  resume: ['Вернуться в игру', 'Resume', 'לחזור למשחק'],
  pause: ['Пауза', 'Pause', 'השהיה'],
  paused: ['Дождь подождёт.', 'The rain can wait.', 'הגשם יכול לחכות.'],
  retry: ['Повторить с укрытия', 'Retry from shelter', 'לנסות שוב מהמחסה'],
  exit: ['В главное меню', 'Main menu', 'לתפריט הראשי'],
  help: ['Как играть', 'How to play', 'איך משחקים'],
  controls: ['Управление', 'Controls', 'מקשים'],
  move: ['Двигаться', 'Move', 'תנועה'],
  action: ['Действие', 'Interact', 'פעולה'],
  possess: ['Вселиться', 'Possess', 'להיכנס לגוף'],
  return: ['Вернуться', 'Return', 'לחזור לגוף'],
  keeper: ['Смотритель', 'Gatekeeper', 'שומר'],
  tech: ['Техник', 'Technician', 'טכנאי'],
  nim: ['Ним', 'Nim', 'נים'],
  objective: ['Доберись до последнего челнока', 'Reach the last shuttle', 'להגיע למעבורת האחרונה'],
  room0: ['Тамбур наблюдений', 'Observation vestibule', 'מבואת התצפית'],
  room1: ['Мокрая сортировка', 'Wet sorting hall', 'אולם המיון הרטוב'],
  room2: ['Стеклянный сад', 'Glass garden', 'גן הזכוכית'],
  room3: ['Рейдовый причал', 'Roadstead dock', 'רציף המעגן'],
  room0desc: ['Ветер знает дорогу. Осталось открыть дверь.', 'The wind knows the way. You only need to open the door.', 'הרוח מכירה את הדרך. נשאר רק לפתוח את הדלת.'],
  room1desc: ['Из-под трапа доносятся два тихих удара.', 'Two soft knocks come from beneath the gangway.', 'שתי נקישות חלשות נשמעות מתחת לכבש.'],
  room2desc: ['Через стекло видно всё. Пройти сквозь него нельзя.', 'You can see everything through glass. You cannot pass through it.', 'דרך הזכוכית רואים הכול. אי אפשר לעבור דרכה.'],
  room3desc: ['До моря осталась одна петля звонка.', 'One pull of the bell, and the sea is yours.', 'משיכה אחת בחבל הפעמון — והים שלכם.'],
  journal: ['Записки Нима', 'Nim’s journal', 'היומן של נים'],
  journal0: ['Я всю жизнь слушал дождь через стекло. Сегодня хочу узнать, какой он на ощупь. У смотрителя на руке тот же знак, что на двери.', 'I have listened to rain through glass all my life. Tonight, I want to know how it feels. The mark on the gatekeeper’s hand matches the one on the door.', 'כל חיי הקשבתי לגשם דרך הזכוכית. הלילה אני רוצה לדעת איך הוא מרגיש. הסימן על היד של השומר זהה לסימן שעל הדלת.'],
  journal1: ['Из бокса под трапом дважды постучали. Парусники живут на тёплом воздухе. На челноке им найдётся место.', 'Something knocked twice from the crate beneath the gangway. Sail creatures live on warm air. There will be room for them on the shuttle.', 'משהו הקיש פעמיים מתוך הארגז שמתחת לכבש. יצורי המפרש חיים באוויר חמים. יהיה להם מקום במעבורת.'],
  journal2: ['Стекло пропускает взгляд, но не меня. Нужно найти настоящий проём. Тележка достаточно велика, чтобы скрыть моё маленькое тело.', 'Glass lets my gaze through, but not me. I need a real opening. The cart is big enough to hide my little body.', 'הזכוכית נותנת למבט שלי לעבור, אבל לא לי. אני צריך פתח אמיתי. העגלה גדולה מספיק כדי להסתיר את הגוף הקטן שלי.'],
  journal3: ['Там, за туманом, берег. До звонка я ещё могу вернуться. А потом — впервые услышать дождь без стекла.', 'Beyond the fog lies the shore. Until I ring the bell, I can still go back. Then, for the first time, I will hear rain without glass between us.', 'מעבר לערפל נמצא החוף. עד שאצלצל בפעמון, עוד אוכל לחזור. ואז, בפעם הראשונה, אשמע את הגשם בלי זכוכית בינינו.'],

  saved: ['Путь сохранён', 'Journey saved', 'המסע נשמר'],
  saveError: ['Не удалось сохранить на этом устройстве. Можно продолжать играть.', 'This device could not save your progress. You can keep playing.', 'לא ניתן לשמור את ההתקדמות במכשיר הזה. אפשר להמשיך לשחק.'],
  loading: ['Открываем станцию…', 'Opening the station…', 'פותחים את התחנה…'],
  error: ['Станция не отвечает', 'The station is not responding', 'התחנה אינה מגיבה'],
  retryLoading: ['Загрузить снова', 'Try loading again', 'לנסות לטעון שוב'],
  noWebGL: ['Браузер не смог запустить трёхмерную сцену. Включите аппаратное ускорение или откройте игру в браузере с WebGL.', 'Your browser could not start the 3D scene. Enable hardware acceleration or open the game in a WebGL-capable browser.', 'הדפדפן לא הצליח להפעיל את הסצנה התלת־ממדית. הפעילו האצת חומרה או פתחו את המשחק בדפדפן שתומך ב־WebGL.'],
  contextLost: ['Графика временно недоступна. Игра приостановлена; попробуйте загрузить сцену снова.', 'Graphics are temporarily unavailable. The game is paused; try reloading the scene.', 'התצוגה הגרפית אינה זמינה כרגע. המשחק הושהה; נסו לטעון את הסצנה מחדש.'],
  music: ['Музыка', 'Music', 'מוזיקה'],
  effects: ['Окружение и эффекты', 'Ambience & effects', 'סביבה ואפקטים'],
  mute: ['Без звука', 'Mute', 'השתקה'],
  quality: ['Качество графики', 'Graphics quality', 'איכות הגרפיקה'],
  high: ['Высокое', 'High', 'גבוהה'],
  low: ['Экономное', 'Low', 'חסכונית'],
  reducedMotion: ['Меньше движения', 'Reduced motion', 'הפחתת תנועה'],
  sound: ['Звук', 'Sound', 'צליל'],
  language: ['Язык', 'Language', 'שפה'],
  close: ['Закрыть', 'Close', 'סגירה'],
  rescueCount: ['Парусники: {count} / 2', 'Sail creatures: {count} / 2', 'יצורי מפרש: {count} / 2'],
  ending0title: ['Одна капля. Целое море.', 'One drop. An entire sea.', 'טיפה אחת. ים שלם.'],
  ending0body: ['Ним ловит первую дождевую каплю у открытого люка. Он стучит пальцем по борту. В ответ — только море. Сегодня он выбрался. Завтра научится жить.', 'Nim catches his first raindrop at the open hatch. He taps the hull. Only the sea answers. Today, he escaped. Tomorrow, he learns to live.', 'נים תופס את טיפת הגשם הראשונה ליד הפתח הפתוח. הוא מקיש על הדופן. רק הים עונה לו. היום הוא יצא לחופשי. מחר ילמד לחיות.'],
  ending1title: ['Теперь вас двое.', 'Now there are two of you.', 'עכשיו אתם שניים.'],
  ending1body: ['В посадочной сетке раскрывается один плавник. Ним стучит по борту, и тонкий голос отвечает ему. Моря хватит на двоих.', 'A fin unfurls in the boarding net. Nim taps the hull, and a small voice answers. There is enough sea for two.', 'סנפיר נפרש ברשת העלייה למעבורת. נים מקיש על הדופן, וקול דק עונה לו. יש די ים לשניים.'],
  ending2title: ['Никто не остался слушать дождь.', 'No one was left listening to the rain.', 'אף אחד לא נשאר להקשיב לגשם.'],
  ending2body: ['Два парусника расправляют плавники в тёплом воздухе. На стук Нима отвечают два разных голоса. За кормой гаснет станция. Впереди — берег.', 'Two sail creatures spread their fins in the warm air. Two different voices answer Nim’s tap. The station fades behind them. Ahead lies the shore.', 'שני יצורי המפרש פורשים סנפירים באוויר החמים. שני קולות שונים עונים לנקישה של נים. התחנה כבה מאחוריהם. החוף מחכה מלפנים.'],
  won: ['Путь к морю открыт', 'The way to the sea is open', 'הדרך אל הים פתוחה'],
  lost: ['Тебя заметили', 'You were seen', 'גילו אותך'],
  lostBody: ['Охрана нашла тело Нима', 'The guards found Nim’s body', 'השומרים מצאו את הגוף של נים'],
  lostNim: ['Ним слишком долго оставался на виду', 'Nim stayed in sight for too long', 'נים נשאר גלוי זמן רב מדי'],
  deathDetail: ['{role} · {room}', '{role} · {room}', '{role} · {room}'],
  playAgain: ['Пройти ещё раз', 'Play again', 'לשחק שוב'],
  brandGame: ['Игра для моего бренда', 'A game for my brand', 'משחק למותג שלי'],
  gameProject: ['Разработать игровой проект', 'Develop a game project', 'פיתוח פרויקט משחק'],
  contact: ['Обсудить игру с Kikkey', 'Talk games with Kikkey', 'לדבר עם Kikkey על משחק'],
  demo: ['Авторское демо Kikkey Games', 'An original Kikkey Games demo', 'דמו מקורי של Kikkey Games'],
  instructionMove: ['Иди стрелками или A / D. Ним сам пригнётся в низком проходе.', 'Walk with the arrows or A / D. Nim ducks through low passages automatically.', 'זזים עם החצים או A / D. נים מתכופף אוטומטית במעברים נמוכים.'],
  instructionAction: ['E — действие рядом с механизмом, боксом или выходом.', 'E — interact with a nearby mechanism, crate or exit.', 'E — פעולה ליד מנגנון, ארגז או יציאה.'],
  instructionPossess: ['Q — вселиться в сотрудника перед Нимом. Двойная дуга показывает цель.', 'Q — possess a worker in front of Nim. A double arc marks the target.', 'Q — להיכנס לגוף של עובד שנמצא מול נים. קשת כפולה מסמנת את המטרה.'],
  instructionReturn: ['Q ещё раз — мгновенно вернуться. Оставь своё тело в укрытии.', 'Q again — return instantly. Leave your own body in shelter.', 'Q שוב — לחזור מיד. השאירו את הגוף שלכם במחסה.'],
  tip: ['Прислушайся', 'Listen closely', 'הקשיבו היטב'],
  tip0: ['У Нима нет пропуска. У смотрителя есть. Спрячься под стойкой и посмотри в его сторону.', 'Nim has no pass. The gatekeeper does. Shelter beneath the counter and face him.', 'לנים אין אישור מעבר. לשומר יש. הסתתרו מתחת לדלפק ופנו אליו.'],
  tip1: ['Ладонь открывает калитку. Шестерёнка раскладывает крытый трап. Под ним кто-то ждёт.', 'The hand opens the gate. The gear unfolds a covered gangway. Someone is waiting underneath.', 'סמל היד פותח את השער. גלגל השיניים פורש כבש מקורה. מישהו מחכה מתחתיו.'],
  tip2: ['Одного взгляда мало: нужен открытый путь. Пройди вдоль стекла до настоящего проёма.', 'Seeing is not enough: you need an open path. Follow the glass to the real opening.', 'לא מספיק לראות: צריך מעבר פתוח. המשיכו לאורך הזכוכית עד לפתח האמיתי.'],
  tip3: ['До звонка ещё можно вернуться за парусниками. Отчалить может только Ним.', 'You can still go back for the sail creatures before ringing the bell. Only Nim can cast off.', 'עד הצלצול בפעמון אפשר לחזור להציל את יצורי המפרש. רק נים יכול להוציא את המעבורת לדרך.'],
  gate: ['Открыть калитку', 'Open gate', 'לפתוח שער'],
  bridge: ['Запустить привод', 'Start mechanism', 'להפעיל מנגנון'],
  rescue: ['Открыть бокс', 'Open crate', 'לפתוח ארגז'],
  depart: ['Потянуть звонок', 'Pull the bell', 'למשוך בפעמון'],
  nextRoom: ['В следующий зал', 'Next hall', 'לאולם הבא'],
  previousRoom: ['Вернуться назад', 'Previous hall', 'לאולם הקודם'],
  needKeeper: ['Нужен пропуск смотрителя', 'Requires the gatekeeper’s pass', 'דרוש כרטיס הגישה של השומר'],
  needTech: ['Нужна перчатка техника', 'Requires the technician’s glove', 'דרושה הכפפה של הטכנאי'],
  needNim: ['Здесь может пройти только Ним', 'Only Nim can pass here', 'רק נים יכול לעבור כאן'],
  noTarget: ['Посмотри на сотрудника поближе', 'Face a worker within reach', 'פנו אל עובד שנמצא בטווח'],
  blocked: ['Путь перекрыт', 'The path is blocked', 'הדרך חסומה'],
  possessed: ['Ты в чужом теле', 'You are in another body', 'אתם בגוף אחר'],
  returned: ['Ты снова Ним', 'You are Nim again', 'אתם שוב נים'],
  gateOpened: ['Защёлка держит. Путь открыт.', 'The latch holds. The way is open.', 'הבריח נתפס. הדרך פתוחה.'],
  bridgeOpened: ['Привод завершит работу сам', 'The mechanism will finish on its own', 'המנגנון ישלים את הפעולה בעצמו'],
  rescued: ['Парусник летит к посадочной сетке', 'The sail creature flies to the boarding net', 'יצור המפרש עף אל רשת העלייה'],
  alarm: ['Кто-то услышал щелчок', 'Someone heard the click', 'מישהו שמע את הנקישה'],
  detected: ['Тебя видят. Уйди в укрытие.', 'You are in sight. Find cover.', 'רואים אותך. מצאו מחסה.'],
  recover: ['Сотрудник приходит в себя', 'The worker is recovering', 'העובד מתאושש'],
  target: ['Доступно вселение', 'Possession available', 'אפשר להיכנס לגוף'],
  bodyDanger: ['Тело Нима на виду', 'Nim’s body is exposed', 'הגוף של נים חשוף'],
  safe: ['В укрытии', 'In shelter', 'במחסה'],
  exposed: ['Вне укрытия', 'Out of shelter', 'מחוץ למחסה'],
  bodyResting: ['Тело Нима в укрытии', 'Nim’s body is sheltered', 'הגוף של נים במחסה'],
  bodyAt: ['Тело Нима · {x} м', 'Nim’s body · {x} m', 'הגוף של נים · {x} מ׳'],
  helpBody: ['Смотритель пользуется постами с ладонью, техник — с шестерёнкой. Вселение работает только перед Нимом, не дальше шести метров, и прерывается стеной или стеклом. Возврат работает отовсюду. Охране нужны две секунды непрерывного обзора, чтобы задержать Нима или его оставленное тело. Ниши укрывают, открытый пол — нет. Только Ним проходит низкие лазы и границы залов. Escape ставит игру на паузу.', 'The gatekeeper operates hand-marked posts; the technician uses gear-marked controls. Possession works only in front of Nim, within six metres; walls and glass interrupt it. You can return from anywhere. Guards need two seconds of uninterrupted sight to catch Nim or his abandoned body. Recesses conceal you; open floor does not. Only Nim can use low passages and cross between halls. Escape pauses the game.', 'השומר מפעיל עמדות עם סמל יד; הטכנאי מפעיל עמדות עם גלגל שיניים. אפשר להיכנס רק לגוף שנמצא מול נים, במרחק של עד שישה מטרים; קירות וזכוכית חוסמים את המעבר. אפשר לחזור מכל מקום. השומרים צריכים לראות את נים או את גופו העזוב במשך שתי שניות רצופות כדי לתפוס אותו. גומחות מסתירות אתכם; רצפה פתוחה לא. רק נים יכול לעבור במעברים נמוכים ובין אולמות. Escape משהה את המשחק.'],
  creditsBody: ['OTHERSELF — оригинальная игра Kikkey Games. Модели, мир и процедурная звуковая палитра созданы для этого эпизода. Технологии: Three.js (MIT), Vite (MIT), Blender (GPL). Исходники и сведения об ассетах включены в проект. Иврит не проходил отдельную проверку носителем языка.', 'OTHERSELF is an original Kikkey Games game. Models, world and procedural sound palette were made for this episode. Built with Three.js (MIT), Vite (MIT) and Blender (GPL). Source files and asset provenance are included in the project. Hebrew has not had a separate native-speaker review.', 'OTHERSELF הוא משחק מקורי של Kikkey Games. המודלים, העולם והצלילים הפרוצדורליים נוצרו עבור הפרק הזה. טכנולוגיות: Three.js ‏(MIT), Vite ‏(MIT), Blender ‏(GPL). קובצי המקור ומידע על החומרים כלולים בפרויקט. העברית טרם עברה בדיקה נפרדת של דוברי שפת אם.'],
  privacy: ['Прогресс хранится только в этом браузере. Без аккаунта и аналитики.', 'Progress stays in this browser. No account or analytics.', 'ההתקדמות נשמרת בדפדפן הזה בלבד. ללא חשבון או כלי מעקב.'],
  resetConfirm: ['Начать заново? Сохранённое путешествие будет заменено.', 'Start again? Your saved journey will be replaced.', 'להתחיל מחדש? המסע השמור יוחלף.'],
  cancel: ['Отмена', 'Cancel', 'ביטול'],
  openGate: ['Приложить пропуск', 'Use pass', 'להעביר כרטיס גישה'],
  deployBridge: ['Разложить крытый трап', 'Unfold covered gangway', 'לפרוש כבש מקורה'],
  moveCart: ['Запустить тележку', 'Start service cart', 'להפעיל עגלת שירות'],
  climb: ['На лестницу', 'Use ladder', 'לעלות בסולם'],
  blockedGate: ['Калитка заперта', 'The gate is locked', 'השער נעול'],
  possessedKeeper: ['В теле смотрителя. Ладонь откроет путь.', 'In the gatekeeper’s body. Your hand opens the way.', 'בגוף של השומר. היד שלכם תפתח את הדרך.'],
  possessedTech: ['В теле техника. Перчатка управляет приводами.', 'In the technician’s body. Your glove operates machinery.', 'בגוף של הטכנאי. הכפפה שלכם מפעילה את המנגנונים.'],
  bridgeMoving: ['Трап раскладывается. Можно возвращаться.', 'The gangway is unfolding. You can return now.', 'הכבש נפרש. אפשר כבר לחזור.'],
  cartMoving: ['Тележка закроет дорожку от чужих глаз', 'The cart will shield the path from prying eyes', 'העגלה תסתיר את השביל מעיניים זרות'],
  creatureRescued: ['Парусник свободен. Он найдёт челнок.', 'The sail creature is free. It will find the shuttle.', 'יצור המפרש חופשי. הוא ימצא את המעבורת.'],
  bodyFound: ['Охрана нашла тело Нима', 'The guards found Nim’s body', 'השומרים מצאו את הגוף של נים'],
  nimFound: ['Ним слишком долго оставался на виду', 'Nim stayed in sight for too long', 'נים נשאר גלוי זמן רב מדי'],
  carrierBoundary: ['Сотрудникам нельзя покидать свой зал. Вернись в тело Нима.', 'Workers must remain in their hall. Return to Nim’s body.', 'העובדים חייבים להישאר באולם שלהם. חזרו לגוף של נים.'],
  wrongRole: ['Этому посту нужна другая рука', 'This post needs a different hand', 'העמדה הזאת צריכה יד אחרת'],
  routeReady: ['Путь готов', 'The route is ready', 'הדרך מוכנה'],
  possessionStart: ['Держи цель в поле зрения…', 'Keep the target in sight…', 'שמרו על המטרה בטווח הראייה…'],
  possessionCancel: ['Связь прервалась. Найди открытый проём.', 'The link broke. Find an open passage.', 'הקשר נקטע. מצאו פתח פתוח.'],
  checkpoint: ['Безопасная точка сохранена', 'Safe checkpoint saved', 'נקודת מחסה נשמרה'],
  vestibule: ['Тамбур наблюдений', 'Observation vestibule', 'מבואת התצפית'],
  sorting: ['Мокрая сортировка', 'Wet sorting hall', 'אולם המיון הרטוב'],
  garden: ['Стеклянный сад', 'Glass garden', 'גן הזכוכית'],
  dock: ['Рейдовый причал', 'Roadstead dock', 'רציף המעגן'],
  endingWait: ['Наконец-то — берег…', 'At last, the coast…', 'סוף סוף, החוף…'],
  skipEnding: ['Продолжить', 'Continue', 'להמשיך'],
  endingBell: ['Звонок. Последний челнок отходит от станции.', 'The bell rings. The last shuttle leaves the station.', 'הפעמון מצלצל. המעבורת האחרונה עוזבת את התחנה.'],
  endingQuiet: ['На тихий стук Нима отвечает только прибой.', 'Only the surf answers Nim’s gentle tap.', 'רק רחש הגלים עונה לנקישה השקטה של נים.'],
  endingOneVoice: ['Из тёплой посадочной сетки отзывается один голос.', 'One small voice answers from the warm boarding net.', 'קול קטן אחד עונה מתוך רשת העלייה החמימה.'],
  endingTwoVoices: ['Один голос. Потом другой. Вы выбрались вместе.', 'One voice. Then another. You made it out together.', 'קול אחד. ואז עוד קול. יצאתם לחופשי יחד.'],
  bodyLocation: ['До тела Нима: {distance} м', 'Nim’s body: {distance} m away', 'הגוף של נים במרחק {distance} מ׳'],
  targetBlockedGlass: ['Стекло прерывает связь. Найди открытый проём.', 'Glass breaks the link. Find an open passage.', 'הזכוכית חוסמת את הקשר. מצאו פתח פתוח.'],
  targetBlockedMachine: ['Корпус механизма прерывает связь. Найди открытый пролёт.', 'The machine blocks the link. Find an open span.', 'המכונה חוסמת את הקשר. מצאו מעבר פתוח.'],
  targetOutOfRange: ['Сотрудник дальше шести метров. Подойди ближе к укрытию.', 'The worker is more than six metres away. Move to a closer shelter.', 'העובד נמצא במרחק של יותר משישה מטרים. התקרבו למחסה הבא.'],
  targetWrongPlane: ['Нужно оказаться на одном ярусе с сотрудником', 'Reach the same level as the worker', 'צריך להגיע לאותו מפלס שבו נמצא העובד'],
  heardTransition: ['Сотрудник услышал щелчок и идёт проверить', 'A worker heard the click and is coming to investigate', 'עובד שמע את הנקישה ובא לבדוק'],
  investigationFinished: ['Осмотр окончен. Сотрудник возвращается на обход.', 'The inspection is over. The worker returns to patrol.', 'הבדיקה הסתיימה. העובד חוזר לסיור.'],
  tutorialObserve: ['Маленькая рука не поднимет створку. Из-под решётчатой стойки посмотри на смотрителя и нажми Q.', 'Your small hand cannot lift the gate. Face the gatekeeper from beneath the grated counter and press Q.', 'היד הקטנה לא תצליח להרים את השער. פנו אל השומר מתוך המחסה שמתחת לדלפק המסורג ולחצו Q.'],
  tutorialLeave: ['Ты снова Ним. Открытая дверь ведёт в следующий зал — иди к свету у выхода.', 'You are Nim again. The open door leads to the next hall — follow the light at the exit.', 'אתם שוב נים. הדלת הפתוחה מובילה לאולם הבא — לכו אל האור שביציאה.'],
  tutorialOperate: ['В теле смотрителя подойди к считывателю с ладонью. Нажми E — пропуск откроет дверь.', 'Walk the gatekeeper to the hand-marked reader. Press E to open the door with his pass.', 'בגוף של השומר, גשו לקורא שמסומן ביד. לחצו E כדי לפתוח את הדלת בכרטיס הגישה שלו.'],
  tutorialMove: ['Сделай первый шаг. Иди к свету под стойкой.', 'Take your first step. Follow the light beneath the counter.', 'עשו צעד ראשון. לכו בעקבות האור שמתחת לדלפק.'],
  tutorialPossess: ['Посмотри на смотрителя. Двойная дуга — приглашение сменить тело.', 'Face the gatekeeper. The double arc means you can borrow his body.', 'פנו אל השומר. הקשת הכפולה מסמנת שאפשר להיכנס לגופו.'],
  tutorialGate: ['Теперь у тебя есть пропуск. Найди считыватель с ладонью.', 'You have a pass now. Find the hand-marked reader.', 'עכשיו יש לכם כרטיס גישה. מצאו את הקורא שמסומן ביד.'],
  tutorialReturn: ['Защёлка держит дверь. Нажми Q и вернись к Ниму — в следующий зал должен пройти он сам.', 'The latch holds the door open. Press Q to return to Nim — only he can enter the next hall.', 'הבריח מחזיק את הדלת פתוחה. לחצו Q כדי לחזור לנים — רק הוא יכול לעבור לאולם הבא.'],
  tutorialShelter: ['В нише тело скрыто. На открытом полу его могут заметить.', 'A recess conceals your body. On open floor, guards can see it.', 'הגומחה מסתירה את הגוף שלכם. על הרצפה הפתוחה השומרים יכולים לראות אותו.'],
  ending0: ['Море отвечает тишиной', 'The sea answers with silence', 'הים עונה בשקט'],
  ending1: ['Из сетки отвечает один голос', 'One voice answers from the net', 'קול אחד עונה מתוך הרשת'],
  ending2: ['Из сетки отвечают два голоса', 'Two voices answer from the net', 'שני קולות עונים מתוך הרשת'],
  audioUnavailable: ['Звук недоступен. Все важные сигналы видны на экране.', 'Audio is unavailable. All important signals remain visible.', 'הצליל אינו זמין. כל הסימנים החשובים מופיעים גם על המסך.'],
  contactBrand: ['Здравствуйте! Меня заинтересовала OTHERSELF. Хочу обсудить игру для моего бренда.', 'Hello! OTHERSELF caught my interest. I would like to discuss a game for my brand.', 'שלום! המשחק OTHERSELF עניין אותי. אשמח לדבר על משחק למותג שלי.'],
  contactProject: ['Здравствуйте! Хочу обсудить разработку игрового проекта с механикой вселения, как в OTHERSELF.', 'Hello! I would like to discuss a game project with a possession mechanic, like OTHERSELF.', 'שלום! אשמח לדבר על פיתוח משחק עם מכניקת מעבר בין גופים, כמו ב־OTHERSELF.'],
};

export const translations = Object.fromEntries(languages.map(({ code }, index) => [code,
  Object.fromEntries(Object.entries(copy).map(([key, values]) => [key, values[index]])),
]));
const parameters = text => [...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]).sort();
export function validateTranslations(dictionaries = translations) {
  const reference = dictionaries.en;
  if (!reference) throw new Error('Missing English dictionary');
  const keys = Object.keys(reference).sort();
  for (const { code } of languages) {
    const dictionary = dictionaries[code];
    if (!dictionary || JSON.stringify(Object.keys(dictionary).sort()) !== JSON.stringify(keys)) {
      throw new Error(`Translation keys differ: ${code}`);
    }
    for (const key of keys) {
      if (typeof dictionary[key] !== 'string' || !dictionary[key].trim()) throw new Error(`Missing translation: ${code}.${key}`);
      if (JSON.stringify(parameters(dictionary[key])) !== JSON.stringify(parameters(reference[key]))) {
        throw new Error(`Translation parameters differ: ${code}.${key}`);
      }
    }
  }
  return true;
}

export function t(lang, key, params = {}) {
  const locale = translations[lang] ? lang : 'en';
  const text = translations[locale][key] ?? translations.en[key];
  // Unknown keys remain conspicuous in development and never silently mask missing translations.
  if (typeof text !== 'string') return `[${key}]`;
  return text.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) => {
    if (!(name in params)) return match;
    const value = typeof params[name] === 'number' ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(params[name]) : String(params[name]);
    return locale === 'he' ? `\u2068${value}\u2069` : value;
  });
}

// QA helper: expand by 45% without corrupting parameters or splitting combining marks.
export function pseudo(text) {
  const graphemes = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)];
  return `［${text}${'·'.repeat(Math.ceil(graphemes.length * 0.45))}］`;
}
validateTranslations();
