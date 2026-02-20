import { createStore } from 'vuex';
import AuthAPI from '../api/auth_api.js';


const authApi = new AuthAPI();

function safeParse(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        if (item) return JSON.parse(item);
    } catch (e) {
        localStorage.removeItem(key);
    }
    return fallback;
}

const savedUser = safeParse('user', null);

export const store = new createStore({
    state: {
        loggedIn: !!(savedUser && savedUser.username),
        currentRoundInfos: safeParse('currentRoundInfos', {
            imageUrl: '',
            answers: [],
            roundStatus: '',
            roundResults: {},
            roundNumber: 0,
            questionType: '',
            hasAnswered: false,
            timerSeconds: 30,
            correctAnswerId: '',
        }),
        user: savedUser || {
            userId: '',
            username: '',
        },
        currentRoomInfos: safeParse('currentRoomInfos', {
            id: '',
            code: '',
            maxPlayers: 0,
            players: {},
            status: "",
            currentRoundNumber: 0,
            currentRoundStatus: '',
            currentRoundResults: {},
            timerSeconds: 30,
            difficulty: 0,
            theme: 'global',
        }),
        chosenArtInfo: safeParse('chosenArtInfo', {
            artist: '',
            title: '',
            year: '',
            style: '',
            movement: '',
            museum: '',
            sourceUrl: '',
        }),
    },
    mutations: {
        login(state, { username, userId, currentRoomCode }) {
            state.loggedIn = true;
            state.currentRoomInfos.code = currentRoomCode;
            state.user = {
                userId: userId,
                username: username,
            };
        },
        logout(state) {
            state.loggedIn = false;
            state.currentRoomInfos.code = '';
            state.user = {
                userId: '',
                username: '',
            };
        },
        saveCurrentRoundInfos(state, currentRoundInfos) {
            state.currentRoundInfos = currentRoundInfos;
        },
        deleteCurrentRoundInfos(state) {
            state.currentRoundInfos = {
                imageUrl: '',
                answers: [],
                roundStatus: '',
                roundResults: {},
                roundNumber: 0,
                questionType: '',
                hasAnswered: false,
                timerSeconds: 30,
                correctAnswerId: '',
            };
        },
        saveCurrentRoomInfos(state, currentRoomInfos) {
            state.currentRoomInfos = currentRoomInfos;
        },
        deleteCurrentRoomInfos(state) {
            state.currentRoomInfos = {
                id: '',
                code: '',
                maxPlayers: 0,
                players: {},
                status: "",
                currentRoundNumber: 0,
                currentRoundStatus: '',
                currentRoundResults: {},
                timerSeconds: 30,
                difficulty: 0,
                theme: 'global',
            };
        },
        changeRoomStatus(state, status) {
            state.currentRoomInfos.status = status;
        },
        saveChosenArtInfo(state, chosenArtInfo) {
            state.chosenArtInfo = chosenArtInfo;
        },
        deleteChosenArtInfo(state) {
            state.chosenArtInfo = {
                artist: '',
                title: '',
                year: '',
                style: '',
                movement: '',
                museum: '',
                sourceUrl: '',
            };
        }
    },
    actions: {
        login: ({ commit }, { user, roomCode }) => {
            // Only save non-sensitive info — token is in HttpOnly cookie
            localStorage.setItem('user', JSON.stringify({ userId: user.userId, username: user.username }));
            const roomData = { code: roomCode }
            localStorage.setItem('currentRoomInfos', JSON.stringify(roomData));
            commit('login', { username: user.username, userId: user.userId, currentRoomCode: roomCode });
        },
        logout: ({ commit }) => {
            localStorage.removeItem('user');
            localStorage.removeItem('currentRoomInfos');
            localStorage.removeItem('currentRoundInfos');
            commit('logout');
        },
        saveCurrentRoundInfos: ({ commit }, { currentRoundInfos }) => {
            commit('saveCurrentRoundInfos', currentRoundInfos);
            localStorage.setItem('currentRoundInfos', JSON.stringify(currentRoundInfos));
        },
        saveCurrentRoomInfos: ({ commit }, { currentRoomInfos }) => {
            commit('saveCurrentRoomInfos', currentRoomInfos);
            localStorage.setItem('currentRoomInfos', JSON.stringify(currentRoomInfos));
        },
        deleteRoomInfos: ({ commit }) => {
            commit('deleteCurrentRoomInfos');
            localStorage.removeItem('currentRoomInfos');

            commit('deleteCurrentRoundInfos');
            localStorage.removeItem('currentRoundInfos');

            commit('deleteChosenArtInfo');
            localStorage.removeItem('chosenArtInfo');
        },
        changeRoomStatus: ({ commit }, { status }) => {
            const currentRoomInfos = JSON.parse(localStorage.getItem('currentRoomInfos'));
            currentRoomInfos.status = status;
            commit('saveCurrentRoomInfos', currentRoomInfos);
            localStorage.setItem('currentRoomInfos', JSON.stringify(currentRoomInfos));
        },
        saveChosenArtInfo: ({ commit }, { chosenArtInfo }) => {
            commit('saveChosenArtInfo', chosenArtInfo);
            localStorage.setItem('chosenArtInfo', JSON.stringify(chosenArtInfo));
        },
        deleteChosenArtInfo: ({ commit }) => {
            commit('deleteChosenArtInfo');
            localStorage.removeItem('chosenArtInfo');
        },
    },
    getters: {
        user: state => state.user,
        loggedIn: state => state.loggedIn,
        currentRoundInfos: state => state.currentRoundInfos,
        currentRoomInfos: state => state.currentRoomInfos,
        chosenArtInfo: state => state.chosenArtInfo,
    },

});


