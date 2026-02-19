<template>
    <div class="main-frame">
        <div class="art-info">
            <div class="img">
                <img :src="image" oncontextmenu="return false;">
            </div>
            <div class="info">
                <p>Artiste : <span class="strong-text">{{ chosenArtInfo.artist }}</span></p>
                <p>Titre de l'oeuvre : <span class="strong-text">{{ chosenArtInfo.title }}</span></p>
                <p>Date de complétion : <span class="strong-text">{{ chosenArtInfo.year }}</span></p>
                <p v-if="chosenArtInfo.style">Style : <span class="strong-text">{{ chosenArtInfo.style }}</span></p>
                <p v-if="chosenArtInfo.genre">Genre : <span class="strong-text">{{ chosenArtInfo.genre }}</span></p>
                <p v-if="chosenArtInfo.wikiartUrl">
                    <a :href="chosenArtInfo.wikiartUrl" target="_blank" rel="noopener" class="wikiart-link">
                        Voir sur WikiArt →
                    </a>
                </p>
            </div>
        </div>
        <button v-if="!endGame" class="btn btn-primary next-round" @click="startNextRound()">Next Round</button>
        <button v-if="endGame" class="btn btn-primary next-round" @click="endGamePage()">End game results</button>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const image = computed(() => store.getters.currentRoundInfos.image);
const chosenArtInfo = computed(() => store.getters.chosenArtInfo);
const props = defineProps({
    endGame: Boolean,
});

const emit = defineEmits(['startNextRound', 'endGamePage']);

const startNextRound = () => {
    emit('startNextRound');
}

const endGamePage = () => {
    emit('endGamePage');
}

</script>

<style scoped>
.main-frame {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
}

.art-info {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
}

.img {
    width: 40%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.info {
    width: 50%;
    height: 100%;
}

.info p {
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0.5em;
    color: var(--text-secondary);
}

.strong-text {
    font-weight: 700;
    color: var(--text-primary);
}

.img img {
    width: auto;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: var(--shadow-card);
    border-radius: var(--radius-card);
}

.wikiart-link {
    color: var(--color-primary);
    font-weight: 700;
    text-decoration: underline;
}

.wikiart-link:hover {
    color: var(--color-primary-hover);
}

.next-round {
    margin-top: var(--space-xl);
    min-width: 30%;
    min-height: 3rem;
    font-size: 1.2rem;
    margin-bottom: var(--space-xl);
}

@media (max-width: 600px) {
    .art-info {
        flex-direction: column;
    }

    .img,
    .info {
        width: 100%;
    }
}
</style>
