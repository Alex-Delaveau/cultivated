<template>
    <div class="already-container">
        <p class="title">Vous êtes déjà dans une Room</p>
        <p class="room-code-label">Code de la room</p>
        <p class="room-code-value">{{ store.getters.currentRoomInfos.code }}</p>
        <div class="join-leave">
            <button class="btn btn-danger" @click="leaveRoom()">Quitter la Room</button>
            <button class="btn btn-primary" @click="joinRoom(store.getters.currentRoomInfos.code)">Rejoindre la Room</button>
        </div>
    </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
const router = useRouter();
const store = useStore();


const emit = defineEmits(['leaveRoom', 'joinRoom']);

const leaveRoom = () => {
    emit('leaveRoom')
}

const joinRoom = (roomCode) => {
    router.push({ name: 'room', params: { roomCode: roomCode } });
}

</script>

<style scoped>
.already-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - 64px);
    gap: var(--space-md);
    text-align: center;
    padding: var(--space-xl);
}

.title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.room-code-label {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
}

.room-code-value {
    color: var(--text-primary);
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: 0.06em;
}

.join-leave {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    justify-content: center;
    margin-top: var(--space-sm);
}
</style>