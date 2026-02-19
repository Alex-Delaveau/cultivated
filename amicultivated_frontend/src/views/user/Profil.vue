<template>
    <div class="title">
        <h1>Bonjour, {{ store.getters.user.username }}</h1>
    </div>
    <div class="profile-container">
        <div class="form-front" v-if="stats">
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">{{ stats.gamesPlayed }}</div>
                    <div class="stat-label">Parties jouées</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.gamesWon }}</div>
                    <div class="stat-label">Victoires</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.totalScore }}</div>
                    <div class="stat-label">Score total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">🔥 {{ stats.bestStreak }}</div>
                    <div class="stat-label">Meilleure série</div>
                </div>
            </div>
        </div>
        <div v-else-if="loading" class="loading-text">Chargement...</div>
        <div v-else class="loading-text">Aucune statistique disponible pour l'instant.</div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { store } from './../../store/store.js';
import API from './../../api/api.js';

const api = new API(store);
const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
    try {
        stats.value = await api.getProfile();
    } catch (e) {
        console.error('Failed to load profile:', e);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.profile-container {
    width: 600px;
    min-height: 10em;
    display: flex;
    margin: auto;
    margin-top: 2em;
    background: rgb(17, 24, 39);
    background: radial-gradient(circle, rgba(17, 24, 39, 1) 0%, rgba(21, 31, 54, 1) 100%);
    border-radius: 0.75rem;
    padding: 2rem;
    justify-content: center;
    align-items: center;
}

.form-front {
    width: 100%;
    color: rgba(243, 244, 246, 1);
}

.title {
    text-align: center;
    font-size: 2rem;
    line-height: 2rem;
    font-weight: 700;
    margin-top: 1em;
}

.stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.stat-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(167, 139, 250, 0.3);
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #a78bfa;
}

.stat-label {
    font-size: 0.9rem;
    color: rgba(243, 244, 246, 0.7);
    margin-top: 0.25rem;
}

.loading-text {
    color: rgba(243, 244, 246, 0.7);
    font-size: 1.1rem;
}
</style>
