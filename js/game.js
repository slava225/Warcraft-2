const elements = {
    chapter: document.getElementById('chapter'),
    mood: document.getElementById('mood'),
    time: document.getElementById('time'),
    sceneLabel: document.getElementById('scene-label'),
    sceneTitle: document.getElementById('scene-title'),
    dialogue: document.getElementById('dialogue'),
    choices: document.getElementById('choices'),
    playerName: document.getElementById('player-name'),
    confidence: document.getElementById('confidence'),
    sincerity: document.getElementById('sincerity'),
    affection: document.getElementById('affection'),
    confidenceBar: document.getElementById('confidence-bar'),
    sincerityBar: document.getElementById('sincerity-bar'),
    affectionBar: document.getElementById('affection-bar'),
    notes: document.getElementById('notes'),
    hint: document.getElementById('hint'),
    introOverlay: document.getElementById('intro-overlay'),
    nameInput: document.getElementById('name-input'),
    startBtn: document.getElementById('start-btn'),
    saveBtn: document.getElementById('save-btn'),
    restartBtn: document.getElementById('restart-btn')
};

const defaultState = {
    playerName: 'Гость',
    confidence: 50,
    sincerity: 50,
    affection: 50,
    notes: [],
    sceneId: 'intro',
    flags: {
        likesPoetry: false,
        prefersQuiet: false,
        sharedStory: false
    }
};

let state = structuredClone(defaultState);
let typewriterTimer = null;

const scenes = {
    intro: {
        chapter: 'Пролог',
        mood: 'Теплое',
        time: 'Вечер',
        label: 'Городской свет',
        title: 'Тихая кофейня на углу',
        text: ({ playerName }) => `${playerName} решает искать близость без спешки. Вечером ты заходишь в небольшую кофейню, где пахнет карамелью и дождём. За стойкой девушка поправляет книгу и улыбается.

«Привет. Ты здесь впервые?»`,
        hint: 'Попробуй выбрать тон, который отражает твой стиль общения. Он влияет на симпатию и уверенность.',
        choices: [
            {
                text: '«Привет. Здесь очень спокойно. Можно присесть рядом?»',
                next: 'gentle',
                effects: { affection: 8, sincerity: 6 }
            },
            {
                text: '«Да, я искал место, где можно подумать. Как тебя зовут?»',
                next: 'direct',
                effects: { confidence: 6, affection: 4 }
            },
            {
                text: '«Привет. Я принёс с собой список любимых мест. Это место — новое открытие.»',
                next: 'playful',
                effects: { confidence: 4, sincerity: 3 }
            }
        ]
    },
    gentle: {
        chapter: 'Глава 1',
        mood: 'Нежное',
        time: 'Вечер',
        label: 'Первый диалог',
        title: 'Разговор у окна',
        text: () => `Она кивает и отодвигает чашку. «Меня зовут Лада. Люблю, когда люди сразу говорят, что им важно». За окном тихий дождь.`,
        hint: 'Слушай и задавай вопросы. Это повышает искренность.',
        choices: [
            {
                text: 'Спросить о её книге и почему она здесь.',
                next: 'book',
                effects: { sincerity: 8, affection: 5 }
            },
            {
                text: 'Поделиться, что тебе хочется найти отношения без давления.',
                next: 'honest',
                effects: { sincerity: 10, confidence: 4 }
            },
            {
                text: 'Предложить прогуляться после кофе.',
                next: 'walk',
                effects: { confidence: 6 }
            }
        ]
    },
    direct: {
        chapter: 'Глава 1',
        mood: 'Интригующее',
        time: 'Вечер',
        label: 'Поворот',
        title: 'Смелое знакомство',
        text: () => `«Я Лада», — улыбается она и сразу смотрит в глаза. «Редко встречаю людей, которые прямо спрашивают».`,
        hint: 'Смелость добавляет уверенности, но важно бережно оставаться искренним.',
        choices: [
            {
                text: 'Сказать, что ценишь честность и хочешь узнать её лучше.',
                next: 'honest',
                effects: { sincerity: 6, affection: 4 }
            },
            {
                text: 'Пошутить про то, что ты "профессиональный слушатель".',
                next: 'playful',
                effects: { confidence: 6 }
            },
            {
                text: 'Предложить выбрать музыку для атмосферы.',
                next: 'music',
                effects: { affection: 5 }
            }
        ]
    },
    playful: {
        chapter: 'Глава 1',
        mood: 'Лёгкое',
        time: 'Вечер',
        label: 'Лёгкий флирт',
        title: 'Список любимых мест',
        text: () => `Лада смеётся: «Список? Это неожиданно». Она наклоняется ближе, будто хочет заглянуть в твой блокнот.`,
        hint: 'Лёгкость хорошо работает, если подпитывать её вниманием к собеседнице.',
        choices: [
            {
                text: 'Показать список и предложить добавить её любимые места.',
                next: 'book',
                effects: { affection: 6, sincerity: 5 }
            },
            {
                text: 'Спросить, что для неё важнее — тишина или музыка.',
                next: 'music',
                effects: { sincerity: 4 }
            },
            {
                text: 'Открыто сказать, что хотел бы познакомиться ближе.',
                next: 'honest',
                effects: { confidence: 5, affection: 3 }
            }
        ]
    },
    book: {
        chapter: 'Глава 2',
        mood: 'Теплое',
        time: 'Поздний вечер',
        label: 'Общие темы',
        title: 'Литературная пауза',
        text: () => `Она рассказывает, что записывает короткие истории о людях в кафе. «Я люблю ловить момент, когда люди чуть доверяют друг другу».`,
        hint: 'Тонкие вопросы повышают симпатию. Можно поделиться личным опытом.',
        choices: [
            {
                text: 'Признаться, что ты тоже записываешь мысли, когда волнуешься.',
                next: 'shared',
                effects: { sincerity: 9, affection: 7, flags: { sharedStory: true } }
            },
            {
                text: 'Сказать, что любишь поэзию и предлагаешь обменяться цитатами.',
                next: 'poetry',
                effects: { affection: 8, flags: { likesPoetry: true } }
            },
            {
                text: 'Предложить выйти на улицу и посмотреть на дождь.',
                next: 'walk',
                effects: { confidence: 5 }
            }
        ]
    },
    music: {
        chapter: 'Глава 2',
        mood: 'Спокойное',
        time: 'Поздний вечер',
        label: 'Ритм',
        title: 'Музыка в наушниках',
        text: () => `Лада достаёт наушники. «Когда хочется подумать, я ставлю что-то инструментальное». Она протягивает один наушник.`,
        hint: 'Совместный ритуал создаёт близость. Это повышает симпатию.',
        choices: [
            {
                text: 'Согласиться и описать, какие чувства вызывает музыка.',
                next: 'shared',
                effects: { affection: 7, sincerity: 4 }
            },
            {
                text: 'Сказать, что тебе ближе тишина, но ты хочешь понять её.',
                next: 'quiet',
                effects: { sincerity: 6, flags: { prefersQuiet: true } }
            },
            {
                text: 'Вежливо отказаться и предложить позже вместе выбрать плейлист.',
                next: 'walk',
                effects: { confidence: 4 }
            }
        ]
    },
    honest: {
        chapter: 'Глава 2',
        mood: 'Искреннее',
        time: 'Поздний вечер',
        label: 'Открытость',
        title: 'Разговор без масок',
        text: ({ playerName }) => `«Я понимаю», — говорит Лада. «Иногда хочется, чтобы тебя видели без ожиданий». Она задерживает взгляд на ${playerName} чуть дольше.`,
        hint: 'Искренность повышает симпатию, но не забывай о лёгкости.',
        choices: [
            {
                text: 'Спросить, что ей важно в отношениях.',
                next: 'shared',
                effects: { sincerity: 6, affection: 6 }
            },
            {
                text: 'Рассказать о своём идеальном первом свидании.',
                next: 'dream',
                effects: { confidence: 4, affection: 4 }
            },
            {
                text: 'Предложить перенести разговор на прогулку.',
                next: 'walk',
                effects: { confidence: 5 }
            }
        ]
    },
    quiet: {
        chapter: 'Глава 3',
        mood: 'Созерцательное',
        time: 'Ночь',
        label: 'Тихий ритуал',
        title: 'Вкус молчания',
        text: () => `Вы сидите молча и слушаете, как капли стучат по стеклу. Лада улыбается: «С тобой не надо заполнять паузу».`,
        hint: 'Иногда молчание говорит больше. Добавь заметку, чтобы запомнить момент.',
        notes: ['Общая тишина'],
        choices: [
            {
                text: 'Сказать, что тебе нравится эта тишина.',
                next: 'final',
                effects: { affection: 8 }
            },
            {
                text: 'Предложить обменяться номерами, чтобы продолжить общение.',
                next: 'final',
                effects: { confidence: 6 }
            }
        ]
    },
    shared: {
        chapter: 'Глава 3',
        mood: 'Доверительное',
        time: 'Ночь',
        label: 'Общие истории',
        title: 'Сблизиться через слова',
        text: () => `Лада делится историей о том, как однажды почувствовала себя услышанной. Ты замечаешь, как вам легче дышать рядом.`,
        hint: 'Отмечай общие ценности. Они усилят симпатию.',
        notes: ['Важна честность', 'Любит истории'],
        choices: [
            {
                text: 'Сказать, что хочешь продолжить знакомство и назначить встречу.',
                next: 'final',
                effects: { affection: 6, confidence: 4 }
            },
            {
                text: 'Предложить обменяться заметками и написать друг другу завтра.',
                next: 'final',
                effects: { sincerity: 6 }
            }
        ]
    },
    poetry: {
        chapter: 'Глава 3',
        mood: 'Поэтичное',
        time: 'Ночь',
        label: 'Слова и чувства',
        title: 'Обмен цитатами',
        text: () => `Она записывает строку: «Тепло — это когда тебя слушают до конца». «Это про сегодня», — улыбается она.`,
        hint: 'Поэзия усиливает романтичность. Поддержи этот настрой.',
        notes: ['Любит поэзию'],
        choices: [
            {
                text: 'Ответить своей строкой и поблагодарить её.',
                next: 'final',
                effects: { affection: 8, sincerity: 4 }
            },
            {
                text: 'Предложить устроить совместный вечер чтения.',
                next: 'final',
                effects: { confidence: 5 }
            }
        ]
    },
    dream: {
        chapter: 'Глава 3',
        mood: 'Мечтательное',
        time: 'Ночь',
        label: 'Идеи',
        title: 'Образ будущего',
        text: () => `Ты описываешь мягкое свидание: прогулка, музыка, спокойный разговор. Лада кивает: «Это похоже на меня».`,
        hint: 'Совпадение мечт добавляет симпатию.',
        notes: ['Общие мечты'],
        choices: [
            {
                text: 'Предложить воплотить это уже на выходных.',
                next: 'final',
                effects: { affection: 6, confidence: 4 }
            },
            {
                text: 'Спросить, что бы она добавила к этой картине.',
                next: 'final',
                effects: { sincerity: 5 }
            }
        ]
    },
    walk: {
        chapter: 'Глава 3',
        mood: 'Свежесть',
        time: 'Ночь',
        label: 'Прогулка',
        title: 'Дождевые огни',
        text: () => `Вы выходите в прохладный воздух. Город светится отражениями. Лада идёт рядом и спрашивает: «Ты часто так знакомишься?»`,
        hint: 'Подчеркни, что тебе важна искренность. Это добавит доверия.',
        notes: ['Дождь как символ начала'],
        choices: [
            {
                text: 'Сказать, что ты выбираешь редкие, но важные встречи.',
                next: 'final',
                effects: { sincerity: 7 }
            },
            {
                text: 'Пошутить, что сегодня всё сложилось идеально.',
                next: 'final',
                effects: { affection: 5, confidence: 3 }
            }
        ]
    },
    final: {
        chapter: 'Финал',
        mood: 'Светлое',
        time: 'Ночь',
        label: 'Новая глава',
        title: 'Точка согласия',
        text: ({ playerName, affection, sincerity, confidence, flags }) => {
            const score = affection + sincerity + confidence;
            const tone = score > 190 ? 'очень тепло' : score > 160 ? 'надёжно' : 'мягко';
            const bonus = flags.likesPoetry
                ? ' Она обещает прислать тебе подборку стихов.'
                : flags.prefersQuiet
                    ? ' Она говорит, что ей нравится твоя спокойная энергия.'
                    : flags.sharedStory
                        ? ' Вы решаете обменяться заметками и продолжить общение.'
                        : ' Вы улыбаетесь и понимаете, что вечер удался.';
            return `${playerName}, вы завершаете вечер ${tone}. Лада соглашается на продолжение общения.${bonus}\n\nИстория может продолжиться, когда ты будешь готов.`;
        },
        hint: 'Сохрани этот момент и начни заново, чтобы открыть другие варианты.',
        choices: [
            {
                text: 'Сохранить и остаться в этом финале.',
                next: 'final',
                effects: {}
            },
            {
                text: 'Начать новую историю с другим настроем.',
                next: 'intro',
                effects: { reset: true }
            }
        ]
    }
};

const typeText = (text) => {
    clearTimeout(typewriterTimer);
    elements.dialogue.textContent = '';
    elements.dialogue.classList.add('typewriter');
    let index = 0;

    const step = () => {
        elements.dialogue.textContent = text.slice(0, index);
        index += 1;
        if (index <= text.length) {
            typewriterTimer = setTimeout(step, 18);
        } else {
            elements.dialogue.classList.remove('typewriter');
        }
    };

    step();
};

const updateStats = () => {
    elements.playerName.textContent = state.playerName;
    elements.confidence.textContent = state.confidence;
    elements.sincerity.textContent = state.sincerity;
    elements.affection.textContent = state.affection;
    elements.confidenceBar.style.width = `${state.confidence}%`;
    elements.sincerityBar.style.width = `${state.sincerity}%`;
    elements.affectionBar.style.width = `${state.affection}%`;
};

const updateNotes = () => {
    elements.notes.innerHTML = '';
    if (state.notes.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'tag';
        empty.textContent = 'Пока пусто';
        elements.notes.appendChild(empty);
        return;
    }

    state.notes.forEach((note) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = note;
        elements.notes.appendChild(tag);
    });
};

const clampStats = () => {
    state.confidence = Math.min(100, Math.max(0, state.confidence));
    state.sincerity = Math.min(100, Math.max(0, state.sincerity));
    state.affection = Math.min(100, Math.max(0, state.affection));
};

const applyEffects = (effects = {}) => {
    if (effects.reset) {
        state = structuredClone({ ...defaultState, playerName: state.playerName });
        return;
    }

    state.confidence += effects.confidence ?? 0;
    state.sincerity += effects.sincerity ?? 0;
    state.affection += effects.affection ?? 0;

    if (effects.flags) {
        state.flags = { ...state.flags, ...effects.flags };
    }

    clampStats();
};

const renderScene = (sceneId) => {
    const scene = scenes[sceneId];
    if (!scene) return;

    state.sceneId = sceneId;
    elements.chapter.textContent = scene.chapter;
    elements.mood.textContent = scene.mood;
    elements.time.textContent = scene.time;
    elements.sceneLabel.textContent = scene.label;
    elements.sceneTitle.textContent = scene.title;
    elements.hint.textContent = scene.hint;

    if (scene.notes) {
        scene.notes.forEach((note) => {
            if (!state.notes.includes(note)) {
                state.notes.push(note);
            }
        });
    }

    const dialogueText = typeof scene.text === 'function' ? scene.text(state) : scene.text;
    typeText(dialogueText);

    elements.choices.innerHTML = '';
    scene.choices.forEach((choice) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice.text;
        button.addEventListener('click', () => {
            applyEffects(choice.effects);
            updateStats();
            updateNotes();
            renderScene(choice.next);
        });
        elements.choices.appendChild(button);
    });
};

const saveGame = () => {
    localStorage.setItem('quiet-novel-state', JSON.stringify(state));
};

const loadGame = () => {
    const saved = localStorage.getItem('quiet-novel-state');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
    }
};

const startGame = () => {
    elements.introOverlay.classList.remove('active');
    updateStats();
    updateNotes();
    renderScene(state.sceneId);
};

const init = () => {
    loadGame();
    elements.introOverlay.classList.add('active');
    elements.nameInput.value = state.playerName === 'Гость' ? '' : state.playerName;

    elements.startBtn.addEventListener('click', () => {
        const name = elements.nameInput.value.trim();
        state.playerName = name.length ? name : 'Гость';
        updateStats();
        saveGame();
        startGame();
    });

    elements.saveBtn.addEventListener('click', () => {
        saveGame();
        elements.saveBtn.textContent = 'Сохранено!';
        setTimeout(() => {
            elements.saveBtn.textContent = 'Сохранить';
        }, 1200);
    });

    elements.restartBtn.addEventListener('click', () => {
        state = structuredClone(defaultState);
        state.playerName = 'Гость';
        localStorage.removeItem('quiet-novel-state');
        elements.nameInput.value = '';
        elements.introOverlay.classList.add('active');
    });

    if (state.playerName !== 'Гость') {
        startGame();
    }
};

init();
