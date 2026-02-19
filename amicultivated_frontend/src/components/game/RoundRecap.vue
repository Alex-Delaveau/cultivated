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
        <button v-if="!endGame" class="next-round" @click="startNextRound()">Next Round</button>
        <button v-if="endGame" class="next-round" @click="endGamePage()">End game results</button>
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
.main-frame{
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

.img{
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
}

.strong-text {
    font-weight: 700;
}

.img img {
    width: auto;
    border: 4px solid white;
}

.wikiart-link {
    color: #a78bfa;
    font-weight: 700;
    text-decoration: underline;
}

.wikiart-link:hover {
    color: #8c68f7;
}

.next-round {
    margin-top: 2em;
    width: 30%;
    height: 100px;
    background-color: black;
    border-radius: 5px;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 2em;
}

.next-round:hover {
    background-color: rgb(55, 40, 55);
}

.leave-room:hover {
    background-color: rgb(55, 40, 55);
    color: white;
}

</style>
