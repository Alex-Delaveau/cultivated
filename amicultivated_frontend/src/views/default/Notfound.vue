<template>
    <div class="notfound-page">
        <div class="code-404">404</div>
        <h1 class="message">Page introuvable</h1>
        <img src="../../assets/notfound.png" class="notfound-img" alt="404">
    </div>
</template>

<style scoped>
.notfound-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - 64px);
    text-align: center;
    padding: var(--space-xl);
    gap: var(--space-md);
}

.code-404 {
    font-size: clamp(4rem, 12vw, 8rem);
    font-weight: 900;
    color: var(--color-primary);
    line-height: 1;
}

.message {
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: 600;
    color: var(--text-secondary);
}

.notfound-img {
    max-width: min(400px, 80vw);
    margin-top: var(--space-lg);
}
</style>
