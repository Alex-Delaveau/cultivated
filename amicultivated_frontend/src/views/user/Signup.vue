<template>
  <div class="auth-page">
    <div class="card auth-card">
      <h1 class="section-title auth-title">Créer un compte</h1>

      <p class="error-banner" v-if="errorMessage">{{ errorMessage }}</p>

      <form @submit.prevent="signup" class="auth-form">
        <div class="field-group">
          <label class="label-text" for="username">Nom d'utilisateur</label>
          <input class="input-field" type="text" id="username" v-model="username" autocomplete="username" />
        </div>
        <div class="field-group">
          <label class="label-text" for="password">Mot de passe</label>
          <input class="input-field" type="password" id="password" v-model="password" autocomplete="new-password" />
        </div>
        <button class="btn btn-primary btn-submit" type="submit">Créer mon compte</button>
      </form>

      <hr class="divider" />

      <p class="auth-switch">
        Déjà un compte ?
        <router-link :to="{ name: 'login' }">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { sha256 } from 'js-sha256'
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AuthAPI from './../../api/auth_api.js'

const username = ref('')
const password = ref('')
const errorMessage = ref()
const store = useStore();
const router = useRouter();
const authApi = new AuthAPI(store);

const signup = () => {
  const hashedPassword = sha256(password.value);
  authApi.signup(username.value, hashedPassword)
    .then(() => {
      router.push({ name: 'home' });
    })
    .catch((error) => {
      errorMessage.value = error.response?.data?.message || 'Serveur injoignable, veuillez réessayer';
    })
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: var(--space-xl) var(--space-md);
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-title {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.error-banner {
  background-color: var(--color-danger-muted);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-btn);
  padding: var(--space-sm) var(--space-md);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--space-md);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.btn-submit {
  width: 100%;
  margin-top: var(--space-sm);
  padding: 0.75rem;
  font-size: 1rem;
}

.auth-switch {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.auth-switch a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
