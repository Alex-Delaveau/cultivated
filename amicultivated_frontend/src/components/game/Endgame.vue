<template>
    <div class="end-game-container">
        <div class="title">
            <h1>Fin de la partie, {{ store.getters.user.username }}</h1>
            <h3>Tu es classé {{ computeRanking() }} / {{ playersLength }} !</h3>
        </div>
        <div class="profile-container card">
            <div class="player-card" v-for="(player, index) in sortedPlayers" :key="player.username">
                <div class="player-info">
                    <span class="rank-badge">
                        <span v-if="index === 0">🥇</span>
                        <span v-else-if="index === 1">🥈</span>
                        <span v-else-if="index === 2">🥉</span>
                        <span v-else>#{{ index + 1 }}</span>
                    </span>
                    <span class="avatar" style="background-color: var(--color-primary)">{{ player.username.charAt(0).toUpperCase() }}</span>
                    <p class="name">{{ player.username }}</p>
                    <p class="score">{{ player.score }}</p>
                </div>
            </div>
        </div>
        <div class="home-actions">
            <button class="btn btn-primary" @click="quitGame()">Quitter la partie</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import {store} from './../../store/store.js'

const emits = defineEmits(['quitGame']);

const quitGame = () => {
    emits('quitGame');
}

const players = ref(store.getters.currentRoomInfos.players);
const playersLength = ref(store.getters.currentRoomInfos.players.length);
const sortedPlayers = ref(store.getters.currentRoomInfos.players.sort((a, b) => {
    return b.score - a.score;
}));

const computeRanking = () => {
    let sortedPlayers = players.value.sort((a, b) => {
        return b.score - a.score;
    });
    let index = sortedPlayers.findIndex((player) => {
        return player.username === store.getters.user.username;
    });
    return index + 1 ;
}
</script>

<style scoped>

.end-game-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    padding: var(--space-xl) var(--space-md);
}

.profile-container {
    width: min(480px, 95vw);
    display: flex;
    flex-direction: column;
    margin: auto;
}

.title {
    text-align: center;
    font-size: 2rem;
    line-height: 2rem;
    font-weight: 700;
    margin-bottom: var(--space-xl);
    color: var(--text-primary);
}

.title h3 {
    margin-top: var(--space-lg);
    font-size: 1.5rem;
    color: var(--text-secondary);
}

.player-card {
    width: 100%;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.player-card:last-child {
    border-bottom: none;
}

.player-info {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) 0;
}

.rank-badge {
    font-size: 1.25rem;
    min-width: 2rem;
    text-align: center;
}

.name {
    flex: 1;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
}

.score {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-primary);
}

.home-actions {
    margin-top: var(--space-xl);
    margin-bottom: var(--space-xl);
}
</style>