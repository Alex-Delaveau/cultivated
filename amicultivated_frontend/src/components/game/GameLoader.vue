<template>
    <div class="loader-container">
        <div class="title">
            <h2>Chargement du prochain round</h2>
            <img src="./../../assets/paint_loader.gif" alt="" class="loading-gif">
        </div>
    </div>
</template>

<style scoped>

.title {
    text-align: center;
    font-size: 2rem;
    line-height: 2rem;
    font-weight: 700;
    color: var(--text-primary);
}

.loading-gif {
    height: auto;
    max-height: 400px;
    width: min(800px, 100%);
    margin: auto;
    overflow: hidden;
    object-fit: cover;
}
</style>