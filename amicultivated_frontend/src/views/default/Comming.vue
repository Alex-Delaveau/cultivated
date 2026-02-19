<template>
    <div class="comming-page">
        <span class="badge badge-primary">Bientôt disponible</span>
        <h1 class="comming-title">Page en cours de création...</h1>
        <img src="../../assets/roadwork2.gif" class="comming-gif" alt="En construction"/>
    </div>
</template>

<style scoped>
.comming-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - 64px);
    text-align: center;
    padding: var(--space-xl);
    gap: var(--space-md);
}

.comming-title {
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    font-weight: 700;
    color: var(--text-primary);
}

.comming-gif {
    max-width: min(360px, 80vw);
    border-radius: var(--radius-card);
    margin-top: var(--space-sm);
}
</style>
