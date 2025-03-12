// frontend/src/store/index.ts
import { createStore } from 'vuex';

export interface User {
    username: string;
    role: 'student' | 'teacher' | 'admin';
    token: string;
}

export default createStore({
    state: {
        currentUser: null as User | null
    },
    mutations: {
        setCurrentUser(state, user: User) {
            state.currentUser = user;
        },
        logout(state) {
            state.currentUser = null;
        }
    },
    actions: {},
    modules: {}
});