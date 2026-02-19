<template>
    <div class="main-frame">
        <div class="title">
            <h2>Trouvez la réponse correcte pour l'attribut : {{ questionTypeMapAttributes[currentRoundInfos.questionType] }}</h2>
        </div>

        <!-- Timer bar -->
        <div class="timer-container">
            <div
                class="timer-bar"
                :class="{ 'timer-bar--low': countdown <= 5 }"
                :style="{ width: timerPercent + '%' }"
            ></div>
            <span class="timer-text" :class="{ 'timer-text--low': countdown <= 5 }">{{ countdown }}s</span>
        </div>

        <div class="art-frame">
            <div class="img">
                <img :src="currentRoundInfos.image" oncontextmenu="return false;">
            </div>
            <div class="response">
                <template v-for="artAnswer in currentRoundInfos.artAnswers" :key="artAnswer.id">
                    <div
                        class="answer-button-container"
                        v-if="!hiddenAnswerIds.includes(artAnswer.id)"
                    >
                        <button
                            :class="buttonClass(artAnswer)"
                            @click="submitAnswer(artAnswer.id)"
                            :disabled="currentRoundInfos.hasAnswered"
                        >
                            <span v-if="currentRoundInfos.questionType == 'title'">{{ artAnswer.title }}</span>
                            <span v-if="currentRoundInfos.questionType == 'artist'">{{ artAnswer.artistName }}</span>
                            <span v-if="currentRoundInfos.questionType == 'year'">{{ artAnswer.completitionYear }}</span>
                        </button>
                    </div>
                </template>
            </div>
        </div>

        <!-- Hint button (50/50) -->
        <div class="hint-container" v-if="!currentRoundInfos.hasAnswered">
            <button
                class="hint-btn"
                :disabled="hintUsed"
                @click="useHint()"
                :title="hintUsed ? 'Indice déjà utilisé' : 'Utiliser un indice 50/50 (score divisé par 2)'"
            >
                {{ hintUsed ? 'Indice utilisé' : '50/50' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import RoomSocketManager from '../../api/roomSocketManager.js';
import { useSoundEffects } from '../../composables/useSoundEffects.js';

const store = useStore();
const socketManager = RoomSocketManager.getInstance();
const { playCorrect, playWrong, playTick, playRoundStart } = useSoundEffects();

const questionTypeMapAttributes = {
    "title": "Titre de l'oeuvre",
    "artist": "Nom de l'artiste",
    "year": "Date de création"
}

const currentRoundInfos = computed(() => store.getters.currentRoundInfos);
const roomCode = computed(() => store.getters.currentRoomInfos.code);

// Answer feedback state
const selectedAnswerId = ref(null);

// Hint system state
const hintUsed = ref(false);
const hiddenAnswerIds = ref([]);

// Timer state
const timerSeconds = computed(() => currentRoundInfos.value.timerSeconds || 30);
const countdown = ref(timerSeconds.value);
let countdownInterval = null;

const timerPercent = computed(() => {
    const total = timerSeconds.value || 30;
    return Math.max(0, (countdown.value / total) * 100);
});

const emit = defineEmits(['submitAnswer']);

const buttonClass = (artAnswer) => {
    if (!currentRoundInfos.value.hasAnswered) {
        return 'answer-button';
    }
    const correctId = currentRoundInfos.value.correctAnswerId;
    if (artAnswer.id === correctId) {
        return 'answer-button answer-correct';
    }
    if (artAnswer.id === selectedAnswerId.value && artAnswer.id !== correctId) {
        return 'answer-button answer-wrong';
    }
    return 'answer-button answer-dimmed';
};

const submitAnswer = (artAnswerId) => {
    if (currentRoundInfos.value.hasAnswered) return;

    selectedAnswerId.value = artAnswerId;

    // Play sound based on correctness
    const correctId = currentRoundInfos.value.correctAnswerId;
    if (artAnswerId === correctId) {
        playCorrect();
    } else {
        playWrong();
    }

    stopTimer();
    emit('submitAnswer', artAnswerId);
};

const useHint = () => {
    if (hintUsed.value || currentRoundInfos.value.hasAnswered) return;
    hintUsed.value = true;
    socketManager.requestHint(roomCode.value);
};

const startTimer = () => {
    stopTimer();
    countdown.value = timerSeconds.value;
    countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 5 && countdown.value > 0) {
            playTick();
        }
        if (countdown.value <= 0) {
            stopTimer();
        }
    }, 1000);
};

const stopTimer = () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
};

// Listen for hint granted
const onHintGranted = (data) => {
    hiddenAnswerIds.value = data.hiddenIds || [];
};

onMounted(() => {
    socketManager.onHintGranted(onHintGranted);

    // If a round is already active when mounting, start timer and play sound
    if (currentRoundInfos.value.roundStatus === 'Going' && !currentRoundInfos.value.hasAnswered) {
        startTimer();
        playRoundStart();
    }
});

onBeforeUnmount(() => {
    stopTimer();
    socketManager.offHintGranted(onHintGranted);
});

// Watch for round starting (timerSeconds change) to reset timer and hint state
watch(() => currentRoundInfos.value.roundNumber, () => {
    selectedAnswerId.value = null;
    hintUsed.value = false;
    hiddenAnswerIds.value = [];
    startTimer();
    playRoundStart();
});

// Stop timer when answered
watch(() => currentRoundInfos.value.hasAnswered, (answered) => {
    if (answered) {
        stopTimer();
    }
});
</script>

<style scoped>

.title {
    text-align: center;
    font-size: 2rem;
    line-height: 2rem;
    font-weight: 700;
    margin-bottom: 1em;
}

/* Timer */
.timer-container {
    width: 60%;
    margin: 0 auto 1em;
    display: flex;
    align-items: center;
    gap: 0.75em;
    background-color: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
    height: 1.5rem;
}

.timer-bar {
    height: 100%;
    background-color: #a78bfa;
    border-radius: 999px;
    transition: width 1s linear, background-color 0.3s;
}

.timer-bar--low {
    background-color: #ef4444;
}

.timer-text {
    position: absolute;
    right: 0.75em;
    font-size: 0.85rem;
    font-weight: 700;
    color: #374151;
}

.timer-text--low {
    color: #ef4444;
}

.img img {
    width: auto;
    margin: auto;
    border: 4px solid white;
}

.art-frame {
    width: 40%;
    margin: auto;
}

.response {
    padding-top: 1em;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    gap: 10px;
    padding-bottom: 2em;
}

.answer-button-container {
    margin: 1%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: grey;
    font-size: large;
    font-weight: 700;
}

.answer-button {
    width: 100%;
    border-radius: 1em;
    background-color: white;
    transition: background-color 0.3s;
    cursor: pointer;
    padding: 0.5em;
}

.answer-button:hover:not(:disabled) {
    width: 90%;
    background-color: lightsalmon;
}

.answer-correct {
    background-color: #22c55e !important;
    color: white !important;
    cursor: default;
}

.answer-wrong {
    background-color: #ef4444 !important;
    color: white !important;
    cursor: default;
}

.answer-dimmed {
    background-color: #e5e7eb !important;
    color: #9ca3af !important;
    cursor: default;
    opacity: 0.7;
}

/* Hint */
.hint-container {
    display: flex;
    justify-content: center;
    margin-top: 0.5em;
}

.hint-btn {
    padding: 0.4em 1.2em;
    background-color: #fbbf24;
    color: #1f2937;
    border: none;
    border-radius: 6px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.hint-btn:hover:not(:disabled) {
    background-color: #f59e0b;
}

.hint-btn:disabled {
    background-color: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
}
</style>
