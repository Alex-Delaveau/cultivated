// RoundSocketManager.js
import ArtApiService from "../Services/ArtApiService.js";
import RoomRepository from "../Repository/RoomRepository.js";
import UserRepository from "../Repository/UserRepository.js";
import GameHistoryRepository from "../Repository/GameHistoryRepository.js";
import Logger from "../Logger/Logger.js";

class RoundSocketManager {

    roomNamespace = null;
    roomCode = null;
    currentCorrectAnswerId = {};
    playersResponses = {};
    roomRepository = null;
    userRepository = null;
    gameHistoryRepository = null;
    isRoundStarted = false;
    roundAnswerIndex = 1;
    roundCorrectAnswerIndex = 1;
    chosenArtList = null;
    expectedPlayerCount = 0;
    playersInRound = {}; // { userId: username }

    // Round / game tracking
    roundTimer = null;
    roundCount = 0;    // how many rounds have been played
    maxRounds = null;  // fetched from DB on first startRound
    gameHistoryFinalized = false; // prevent double finalization

    // Feature 4: Streak bonus
    playerStreaks = {};

    // Feature 9: Hint system
    playerHintsUsed = new Set();
    playerHintPenalty = {};

    // Accumulated scores during the whole game (for winner determination)
    playerGameScores = {}; // { userId: { username, score } }

    constructor(roomNamespace, roomCode) {
        this.roomNamespace = roomNamespace;
        this.roomCode = roomCode;
        this.roomRepository = new RoomRepository();
        this.userRepository = new UserRepository();
        this.gameHistoryRepository = new GameHistoryRepository();
    }

    async startRound(difficulty, artId, timerSeconds = 30, theme = 'global') {
        if (this.isRoundStarted) {
            Logger.warning("Round already started");
            return;
        }

        // Clear any previous timer
        clearTimeout(this.roundTimer);
        this.roundTimer = null;

        this.roomNamespace.to(this.roomCode).emit('roundLoading', { room: this.roomCode });

        this.isRoundStarted = true;
        difficulty = parseInt(difficulty);

        if (difficulty == null || isNaN(difficulty)) {
            difficulty = 0;
        }
        if (artId == null) {
            artId = "";
        }

        // Select a list of artworks
        try {
            this.chosenArtList = await ArtApiService.selectArtworkForRound(difficulty, artId, theme);
        } catch (error) {
            Logger.error(`Failed to fetch artworks for room ${this.roomCode}: ${error.message}`);
            this.isRoundStarted = false;
            this.roomNamespace.to(this.roomCode).emit('roundError', { message: "Could not load artworks. Art data unavailable. Please try again." });
            return;
        }

        if (!this.chosenArtList || this.chosenArtList.length < 4) {
            Logger.error(`Insufficient artworks for room ${this.roomCode}`);
            this.isRoundStarted = false;
            this.roomNamespace.to(this.roomCode).emit('roundError', { message: "Not enough artworks available. Please try again." });
            return;
        }

        // Cache player count, player info, and maxRounds at round start
        try {
            const room = await this.roomRepository.getRoomByCode(this.roomCode);
            if (room) {
                this.expectedPlayerCount = room.currentPlayerNumber;
                if (this.maxRounds === null) {
                    this.maxRounds = room.maxRounds;
                }
                const users = await this.userRepository.getUsersByRoomId(room.id);
                this.playersInRound = {};
                for (const user of users) {
                    this.playersInRound[user.id] = user.username;
                }
            } else {
                this.expectedPlayerCount = 0;
                this.playersInRound = {};
            }
        } catch (e) {
            this.expectedPlayerCount = 0;
            this.playersInRound = {};
        }

        this.roundCount++;

        // Choose the correct answer, shuffle the list and send it to the players
        const questionType = this.chooseQuestionType();
        this.roomNamespace.to(this.roomCode).emit('roundStarted', {
            artInfo: this.chosenArtList,
            room: this.roomCode,
            questionType: questionType,
            timerSeconds: timerSeconds
        });

        // Choose the first art as the correct answer
        this.currentCorrectAnswerId = this.chosenArtList[0].id;
        this.playersResponses = {};

        // Reset per-round hint penalty (playerHintsUsed is NOT reset — 1 hint per game total)
        this.playerHintPenalty = {};

        // Start round timer
        this.roundTimer = setTimeout(() => this.forceRoundEnd(), timerSeconds * 1000);
    }

    forceRoundEnd() {
        // Fill in non-responding players with a missed response
        for (const [userId, username] of Object.entries(this.playersInRound)) {
            if (!this.playersResponses[userId]) {
                this.playersResponses[userId] = {
                    username,
                    answerId: null,
                    index: this.roundAnswerIndex++
                };
            }
        }
        this.evaluateAndSendResults();
    }

    async handlePlayerResponse(user, answerId) {
        // Register the player's response
        const username = user.username;
        this.playersResponses[user.userId] = {
            username,
            answerId,
            index: this.roundAnswerIndex++
        };
        // Check if all players have answered
        if (this.areAllAnswersReceived()) {
            this.evaluateAndSendResults();
        }
    }

    areAllAnswersReceived() {
        return Object.keys(this.playersResponses).length >= this.expectedPlayerCount;
    }

    async handlePlayerLeave(user) {
        if (!this.isRoundStarted) {
            return;
        }

        // Decrement cached player count
        this.expectedPlayerCount = Math.max(0, this.expectedPlayerCount - 1);

        // Remove from round tracking
        delete this.playersInRound[user.userId];
        delete this.playerStreaks[user.userId];
        delete this.playerHintPenalty[user.userId];
        this.playerHintsUsed.delete(user.userId);

        // Delete the player's response if already submitted
        if (this.playersResponses[user.userId]) {
            delete this.playersResponses[user.userId];
        }

        // Re-evaluate if all remaining players have answered
        try {
            if (this.areAllAnswersReceived()) {
                this.evaluateAndSendResults();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async evaluateAndSendResults() {
        const roundResults = {};
        const userIds = Object.keys(this.playersResponses);

        // Sort by response index (first to answer = best score)
        userIds.sort((a, b) => {
            return this.playersResponses[a].index - this.playersResponses[b].index;
        });

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const username = this.playersResponses[userId].username;
            const isCorrect = this.playersResponses[userId].answerId === this.currentCorrectAnswerId;

            if (isCorrect) {
                // Update streak
                this.playerStreaks[userId] = (this.playerStreaks[userId] || 0) + 1;
                const streak = this.playerStreaks[userId];

                // Compute base score
                let score = this.computeScore(this.roundCorrectAnswerIndex);

                // Apply streak multiplier
                if (streak >= 5) {
                    score = Math.round(score * 2.0);
                } else if (streak >= 3) {
                    score = Math.round(score * 1.5);
                }

                // Apply hint penalty
                if (this.playerHintPenalty[userId]) {
                    score = Math.round(score * this.playerHintPenalty[userId]);
                }

                roundResults[userId] = { username, response: true, score, streak };
                await this.userRepository.addScoreById(userId, score);

                // Track accumulated game score for winner determination
                if (!this.playerGameScores[userId]) {
                    this.playerGameScores[userId] = { username, score: 0 };
                }
                this.playerGameScores[userId].score += score;

                // Update game history: score and best streak
                try {
                    await this.gameHistoryRepository.addScore(userId, username, score);
                    await this.gameHistoryRepository.updateBestStreak(userId, username, streak);
                } catch (e) {
                    Logger.error('GameHistory update failed: ' + e.message);
                }
            } else {
                this.playerStreaks[userId] = 0;
                roundResults[userId] = { username, response: false, score: 0, streak: 0 };
            }
        }

        this.handleRoundEnd(roundResults);
    }

    handleRoundEnd(roundResults) {
        // Clear round timer
        clearTimeout(this.roundTimer);
        this.roundTimer = null;

        // Build answerData with extended info for "Learn More"
        let answerData = {};
        try {
            if (this.chosenArtList && this.chosenArtList.length > 0) {
                const art = this.chosenArtList[0];
                answerData = {
                    artist:    art.artistName,
                    title:     art.title,
                    year:      art.year,
                    style:     art.style    ?? null,
                    movement:  art.movement ?? null,
                    museum:    art.museum   ?? null,
                    sourceUrl: art.sourceUrl ?? null,
                };
            }
        } catch (e) {
            answerData = {};
        }

        // Reset round state
        this.roundAnswerIndex = 1;
        this.roundCorrectAnswerIndex = 1;
        this.isRoundStarted = false;

        this.roomNamespace.to(this.roomCode).emit('roundEnded', {
            roundResults: roundResults,
            room: this.roomCode,
            answerData: answerData
        });

        // If this was the last round, finalize game history automatically.
        // This handles the normal flow where endGame() is never called.
        if (this.maxRounds !== null && this.roundCount >= this.maxRounds) {
            this.finalizeGameHistory();
        }
    }

    async finalizeGameHistory() {
        if (this.gameHistoryFinalized) return;
        this.gameHistoryFinalized = true;

        try {
            const scores = Object.entries(this.playerGameScores);
            if (scores.length > 0) {
                // Find the winner (highest accumulated score this game)
                const winner = scores.reduce((max, cur) =>
                    cur[1].score > max[1].score ? cur : max
                );
                const winnerId = winner[0];

                for (const [userId, data] of scores) {
                    const isWinner = userId === winnerId;
                    await this.gameHistoryRepository.finishGame(userId, data.username, isWinner);
                }
            }
        } catch (e) {
            Logger.error('GameHistory finalization failed: ' + e.message);
        }
    }

    async endGame() {
        this.isRoundStarted = false;
        clearTimeout(this.roundTimer);
        this.roundTimer = null;

        // Finalize game history (handles early termination by admin)
        await this.finalizeGameHistory();

        // Reset game-level tracking
        this.playerGameScores = {};
        this.playerStreaks = {};

        this.roomNamespace.to(this.roomCode).emit('gameEnded', { room: this.roomCode });
    }

    // Feature 9: Hint system
    handleHintRequest(userId, socket) {
        if (this.playerHintsUsed.has(userId) || !this.isRoundStarted || !this.chosenArtList) {
            return;
        }

        this.playerHintsUsed.add(userId);
        this.playerHintPenalty[userId] = 0.5;

        // Wrong answers are all except index 0 (the correct one)
        const wrongAnswerIds = this.chosenArtList.slice(1).map(a => a.id);

        // Pick 2 random wrong answers to hide (there are 3 wrong answers, hide 2)
        const shuffled = [...wrongAnswerIds].sort(() => Math.random() - 0.5);
        const toHide = shuffled.slice(0, 2);

        socket.emit('hintGranted', { hiddenIds: toHide });
    }

    computeScore(index) {
        const playerCount = this.expectedPlayerCount;

        const maxScore = 100;
        const minScore = 10;

        const decayFactor = 0.5 * (playerCount / 10);
        const score = Math.max(minScore, maxScore * Math.exp(-decayFactor * (index - 1)));

        this.roundCorrectAnswerIndex++;
        return Math.round(score);
    }

    // 0 = artist, 1 = title, 2 = year
    chooseQuestionType() {
        const random = Math.floor(Math.random() * 3);
        switch (random) {
            case 0: return "artist";
            case 1: return "title";
            case 2: return "year";
            default: return "artist";
        }
    }
}

export default RoundSocketManager;
