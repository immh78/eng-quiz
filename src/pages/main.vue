<script setup>
import { database, ref as firebaseRef, get, update, set, auth } from "../config/firebase";
import { signOut } from 'firebase/auth';

import { ref, watch, onMounted, computed } from "vue";
import { useUserStore } from '../store/user';

let currUser = "";

const chapters = ref([]);
const toggleMode = ref("quiz");
const toggleChapter = ref("");
const words = ref([]);
const selectWords = ref([]);
const wrongWords = ref([]);
const meaningWrongWord = ref("");
const wordFontSize = ref(70);
const isMeaningView = ref(false);
const isMeaningWrongWordView = ref(false);
const isSetPopup = ref(false);
const isWrong = ref(false);
const currentWord = ref({ "word": "Loaing..." });
const correctCount = ref(0);
const wrongCount = ref(0);
const progress = ref(0);
const totalCount = ref(0);
const preCorrectWord = ref({});
const preWrongWord = ref({});
const isChoiceMode = ref(false);
const choiceMeanings = ref([]);
const checkWords = ref([]);
const books = ref([]);
const selectBook = ref('');
const tooltipQuizVisible = ref(false);
const tooltipMemorizeVisible = ref(false);
const tooltipCheckVisible = ref(false);
const userStore = useUserStore();
const userName = ref('');
const uid = ref('');

const isCheckWord = computed(() =>
    checkWords.value.some(item => item.word === currentWord.value.word)
);


/* DB 관련 변수 */
const quizChapters = ref(null);
const error = ref(null);



function selectingWord(param) {
    if (toggleMode.value == "quiz") {
        selectWords.value = words.value.filter(item => chapters.value.includes(item.chapter));
    } else if (toggleMode.value == "check") {
        selectWords.value = checkWords.value;
    } else {
        selectWords.value = words.value.filter(item => item.chapter === param);
    }

    totalCount.value = selectWords.value.length;
}

function changeMode() {
    initValue();

    if (toggleMode.value == "quiz" || toggleMode.value == "check") {
        toggleChapter.value = "";
        selectingWord(toggleMode.value);
        pickRandomWord();
        if (isChoiceMode) makeChoiceMeaning();
    }

    switch (toggleMode.value) {
        case "quiz":
            showTooltip(tooltipQuizVisible);
            break;
        case "memorize":
            showTooltip(tooltipMemorizeVisible);
            break;
        case "check":
            showTooltip(tooltipCheckVisible);
            break;
    }

}

function changeChapter(param) {
    initValue();
    selectingWord(param);
    pickRandomWord();
    if (isChoiceMode) makeChoiceMeaning();
}

function pickRandomWord() {
    if (selectWords.value.length === 0) {
        currentWord.value.wrongCount = 0;
        currentWord.value.word = "완료!";
        currentWord.value.meaning = "모든 단어를 외웠습니다.";
        return;
    }

    isMeaningView.value = false;

    let index = 0;
    if (toggleMode.value != "memorize") {
        index = Math.floor(Math.random() * selectWords.value.length);
    } else {
        index = 0;
    }
    currentWord.value = { ...selectWords.value[index] };
    setWordFondSize(currentWord.value.word);
}

function setWordFondSize(text) {
    let tempFontSize = 70;

    if (text.length > 8) {
        tempFontSize -= (text.length - 7) * 10;
    }

    if (tempFontSize < 40) {
        wordFontSize.value = 40;
    } else {
        wordFontSize.value = tempFontSize;
    }
}

function markCorrect() {
    if (selectWords.value.length === 0) return;

    correctCount.value++;
    selectWords.value = selectWords.value.filter(item => item.word !== currentWord.value.word);

    if (currentWord.value.wrongCount > 0) {
        wrongWords.value = wrongWords.value.filter(item => item.word !== currentWord.value.word);
    }
    //console.log("mode", toggleMode.value)

    // if (toggleMode.value === 'check') {
    //     checkWords.value.splice(currentWord.value.key, 1);
    //     saveCheckWord();

    //     Object.keys(checkWords.value).forEach(key => {
    //         checkWords.value[key]["key"] = Number(key);
    //     });

    // }

    preCorrectWord.value = { ...currentWord.value };

    //console.log("#1", preCorrectWord.value);

    pickRandomWord();
    if (isChoiceMode) makeChoiceMeaning();
    updateProgress();
}

function markWrong() {
    if (selectWords.value.length === 0) return;
    wrongCount.value++;

    if (toggleMode.value == "memorize") {
        const firstElement = selectWords.value.shift(); // Remove the first element
        firstElement.wrongCount += 1;
        selectWords.value.push(firstElement);
    } else {
        selectWords.value.find(item => item.word === currentWord.value.word).wrongCount += 1;
    }

    if (!wrongWords.value.some(item => item.word === currentWord.value.word)) {
        wrongWords.value.push(currentWord.value);
    }

    //console.log("#2", currentWord.value);
    preWrongWord.value = { ...currentWord.value };

    pickRandomWord();
    if (isChoiceMode) makeChoiceMeaning();
}

function cancelCorrect() {
    //console.log("#3", preCorrectWord.value);
    if (Object.keys(preCorrectWord.value).length === 0) return;
    correctCount.value--;
    currentWord.value = { ...preCorrectWord.value };
    selectWords.value.push(preCorrectWord.value);
    preCorrectWord.value = {};
    setWordFondSize(currentWord.value.word);
    updateProgress();
}

function cancelWrong() {
    if (Object.keys(preWrongWord.value).length === 0) return;
    wrongCount.value--;
    currentWord.value = { ...preWrongWord.value };
    selectWords.value.push(preWrongWord.value);
    wrongWords.value = wrongWords.value.filter(item => item.word !== preWrongWord.value.word);
    preWrongWord.value = {};
    setWordFondSize(currentWord.value.word);
    updateProgress();
}

function updateProgress() {
    progress.value = Math.round(((totalCount.value - selectWords.value.length) / totalCount.value) * 100);
}

function speechWord() {
    const utterance = new SpeechSynthesisUtterance(currentWord.value.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

function initValue() {
    correctCount.value = 0;
    wrongCount.value = 0;
    currentWord.value.word = "";
    currentWord.value.meaning = "";
    currentWord.value.wrongCount = 0;
    progress.value = 0;
    isMeaningView.value = false;
    wrongWords.value = [];
    selectWords.value = [];
    choiceMeanings.value = [];
    preCorrectWord.value = {};
}

function showMeaningWrongWord(param) {
    meaningWrongWord.value = param;
    isMeaningWrongWordView.value = true;
}


async function saveQuizChapter(data) {
    try {
        const dbRef = firebaseRef(database, "eng-quiz/chapter");
        await update(dbRef, data); // 데이터를 저장
        console.log("Data saved successfully!");
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

async function selectChapter(user) {
    const dbRef = firebaseRef(database, "eng-quiz");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                quizChapters.value = data.chapter;
                checkWords.value = data.check?.[uid.value] || [];

                books.value = [...new Set(
                    Object.values(quizChapters.value)
                        .filter(item => item.user === user)
                        .map(item => item.book))];

                selectBook.value = books.value[0];

            } else {
                console.log("No data available");
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            error.value = err.message;
        });

    //console.log(user);

    if (quizChapters.value) {
        chapters.value = Object.keys(quizChapters.value).filter(key => quizChapters.value[key].select && quizChapters.value[key].user === user);
    }
}

function toggleCheckWord(currWord, isExist) {
    if (isExist) {
        const index = checkWords.value.findIndex(item => item.word === currWord.word);
        if (index !== -1) {
            checkWords.value.splice(index, 1);
        }

    } else {
        checkWords.value.push({ ...currWord });
    }
    saveCheckWord();
}

async function saveCheckWord() {
    const data = checkWords.value;
    //console.log("saveCheckWord", data);
    try {
        const dbRef = firebaseRef(database, `eng-quiz/check/${uid.value}`);
        await set(dbRef, data); // 데이터를 저장
        console.log("Data saved successfully!");
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

async function logout() {
    await signOut(auth);
    userStore.clearUser();
    //router.push('/login');
};


// async function deleteCheckWord(key) {
//     try {
//         const dbRef = firebaseRef(database, `eng-quiz/check/${currUser}/${key}`);
//         await remove(dbRef); // 데이터를 저장
//         console.log("Data saved successfully!");
//     } catch (err) {
//         console.error("Error saving data:", err);
//     }

// }

function resetChapter() {

    for (const key in quizChapters.value) {
        const item = quizChapters.value[key];
        if (item.user === currUser && item.select) {
            item.select = false;
            const saveData = { [key]: { "select": false, "user": currUser, "book": item.book } };
            //console.log("saveData", saveData);
            saveQuizChapter(saveData);
        }
    }
    //console.log("quizChapters.value", quizChapters.value);
    chapters.value = [];
}

// Watcher 설정
watch(chapters, (newValue, oldValue) => {
    if (Object.keys(oldValue).length === 0) return;

    //console.log("new", newValue);
    //console.log("old", oldValue);

    const addedValues = newValue.filter(value => !oldValue.includes(value));
    const removedValues = oldValue.filter(value => !newValue.includes(value));

    let action = null;
    let chapter = "";

    // 추가된 값과 삭제된 값에 따라 로직 실행
    if (addedValues.length > 0) {
        chapter = addedValues[0];
        action = true;
    }
    if (removedValues.length > 0) {
        action = false;
        chapter = removedValues[0];
    }

    if (action != null) {
        const saveData = { [chapter]: { "select": action, "user": currUser, "book": quizChapters.value[chapter].book } };
        quizChapters.value[chapter].select = action;
        saveQuizChapter(saveData);
    }
});

function makeChoiceMeaning() {
    choiceMeanings.value = [];
    choiceMeanings.value.push({ "meaning": currentWord.value.meaning, "isCorrect": true });

    for (let i = 0; i < 4; i++) {
        choiceMeanings.value.push({ "meaning": getRandomMeaning(), "isCorrect": false });
    }

    choiceMeanings.value = shuffleArray(choiceMeanings.value);
    //console.log(choiceMeanings.value);
}

function getRandomMeaning() {
    const paramWords = words.value.filter(item => item.word !== currentWord.value.word);
    const index = Math.floor(Math.random() * paramWords.length);
    return paramWords[index].meaning;
}

function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function onclick_meaning(isCorrect) {
    if (isCorrect) {
        markCorrect();
    } else {
        isWrong.value = true;
        await sleep(1000)
        isWrong.value = false;
        markWrong();

    }
}

function getNewKey(list) {
    let key = 0;
    if (list) {
        const keys = Object.keys(list).map(Number); // 문자열이 아닌 숫자로 변환
        // 0부터 순차적으로 증가하며 비어있는 값을 찾기
        while (keys.includes(key)) {
            key++;
        }
    } else {
        key = 0;
    }

    return key;
}

async function onClickHint() {
    makeChoiceMeaning();
    //console.log("힌트", choiceMeanings.value)
    isChoiceMode.value = true;
    await sleep(3000);
    isChoiceMode.value = false;
}

function showTooltip(Obj) {
    tooltipQuizVisible.value = false;
    tooltipMemorizeVisible.value = false;
    tooltipCheckVisible.value = false;

    Obj.value = true

    // 2초 후 자동으로 닫기
    setTimeout(() => {
        Obj.value = false
    }, 2000)
}

async function selectUserInfo() {
    uid.value = userStore.user.uid === 'Pd3M2l2WV8PGI8duqyOLZMMH6Dn1' ? 'dofQjw5EhyZ3zOxOdGASyQUSKFE2' : userStore.user.uid;
    //Pd3M2l2WV8PGI8duqyOLZMMH6Dn1 : 문명훈
    //dofQjw5EhyZ3zOxOdGASyQUSKFE2 : 문채원

    const dbRef = firebaseRef(database, `user/${uid.value}`);
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                userName.value = data.name;
            } else {
                console.log("No data available");
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            error.value = err.message;
        });

}

onMounted(async () => {
    if (window.location.href.includes('/gw')) {
        currUser = "GW";
    } else {
        currUser = "CW";
    }

    await selectUserInfo();

    await selectChapter(currUser);

    const wordsFilePath = 'words.json';

    await fetch(wordsFilePath)
        .then(response => response.json())
        .then(data => {
            words.value = data.map(item => ({
                ...item,
                wrongCount: 0
            }));

        });

    selectingWord('');
    pickRandomWord();
})

</script>

<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4"> <!--image="https://picsum.photos/1920/1080?random-->
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <template v-slot:append>
                    <v-btn icon="mdi-cog" @click="isSetPopup = true"></v-btn>
                </template>

                <v-app-bar-title><v-icon @click="logout()">mdi-book</v-icon> {{ userName }}'s 영어 단어장</v-app-bar-title>
            </v-app-bar>
            <v-container>
                <v-row justify="center">
                    <v-col cols="auto">
                        <v-btn-toggle v-model="toggleMode" variant="outlined" color="primary" mandatory>
                            <v-tooltip color="pink" location="bottom" text="학습단원의 단어들이 무작위로 나타납니다."
                                :open-on-hover="false" open-on-click v-model="tooltipQuizVisible">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" value="quiz" density="compact" @click="changeMode()">
                                        <span>퀴즈</span>
                                    </v-btn>
                                </template>
                            </v-tooltip>
                            <v-tooltip location="bottom" text="선택한 단원의 단어를 순차적으로 나타냅니다." :open-on-hover="false"
                                open-on-click v-model="tooltipMemorizeVisible">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" value="memorize" density="compact" @click="changeMode()">
                                        <span>암기</span>
                                    </v-btn>
                                </template>
                            </v-tooltip>
                            <v-tooltip location="bottom" text="체크한 단어를 무작위로 나타냅니다." :open-on-hover="false" open-on-click
                                v-model="tooltipCheckVisible">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" value="check" density="compact" @click="changeMode()">
                                        <span>체크</span><small>({{ checkWords?.length || 0 }})</small>
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </v-btn-toggle>
                    </v-col>
                    <v-col class="d-flex justify-end">
                        <div class="d-flex flex-column align-center">
                            <span style="font-size: 12px; color: gray;">객관식</span>
                            <v-switch v-model="isChoiceMode" color="red" hide-details
                                @click="makeChoiceMeaning()"></v-switch>
                        </div>
                    </v-col>
                </v-row>
                <v-row justify="center">
                    <v-col cols="auto">
                        <v-btn-toggle v-model="toggleChapter" color="deep-purple-accent-3" rounded="0" group
                            class="multi-line-btn-toggle">
                            <v-btn v-for="chapter in chapters" :key="chapter" :value="chapter"
                                :readonly="toggleMode != 'memorize' ? true : false"
                                :style="chapter == currentWord.chapter && toggleMode != 'memorize' ? 'text-decoration: underline' : ''"
                                @click="changeChapter(chapter)">
                                {{ chapter }}
                            </v-btn>
                        </v-btn-toggle>
                    </v-col>
                </v-row>
                <v-row id="wordRow">
                    <v-col cols="auto">
                        <span id="word" :style="{ fontSize: wordFontSize + 'px' }" @click="speechWord()">{{
                            currentWord.word
                        }}</span>
                        <span id="wrong">
                            <v-icon color="red-darken-4" v-for="n in currentWord.wrongCount">mdi-close-thick</v-icon>
                        </span>
                        <v-icon class="ml-2" v-if="currentWord.word && selectWords.length > 0"
                            style="vertical-align: top;" @click="toggleCheckWord(currentWord, isCheckWord)" size="32px"
                            :color="isCheckWord ? 'red' : 'grey-lighten-3'">mdi-check</v-icon>
                    </v-col>
                </v-row>
                <v-row id="meaningRow">
                    <v-col cols="auto">
                        <v-alert v-model="isMeaningView" color="success" height="40px">
                            {{ currentWord.meaning }}
                        </v-alert>
                    </v-col>
                </v-row>
                <v-row id="buttonRow">
                    <v-col cols="4" class="no-wrap">
                        <v-btn color="light-green-lighten-5" @click="isMeaningView = !isMeaningView"
                            style="height: 50px;"><v-icon color="green">mdi-magnify</v-icon>뜻보기</v-btn>
                        <v-btn :color="isChoiceMode ? 'green' : 'rgba(0, 0, 0, 0.2)'" icon="mdi-lightbulb-alert"
                            variant="text" size="24px" @click="onClickHint()"></v-btn>
                    </v-col>
                    <v-col cols="4" class="no-wrap">
                        <v-badge color="blue" :content="correctCount"><v-btn color="blue-lighten-5"
                                @click="markCorrect()" style="height: 50px;"><v-icon
                                    color="blue">mdi-circle-outline</v-icon>정답</v-btn></v-badge>
                        <v-btn :color="Object.keys(preCorrectWord).length === 0 ? 'rgba(0, 0, 0, 0.2)' : 'blue'"
                            icon="mdi-undo" variant="text" size="24px" @click="cancelCorrect()"></v-btn>
                    </v-col>
                    <v-col cols="4" class="no-wrap">
                        <v-badge color="error" :content="wrongCount"><v-btn color="red-lighten-5" @click="markWrong()"
                                style="height: 50px;"><v-icon color="red">mdi-close</v-icon>오답</v-btn></v-badge>
                        <v-btn :color="Object.keys(preWrongWord).length === 0 ? 'rgba(0, 0, 0, 0.2)' : 'red'"
                            icon="mdi-undo" variant="text" size="24px" @click="cancelWrong()"></v-btn>
                    </v-col>
                </v-row>
                <v-sheet v-if="wrongWords.length > 0 && !isChoiceMode" class="sheet pa-4 mx-auto" rounded="lg"
                    width="92%" color="#fff2f4">
                    <v-row>
                        <v-col cols="auto">
                            <v-chip v-for="wrongWord in wrongWords" color="red" text-color="white" class="chip-spacing">
                                {{ wrongWord.word }}
                            </v-chip>
                        </v-col>
                    </v-row>
                </v-sheet>
                <v-sheet v-if="isChoiceMode" class="sheet pa-4 mx-auto" rounded="lg" width="92%" color="#f2fff4">
                    <v-chip v-for="item in choiceMeanings" :color="isWrong && item.isCorrect ? 'red' : 'green'"
                        text-color="white" class="chip-spacing" @click="onclick_meaning(item.isCorrect)">
                        {{ item.meaning }}
                    </v-chip>
                </v-sheet>
            </v-container>
            <v-snackbar v-model="isMeaningWrongWordView" :timeout="2000" color="success" variant="tonal">
                {{ meaningWrongWord }}
            </v-snackbar>
        </v-main>
        <v-dialog v-model="isSetPopup" max-width="500">
            <v-card color="yellow-lighten-5">
                <v-card-title>학습 단원 선택</v-card-title>
                <v-card-text>
                    <v-select v-model="selectBook" :items="books" variant="outlined" />
                    <v-btn color="yellow-darken-4" @click="resetChapter()"
                        variant="tonal"><v-icon>mdi-selection-remove</v-icon>
                        전체선택해제</v-btn>
                    <v-container>
                        <v-row no-gutters>
                            <v-col
                                v-for="c in Object.keys(quizChapters).filter(key => quizChapters[key].user === currUser && quizChapters[key].book === selectBook).sort()"
                                cols="6">
                                <v-switch v-model="chapters" color="red" :label="c" :value="c" hide-details></v-switch>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
            </v-card>
            <v-fab icon="mdi-close" color="yellow-darken-3" @click="isSetPopup = false" class="fixed-fab"
                variant="text">
            </v-fab>
        </v-dialog>

        <v-progress-linear :model-value="progress" color="green"></v-progress-linear>

    </v-app>

</template>

<style scoped>
#wrong {
    font-size: 8px;
}

#wordRow {
    position: absolute;
    top: 280px;
    justify-content: center;
    display: flex;
    width: 100%;
}

#buttonRow {
    position: absolute;
    top: 430px;
    justify-content: center;
    display: flex;
    width: 100%;
}

#meaningRow {
    position: absolute;
    top: 380px;
    justify-content: center;
    display: flex;
    width: 100%;
}

.sheet {
    position: absolute;
    justify-content: center;
    top: 510px;
}


.multi-line-btn-toggle {
    display: flex;
    flex-wrap: wrap;
    /* 버튼이 여러 줄로 배치되도록 설정 */
    justify-content: center;
    /* 버튼을 중앙 정렬 */
    width: 100%;
    /* 버튼 토글의 너비를 100%로 설정 */
}

.chip-spacing {
    margin: 4px;
    /* 각 v-chip 간격 설정 */
}

.fixed-fab {
    position: fixed;
    top: 8px;
    /* 화면 하단에서 16px 위 */
    right: 12px;
    /* 화면 우측에서 16px 왼쪽 */
    z-index: 1050;
    /* 다른 요소 위에 표시되도록 설정 */
}

.no-wrap {
    display: flex;
    flex-wrap: nowrap;
}
</style>
