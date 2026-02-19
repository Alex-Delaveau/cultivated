Here is the professional Markdown version of your feature improvement plan for **AMICULTIVATED**.

---

# Feature Improvements for AMICULTIVATED: Context

The core game loop is functional: room creation, game start, art-based trivia rounds, and scoring. While performance optimizations (caching, preloading, DB query reduction) are complete, this plan proposes engaging improvements designed for a friend-group game night, prioritized by impact-to-effort ratio.

---

## Tier 1 — High Impact, Easy Complexity

### 1. Round Timer (Gameplay)

* **What:** Add a configurable countdown timer (e.g., 15/30/60s) per round. If time expires, unanswered players score 0 and the round ends.
* **Why:** Prevents "dead air" caused by AFK or slow players. Creates urgency and keeps the session momentum high.
* **Complexity:** Easy
* **Scope:** Backend + Frontend
* **Key Files:**
* `backend/src/sockets/RoundSocketManager.js`: Add `setTimeout` after `roundStarted`.
* `amicultivated_frontend/src/components/game/ArtGame.vue`: Add visible countdown UI.
* `backend/src/Models/RoomModel.js`: Add `timerSeconds` field.
* `amicultivated_frontend/src/views/game/RoomStarting.vue`: Add timer slider to lobby.



### 2. Expose Difficulty Setting (Gameplay)

* **What:** Connect the existing backend difficulty logic (WikiArt pages 1-3, 4-6, 7-9) to a lobby selector.
* **Why:** Massive replayability for little effort. Allows art-savvy players to find a real challenge with obscure works.
* **Complexity:** Easy
* **Scope:** Backend + Frontend (Wiring)
* **Key Files:**
* `backend/src/Models/RoomModel.js`: Add `difficulty` field (integer).
* `amicultivated_frontend/src/views/game/RoomStarting.vue`: Add radio buttons/segmented control.
* `backend/src/sockets/RoomSocketHandler.js`: Pass `room.difficulty` to `startRound()`.



### 3. Answer Feedback: Correct/Wrong Highlight (Polish)

* **What:** Immediately color the chosen button green (correct) or red (wrong) upon selection with a brief animation.
* **Why:** Instant feedback provides a "dopamine hit" and makes the UI feel responsive rather than static.
* **Complexity:** Easy
* **Scope:** Frontend-only
* **Key Files:**
* `amicultivated_frontend/src/components/game/ArtGame.vue`: Compare selected ID against `artAnswers[0].id` and apply CSS classes.



### 4. Answer Streak Bonus (Gameplay)

* **What:** Track consecutive correct answers. Award multipliers (e.g., x1.5 for 3-streak, x2 for 5-streak) and show a streak badge.
* **Why:** Creates "on fire" moments and allows trailing players to catch up through skill.
* **Complexity:** Easy-Medium
* **Scope:** Backend + Frontend
* **Key Files:**
* `backend/src/sockets/RoundSocketManager.js`: Logic to track/increment `playerStreaks`.
* `amicultivated_frontend/src/components/game/Game.vue`: Display streak data on player cards.



---

## Tier 2 — High Impact, Medium Complexity

### 5. "Learn More" Artwork Reveal (Content)

* **What:** Enhance the `RoundRecap` screen with richer metadata: WikiArt link, art movement, dimensions, and "Did you know?" facts.
* **Why:** Transitions the game from a pure quiz into a discovery tool for friends to learn about art.
* **Complexity:** Medium
* **Scope:** Backend + Frontend

### 6. Sound Effects (Polish)

* **What:** Add SFX for correct/wrong answers, timer ticking (last 5s), and round starts. Include a mute toggle.
* **Why:** Audio feedback elevates the "game show" atmosphere.
* **Complexity:** Medium
* **Scope:** Frontend-only

### 7. Profile Page with Game History (Personalization)

* **What:** Persist user stats (total games, wins, favorite period, best streak) via a new `GameHistory` model.
* **Why:** Gives players a sense of progression and identity beyond a single session.
* **Complexity:** Medium
* **Scope:** Backend + Frontend

### 8. Global Leaderboard (Social)

* **What:** Replace the "Coming Soon" page with an all-time ranking of players by wins or cumulative score.
* **Why:** Fuels friendly rivalry and gives a reason to return.
* **Complexity:** Medium

---

## Tier 3 — Medium Impact, Medium-Hard Complexity

### 9. Hint System (Gameplay)

* **What:** A "50/50" button that removes two wrong answers in exchange for halving the round's potential score.
* **Why:** Adds a layer of tactical decision-making and reduces frustration on difficult rounds.
* **Complexity:** Medium
* **Scope:** Backend + Frontend

### 10. Animated Score Transitions (Polish)

* **What:** Animate numbers counting up on the leaderboard and add floating "+100" text indicators.
* **Why:** Pure visual juice that makes earning points feel significantly more rewarding.
* **Complexity:** Medium
* **Scope:** Frontend-only

---

## Implementation Roadmap

| Priority | Feature | Effort | Impact / Unlock |
| --- | --- | --- | --- |
| **1** | **Round Timer (#1)** | ~2h | Fixes the #1 UX problem (AFK stalling) |
| **2** | **Difficulty Setting (#2)** | ~1h | Free replayability (backend is already ready) |
| **3** | **Answer Feedback (#3)** | ~1h | Instant feel improvement |
| **4** | **Streak Bonus (#4)** | ~2h | Adds depth to the scoring system |
| **5** | **Sound Effects (#6)** | ~3h | "Game-show" immersion |
| **6** | **Learn More (#5)** | ~2h | Turns the quiz into an education tool |
| **7** | **Profile + History (#7)** | ~4h | Long-term player retention |
| **8** | **Leaderboard (#8)** | ~2h | Competitive social element |
| **9** | **Hints (#9)** | ~2h | Strategic gameplay layer |
| **10** | **Animated Scores (#10)** | ~3h | High-end visual polish |

---

**Next Step:** Would you like me to generate the specific JavaScript/Vue code for the **Round Timer** (Priority 1) so you can begin implementation?