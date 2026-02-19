<template>
    <div class="leaderboard-page">
        <h1 class="title">Classement Global</h1>
        <div class="leaderboard-container">
            <div v-if="loading" class="loading-text">Chargement...</div>
            <table v-else-if="leaderboard.length > 0" class="leaderboard-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Joueur</th>
                        <th>Score total</th>
                        <th>Victoires</th>
                        <th>Parties</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="entry in leaderboard"
                        :key="entry.rank"
                        :class="{ 'row--me': entry.username === currentUsername }"
                    >
                        <td class="rank">
                            <span v-if="entry.rank === 1">🥇</span>
                            <span v-else-if="entry.rank === 2">🥈</span>
                            <span v-else-if="entry.rank === 3">🥉</span>
                            <span v-else>{{ entry.rank }}</span>
                        </td>
                        <td class="username">{{ entry.username }}</td>
                        <td class="score">{{ entry.totalScore }}</td>
                        <td>{{ entry.gamesWon }}</td>
                        <td>{{ entry.gamesPlayed }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="loading-text">Aucun joueur dans le classement pour l'instant.</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import API from '../api/api.js';

const store = useStore();
const api = new API(store);
const leaderboard = ref([]);
const loading = ref(true);
const currentUsername = computed(() => store.getters.user.username);

onMounted(async () => {
    try {
        leaderboard.value = await api.getLeaderboard();
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.leaderboard-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem;
}

.title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
}

.leaderboard-container {
    background: rgb(17, 24, 39);
    border-radius: 0.75rem;
    padding: 1.5rem;
    overflow: hidden;
}

.leaderboard-table {
    width: 100%;
    border-collapse: collapse;
    color: rgba(243, 244, 246, 1);
}

.leaderboard-table th {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid rgba(167, 139, 250, 0.4);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(243, 244, 246, 0.6);
}

.leaderboard-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 1rem;
}

.leaderboard-table tr:last-child td {
    border-bottom: none;
}

.rank {
    font-size: 1.3rem;
    text-align: center;
    width: 3rem;
}

.username {
    font-weight: 600;
}

.score {
    color: #a78bfa;
    font-weight: 700;
    font-size: 1.1rem;
}

.row--me {
    background-color: rgba(167, 139, 250, 0.1);
}

.loading-text {
    color: rgba(243, 244, 246, 0.7);
    font-size: 1.1rem;
    text-align: center;
    padding: 2rem;
}
</style>
