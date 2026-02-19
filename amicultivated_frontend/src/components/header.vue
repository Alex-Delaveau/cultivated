<template>
    <div class="head" v-if="store.getters.loggedIn">
        <div class="icon">
            <a href="/"><img src="../assets/AMICULTIVATED.svg">  </a>
        </div>
        <div class="items">
            <ul>
                <li><a href="/profil">Profil</a></li>
                <li><a href="/leaderboard">Leaderboard</a></li>
            </ul>
        </div>
        <div class="actions">
            <button class="mute-btn" @click="toggleMute()" :title="isMuted ? 'Activer le son' : 'Couper le son'">
                {{ isMuted ? '🔇' : '🔊' }}
            </button>
            <button @click="logout()">Se déconnecter</button>
        </div>
    </div>
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
    await authApi.logout(); // clears HttpOnly cookie on the server
    await store.dispatch('logout');
    router.push({ name: 'login' });
};

</script>


<style scoped>
.head {
    width: 100%;
    background-color: transparent;
    padding-top: 3em;
    padding-left: 3em;
    padding-right: 3em;
    padding-bottom: 1em;
    top: 0;
    display: flex;
    align-items: center;
}

.icon {
    width: 6em;
}

.items {
    display: flex;
    align-items: center;
    width: 100%;
}

ul {
    display: inline-flex;
}

li {
    font-weight: bold;
    margin-left: 2em;
}

li:hover {
    font-weight: bold;
    margin-left: 2em;
    color: white;
}

.actions {
    display: flex;
    align-items: center;
    gap: 1em;
    white-space: nowrap;
}

.mute-btn {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    padding: 0.1em 0.3em;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.mute-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.actions button:last-child:hover {
    font-weight: bold;
    color: white;
}
</style>
