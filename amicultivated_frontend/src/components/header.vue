<template>
  <header class="app-header" v-if="store.getters.loggedIn">
    <a href="/" class="logo-link">
      <img src="../assets/AMICULTIVATED.svg" class="logo" alt="AMICULTIVATED" />
    </a>

    <nav class="nav-links">
      <a href="/profil" class="nav-link">Profil</a>
      <a href="/leaderboard" class="nav-link">Leaderboard</a>
    </nav>

    <div class="header-actions">
      <button
        class="btn btn-ghost btn-sm mute-btn"
        @click="toggleMute()"
        :title="isMuted ? 'Activer le son' : 'Couper le son'"
        :aria-label="isMuted ? 'Activer le son' : 'Couper le son'"
      >
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
      <button class="btn btn-outline btn-sm" @click="logout()">Se déconnecter</button>
    </div>
  </header>
</template>

<script setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useSoundEffects } from '../composables/useSoundEffects.js';
import AuthAPI from '../api/auth_api.js';

const store = useStore();
const router = useRouter();
const { isMuted, toggleMute } = useSoundEffects();
const authApi = new AuthAPI(store);

const logout = async () => {
  await authApi.logout();
  await store.dispatch('logout');
  router.push({ name: 'login' });
};
</script>

<style scoped>
.app-header {
  width: 100%;
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-xl);
  gap: var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background-color: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.logo {
  width: 5rem;
  height: auto;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex: 1;
  margin-left: var(--space-md);
}

.nav-link {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-base);
}

.nav-link:hover {
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.mute-btn {
  font-size: 1.1rem;
  padding: 0.3rem 0.5rem;
}

@media (max-width: 500px) {
  .app-header {
    padding: var(--space-sm);
    gap: var(--space-sm);
  }

  .logo {
    width: 3.5rem;
  }

  .nav-links {
    gap: var(--space-sm);
    margin-left: 0;
  }

  .nav-link {
    font-size: 0.8rem;
  }

  .header-actions {
    gap: 0.25rem;
  }
}
</style>
