<template>
    <div class="game-container" v-if="displayGame()">
        <div class="left-container">
            <div class="players">
                <h2>Joueurs</h2>
                <div class="player-card" v-for="player in props.roomInfos.players" :key="player.username">
                    <span class="player-name">{{ player.username }}</span>
                    <span class="player-score">{{ displayScores[player.username] ?? player.score }}</span>
                    <span
                        v-if="playerStreaks[player.username] && playerStreaks[player.username] >= 2"
                        class="streak-badge"
                    >🔥 x{{ playerStreaks[player.username] }}</span>
                    <span
                        v-if="scoreDeltas[player.username]"
                        class="score-delta"
                    >+{{ scoreDeltas[player.username] }}</span>
                </div>
            </div>
            <div class="leave-room">
                <button class="full-button" @click="leaveGame()">Quitter la Room</button>
            </div>
        </div>
        <div class="main-container">
            <div class="not-loading" v-if="!isLoading()">
                <ArtGame @submitAnswer="submitAnswerHandler"
                    v-if="isRoundGoing()" />
                <RoundRecap :endGame="displayEndgame()" @endGamePage="endGamePage" @startNextRound="startNextRoundHandler"
                    v-if="isRoundFinished()" />
            </div>
            <GameLoader v-if="isLoading()" />
        </div>
    </div>
    <div class="endgame-container" v-if="isEndGame">
        <Endgame @quitGame="leaveGame()"/>
    </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { onMounted, ref } from 'vue';
import ArtGame from './ArtGame.vue';
import GameLoader from './GameLoader.vue';
import Endgame from './Endgame.vue';
import RoundRecap from './RoundRecap.vue';

const loading = ref();
const props = defineProps({
    roomInfos: Object,
    socketManager: Object
});
const store = useStore();
const currentRoundInfos = ref({
    image: "",
    artAnswers: [],
    roundStatus: "",
    roundResults: {},
    roundNumber: 0,
    questionType: "",
    hasAnswered: false,
    timerSeconds: 30,
    correctAnswerId: '',
});
const isEndGame = ref(false);

// Feature 4: Streak tracking
const playerStreaks = ref({}); // { username: streak }

// Feature 10: Animated scores
const displayScores = ref({}); // { username: displayedScore }
const scoreDeltas = ref({});   // { username: delta } shown briefly

const emit = defineEmits(['leaveGame', 'endGame', 'roundEnd']);


onMounted(() => {
    initSocketHandlers();
    currentRoundInfos.value = store.getters.currentRoundInfos;
    loading.value = (!isRoundGoing() && !isRoundFinished());

    // Init display scores from current player list
    initDisplayScores();
});

const initDisplayScores = () => {
    if (props.roomInfos && props.roomInfos.players) {
        for (const player of props.roomInfos.players) {
            displayScores.value[player.username] = player.score;
        }
    }
};

const animateScores = (roundResults) => {
    const newScoreDeltas = {};

    for (const [, result] of Object.entries(roundResults)) {
        const username = result.username;
        if (result.score > 0) {
            newScoreDeltas[username] = result.score;
        }
    }

    scoreDeltas.value = newScoreDeltas;

    // Clear deltas after animation
    setTimeout(() => {
        scoreDeltas.value = {};
    }, 1500);

    // Animate display scores
    for (const player of props.roomInfos.players) {
        const oldScore = displayScores.value[player.username] ?? 0;
        const newScore = player.score;
        if (newScore === oldScore) continue;

        const delta = newScore - oldScore;
        const steps = 20;
        const stepValue = delta / steps;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            displayScores.value[player.username] = Math.round(oldScore + stepValue * step);
            if (step >= steps) {
                displayScores.value[player.username] = newScore;
                clearInterval(interval);
            }
        }, 40);
    }
};

const initSocketHandlers = () => {

    props.socketManager.onRoundLoading(() => {
        loading.value = true;
    });

    props.socketManager.onRoundStarted((data) => {
        formatRoundInfos(data.artInfo);
        currentRoundInfos.value.roundStatus = "Going";
        currentRoundInfos.value.roundNumber++;
        currentRoundInfos.value.questionType = data.questionType;
        currentRoundInfos.value.hasAnswered = false;
        currentRoundInfos.value.timerSeconds = data.timerSeconds || 30;
        currentRoundInfos.value.correctAnswerId = data.artInfo[0].id;
        store.dispatch('saveCurrentRoundInfos', { currentRoundInfos: currentRoundInfos.value });

        // Preload the artwork image before hiding the spinner
        const img = new Image();
        img.onload = () => { loading.value = false; };
        img.onerror = () => { loading.value = false; };
        img.src = data.artInfo[0].image;
    });

    props.socketManager.onRoundEnded((data) => {
        currentRoundInfos.value.roundStatus = "Finished";
        currentRoundInfos.value.roundResults = data.roundResults;
        store.dispatch('saveChosenArtInfo', { chosenArtInfo: data.answerData });
        store.dispatch('saveCurrentRoundInfos', { currentRoundInfos: currentRoundInfos.value });

        // Update streak badges from round results
        const newStreaks = {};
        for (const [, result] of Object.entries(data.roundResults)) {
            if (result.streak !== undefined) {
                newStreaks[result.username] = result.streak;
            }
        }
        playerStreaks.value = newStreaks;

        // Scores will be updated by parent, then we animate
        emit('roundEnd');
    });
};

// Called after parent fetches new scores
const onScoresUpdated = () => {
    const roundResults = currentRoundInfos.value.roundResults;
    if (roundResults) {
        animateScores(roundResults);
    }
    // Refresh display scores baseline
    initDisplayScores();
};

const leaveGame = () => {
    emit('leaveGame');
};

const formatRoundInfos = (artsInfo) => {
    currentRoundInfos.value.artAnswers = [];
    currentRoundInfos.value.image = artsInfo[0].image;
    for (let i = 0; i < artsInfo.length; i++) {
        currentRoundInfos.value.artAnswers.push(artsInfo[i]);
    }
    shuffleArray(currentRoundInfos.value.artAnswers);
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

const submitAnswerHandler = (artAnswerId) => {
    currentRoundInfos.value = store.getters.currentRoundInfos;
    currentRoundInfos.value.hasAnswered = true;
    store.dispatch('saveCurrentRoundInfos', { currentRoundInfos: currentRoundInfos.value });
    props.socketManager.submitAnswer(store.getters.currentRoomInfos.code, store.getters.user, artAnswerId);
};

const startNextRoundHandler = () => {
    loading.value = true;
    currentRoundInfos.value.hasAnswered = false;
    store.dispatch('saveCurrentRoundInfos', { currentRoundInfos: currentRoundInfos.value });
    props.socketManager.startNextRound(store.getters.currentRoomInfos.code);
};


const isRoundGoing = () => {
    return currentRoundInfos.value.roundStatus === "Going";
};

const isRoundFinished = () => {
    return currentRoundInfos.value.roundStatus === "Finished";
};

const isGameFinished = () => {
    return currentRoundInfos.value.roundNumber === props.roomInfos.maxRounds;
};

const displayGame = () => {
    return !isEndGame.value;
};

const displayEndgame = () => {
    return isGameFinished() && isRoundFinished();
};

const isLoading = () => {
    return loading.value;
};

const endGamePage = () => {
    isEndGame.value = true;
};

// Expose for parent
defineExpose({ onScoresUpdated });
</script>

<style scoped>
.game-container {
    display: flex;
    margin-top: 2em;
}

.left-container {
    width: 15%;
    margin-left: 3em;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.main-container {
    width: 85%;
    margin-left: 2em;
}


.leave-room {
    margin: auto;
    margin-top: 2em;
    width: 7em;
    background-color: black;
    border-radius: 5px;
    margin-bottom: 5em;
}

.leave-room:hover {
    background-color: rgb(55, 40, 55);
    color: white;
}

.players {
    width: 100%;
    background-color: white;
}

.players h2 {
    background-color: grey;
    text-align: center;
    color: white;
}

.player-card {
    color: black;
    font-weight: 600;
    font-size: large;
    padding: 0.2em;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.2em;
    border-radius: 1em;
    position: relative;
}

.player-name {
    font-size: 1rem;
}

.player-score {
    font-size: 1.2rem;
    font-weight: 700;
}

.streak-badge {
    font-size: 0.85rem;
    color: #f97316;
    font-weight: 700;
}

.score-delta {
    position: absolute;
    top: -0.5em;
    right: 0.2em;
    color: #22c55e;
    font-weight: 700;
    font-size: 0.9rem;
    animation: floatUp 1.5s ease-out forwards;
    pointer-events: none;
}

@keyframes floatUp {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-30px); }
}
</style>
