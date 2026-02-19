<template>
  <div class="page-wrapper">
    <div class="room-layout">

      <!-- ── Sidebar : liste des joueurs ─────────────────── -->
      <aside class="players-sidebar">
        <div class="sidebar-header">
          <span class="label-text">Joueurs connectés</span>
          <span class="badge badge-primary">{{ props.roomInfos.players.length }}/{{ props.roomInfos.maxPlayers }}</span>
        </div>

        <div class="players-list">
          <div
            v-for="player in props.roomInfos.players"
            :key="player.id"
            class="player-row"
          >
            <span class="avatar" :style="{ backgroundColor: avatarColor(player.username) }">
              {{ player.username.charAt(0).toUpperCase() }}
            </span>
            <span class="player-name">{{ player.username }}</span>
          </div>
          <!-- Slots libres -->
          <div
            v-for="n in emptySlots"
            :key="'empty-' + n"
            class="player-row player-row--empty"
          >
            <span class="avatar avatar--empty">?</span>
            <span class="player-name player-name--empty">En attente…</span>
          </div>
        </div>
      </aside>

      <!-- ── Panneau principal ───────────────────────────── -->
      <main class="main-panel">

        <!-- En-tête -->
        <header class="room-header">
          <div>
            <p class="label-text">Code de la room</p>
            <h1 class="room-code">{{ roomCode }}</h1>
          </div>
          <div v-if="props.errorMessage" class="error-banner">
            {{ props.errorMessage }}
          </div>
        </header>

        <hr class="divider" />

        <!-- Section : Paramètres -->
        <section class="card-section settings-section">
          <h2 class="section-title settings-section__title">Paramètres</h2>

          <div class="setting-row">
            <div class="setting-row__label">
              <span class="setting-icon">👥</span>
              <label class="setting-name" for="playerRange">Joueurs max</label>
            </div>
            <div class="setting-row__control">
              <input
                class="range-input"
                type="range"
                id="playerRange"
                v-model.number="props.roomInfos.maxPlayers"
                :max="12"
                :min="props.roomInfos.players.length || 1"
                @change="sliderChange()"
              />
              <span class="value-chip">{{ props.roomInfos.maxPlayers }}</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__label">
              <span class="setting-icon">🔄</span>
              <label class="setting-name" for="roundRange">Nombre de rounds</label>
            </div>
            <div class="setting-row__control">
              <input
                class="range-input"
                type="range"
                id="roundRange"
                v-model.number="props.roomInfos.maxRounds"
                max="12"
                min="1"
                @change="sliderChange()"
              />
              <span class="value-chip">{{ props.roomInfos.maxRounds }}</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__label">
              <span class="setting-icon">⏱️</span>
              <label class="setting-name" for="timerRange">Durée par round</label>
            </div>
            <div class="setting-row__control">
              <input
                class="range-input"
                type="range"
                id="timerRange"
                v-model.number="props.roomInfos.timerSeconds"
                max="60"
                min="10"
                step="5"
                @change="sliderChange()"
              />
              <span class="value-chip">{{ props.roomInfos.timerSeconds }}s</span>
            </div>
          </div>
        </section>

        <!-- Section : Difficulté -->
        <section class="card-section">
          <h2 class="section-title settings-section__title">Difficulté</h2>
          <div class="difficulty-buttons">
            <button
              v-for="level in difficultyLevels"
              :key="level.value"
              class="diff-btn"
              :class="{ 'diff-btn--active': props.roomInfos.difficulty === level.value }"
              :style="props.roomInfos.difficulty === level.value
                ? { backgroundColor: level.color, borderColor: level.color }
                : { borderColor: level.color + '80', color: level.color }"
              @click="setDifficulty(level.value)"
            >
              <span class="diff-btn__icon">{{ level.icon }}</span>
              {{ level.label }}
            </button>
          </div>
        </section>

        <!-- Section : Inviter -->
        <section class="card-section invite-section">
          <h2 class="section-title settings-section__title">Inviter des amis</h2>
          <div class="invite-row">
            <input class="input-field invite-input" type="text" :value="fullPath" readonly />
            <button class="btn btn-outline btn-sm copy-btn" @click="copyPath()">
              {{ copied ? '✓ Copié !' : 'Copier' }}
            </button>
          </div>
        </section>

        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-primary btn-lg launch-btn" @click="startGame()">
            ▶ Lancer la partie
          </button>
          <button class="btn btn-danger" @click="confirmLeave()">
            ← Quitter la room
          </button>
        </div>

      </main>
    </div>

    <!-- Toast "Copié !" -->
    <div v-if="copied" class="toast">Lien copié dans le presse-papiers !</div>

    <!-- Modal confirmation quitter -->
    <div v-if="showLeaveModal" class="modal-backdrop" @click.self="showLeaveModal = false">
      <div class="modal-box card">
        <h3 class="section-title">Quitter la room ?</h3>
        <p class="modal-text">Tu vas quitter la room et perdre ta place.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showLeaveModal = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmLeaveAction()">Quitter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue';

const route = useRoute();
const roomCode = ref(route.params.roomCode);
const fullPath = ref(window.location.origin + route.fullPath);
const copied = ref(false);
const showLeaveModal = ref(false);

const props = defineProps({
  roomInfos: Object,
  errorMessage: String,
});

const emit = defineEmits(['startGame', 'leaveRoom', 'updateRoom']);

const difficultyLevels = [
  { value: 0, label: 'Facile',   icon: '🟢', color: '#22c55e' },
  { value: 1, label: 'Moyen',    icon: '🟡', color: '#fbbf24' },
  { value: 2, label: 'Difficile', icon: '🔴', color: '#ef4444' },
];

const emptySlots = computed(() => {
  const max = props.roomInfos?.maxPlayers ?? 0;
  const current = props.roomInfos?.players?.length ?? 0;
  const empty = max - current;
  return empty > 0 ? Math.min(empty, 4) : 0;
});

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#7e22ce',
];

function avatarColor(username) {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const startGame = () => emit('startGame');

const sliderChange = () => emit('updateRoom', props.roomInfos);

const setDifficulty = (level) => {
  props.roomInfos.difficulty = level;
  emit('updateRoom', props.roomInfos);
};

const copyPath = () => {
  navigator.clipboard.writeText(fullPath.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

const confirmLeave = () => { showLeaveModal.value = true; };
const confirmLeaveAction = () => {
  showLeaveModal.value = false;
  emit('leaveRoom');
};
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────── */
.page-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: calc(100dvh - 64px);
  overflow: hidden;
  padding: var(--space-md);
}

.room-layout {
  display: flex;
  gap: var(--space-lg);
  width: 100%;
  max-width: 900px;
  height: 100%;
  overflow: hidden;
}

/* ── Sidebar joueurs ─────────────────────────────────────── */
.players-sidebar {
  width: 220px;
  flex-shrink: 0;
  background-color: var(--color-surface-dark);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  overflow-y: auto;
  flex: 1;
}

.player-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}

.player-row--empty {
  opacity: 0.35;
}

.player-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-name--empty {
  font-weight: 400;
  font-style: italic;
  color: var(--text-muted);
}

.avatar--empty {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

/* ── Panneau principal ───────────────────────────────────── */
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}

/* ── En-tête ─────────────────────────────────────────────── */
.room-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding: var(--space-md) 0 0;
}

.room-code {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}

.error-banner {
  background-color: var(--color-danger-muted);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-btn);
  padding: var(--space-sm) var(--space-md);
  font-size: 0.875rem;
  font-weight: 600;
}

/* ── Sections paramètres ─────────────────────────────────── */
.settings-section__title {
  margin-bottom: var(--space-md);
}

.settings-section {
  display: flex;
  flex-direction: column;
}

.card-section {
  padding: var(--space-md);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-row__label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  min-width: 0;
}

.setting-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.setting-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: default;
}

.setting-row__control {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
}

/* ── Difficulté ──────────────────────────────────────────── */
.difficulty-buttons {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.diff-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0.5rem 1.125rem;
  border: 2px solid;
  border-radius: var(--radius-btn);
  background-color: transparent;
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    color var(--transition-base),
    transform var(--transition-fast);
}

.diff-btn:hover:not(.diff-btn--active) {
  background-color: rgba(255, 255, 255, 0.06);
}

.diff-btn--active {
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.diff-btn__icon {
  font-size: 0.85rem;
}

/* ── Invitation ──────────────────────────────────────────── */
.invite-row {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.invite-input {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  cursor: default;
}

.copy-btn {
  flex-shrink: 0;
  min-width: 90px;
}

/* ── Actions ─────────────────────────────────────────────── */
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-top: var(--space-sm);
}

.launch-btn {
  width: 100%;
  font-size: 1.0625rem;
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.modal-box {
  width: min(380px, 90vw);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.modal-text {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 600px) {
  .room-layout {
    flex-direction: column;
  }

  .players-sidebar {
    width: 100%;
    max-height: none;
  }

  .players-list {
    flex-direction: row;
    flex-wrap: wrap;
    max-height: none;
  }

  .player-name {
    display: none;
  }

  .setting-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .setting-row__label {
    width: auto;
  }

  .setting-row__control {
    width: 100%;
  }
}
</style>
