<template>
  <main class="home-page">
    <div v-if="!hasCurrentRoom()">

      <!-- Hero -->
      <section class="hero">
        <h1 class="hero-title">Testez vos connaissances<br />en histoire de l'art.</h1>
        <p class="hero-sub">Quiz multijoueur · Toiles célèbres · Défis chronométrés</p>
      </section>

      <!-- Carte d'action principale -->
      <div class="home-card card">
        <div class="home-image">
          <img src="../assets/art.jpg" alt="Œuvre d'art" />
        </div>
        <div class="home-actions">
          <p class="error-banner" v-if="errorMessage">{{ errorMessage }}</p>

          <div class="join-section">
            <h2 class="section-title">Rejoindre une partie</h2>
            <p class="join-hint">Entrez le code partagé par l'hôte</p>
            <input
              class="input-field code-input"
              type="text"
              v-model="roomCode"
              placeholder="Ex : H68UYZ"
            />
            <button class="btn btn-primary btn-action" @click="joinRoom()">Rejoindre</button>
          </div>

          <hr class="divider" />

          <div class="create-section">
            <p class="create-hint">Ou lancez votre propre partie</p>
            <button class="btn btn-outline btn-action" @click="createRoom()">Créer une room</button>
          </div>
        </div>
      </div>

    </div>

    <AlreadyInGame v-if="hasCurrentRoom()" @leaveRoom="leaveRoom" @joinRoom="joinRoom" />
  </main>
</template>

<script setup>
import { ref } from 'vue'
import API from './../api/api.js'
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import AlreadyInGame from '../components/game/AlreadyInGame.vue';

const room = ref()
const roomCode = ref()
const store = useStore();
const api = new API(store);
const errorMessage = ref('')
const router = useRouter();

const hasCurrentRoom = () => {
  const code = store.getters.currentRoomInfos.code;
  return code != null && code !== '' && code !== undefined;
}

const joinRoom = async () => {
  try {
    if (!roomCode.value) throw new Error("Le code de la room ne peut pas être vide");
    const username = store.getters.user.username;
    await api.joinRoom(roomCode.value, username);
    router.push({ name: 'room', params: { roomCode: roomCode.value } });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Serveur injoignable, veuillez réessayer';
  }
}

const leaveRoom = async () => {
  try {
    const username = store.getters.user.username;
    await api.leaveRoom(username);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Serveur injoignable, veuillez réessayer';
  }
}

const createRoom = async () => {
  try {
    const username = store.getters.user.username;
    room.value = await api.createRoom(username);
    router.push({ name: 'room', params: { roomCode: room.value.code } });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Serveur injoignable, veuillez réessayer';
  }
}
</script>

<style scoped>
.home-page {
  padding: 0 var(--space-md) var(--space-2xl);
}

/* ── Hero ──────────────────────────────────────────────── */
.hero {
  text-align: center;
  padding: var(--space-2xl) 0 var(--space-xl);
}

.hero-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-md);
}

.hero-sub {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* ── Home card ─────────────────────────────────────────── */
.home-card {
  display: flex;
  max-width: 780px;
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
}

.home-image {
  width: 42%;
  flex-shrink: 0;
}

.home-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.home-actions {
  flex: 1;
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-md);
}

/* ── Error ─────────────────────────────────────────────── */
.error-banner {
  background-color: var(--color-danger-muted);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-btn);
  padding: var(--space-sm) var(--space-md);
  font-size: 0.875rem;
  font-weight: 600;
}

/* ── Join section ──────────────────────────────────────── */
.join-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.join-hint,
.create-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.code-input {
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-size: 1rem;
}

/* ── Create section ────────────────────────────────────── */
.create-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.btn-action {
  width: 100%;
  justify-content: center;
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 600px) {
  .home-card {
    flex-direction: column;
  }

  .home-image {
    width: 100%;
    height: 180px;
  }
}
</style>
