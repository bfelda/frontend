import MemberAchievement from '@/models/members/memberAchievement';
import TrackedAchievement, { CreateTrackedAchievement } from '@/models/members/trackedAchievement';
import memberAchievementService from '@/services/memberAchievementService';
import trackedAchievementService from '@/services/trackedAchievementService';
import { addErrorToast, addSuccessToast, CommitDispatchFunction, CommitDispatchStateFunction } from '../common';

interface MemberAchievementState {
  isLoading: boolean;
  isSaving: boolean;
  memberAchievements: MemberAchievement[];
  trackedAchievements: TrackedAchievement[];
}

const state: MemberAchievementState = {
  isLoading: false,
  isSaving: false,
  memberAchievements: [],
  trackedAchievements: [],
};

const getters = {
  isLoading: (state: MemberAchievementState): boolean => state.isLoading,
  isSaving: (state: MemberAchievementState): boolean => state.isSaving,
  memberAchievements: (state: MemberAchievementState): MemberAchievement[] => state.memberAchievements,
  trackedAchievements: (state: MemberAchievementState): TrackedAchievement[] => state.trackedAchievements,
  trackedAchievementIds: (state: MemberAchievementState): number[] =>
    state.trackedAchievements.map((a: TrackedAchievement) => a.achievementId),
};

const mutations = {
  SET_IS_LOADING(state: MemberAchievementState, value: boolean): void {
    state.isLoading = value;
  },

  SET_IS_SAVING(state: MemberAchievementState, value: boolean): void {
    state.isSaving = value;
  },

  SET_MEMBER_ACHIEVEMENTS(state: MemberAchievementState, value: MemberAchievement[]): void {
    state.memberAchievements = value;
  },

  SET_TRACKED_ACHIEVEMENTS(state: MemberAchievementState, value: TrackedAchievement[]): void {
    state.trackedAchievements = value;
  },

  ADD_TRACKED_ACHIEVEMENT(state: MemberAchievementState, value: TrackedAchievement): void {
    state.trackedAchievements = [ ...state.trackedAchievements, value ];
  },

  REMOVE_TRACKED_ACHIEVEMENT(state: MemberAchievementState, trackedId: number): void {
    state.trackedAchievements = state.trackedAchievements.filter((ta: TrackedAchievement) => ta.id !== trackedId);
  },
};

const actions = {
  async loadMemberAchievements({ commit }: CommitDispatchFunction, memberId: number): Promise<void> {
    commit('SET_IS_LOADING', true);

    try {
      const achievements = await memberAchievementService.getByMemberId(memberId);
      commit('SET_MEMBER_ACHIEVEMENTS', achievements);
    } catch {
      addErrorToast('There was an error loading the member\'s achievements.');
    }

    commit('SET_IS_LOADING', false);
  },

  async loadTrackedAchievements({ commit }: CommitDispatchFunction): Promise<void> {
    commit('SET_IS_LOADING', true);

    try {
      const achievements = await trackedAchievementService.getForCurrentUser();
      commit('SET_TRACKED_ACHIEVEMENTS', achievements);
    } catch {
      addErrorToast('There was an error loading your tracked achievements.');
    }

    commit('SET_IS_LOADING', false);
  },

  async createTrackedAchievement({ commit }: CommitDispatchFunction, data: CreateTrackedAchievement): Promise<void> {
    commit('SET_IS_SAVING', true);

    try {
      const response = await trackedAchievementService.create(data);
      commit('ADD_TRACKED_ACHIEVEMENT', response);

      addSuccessToast(`You have started tracking ${response.achievement?.name}.`);
    } catch {
      addErrorToast('There was an error tracking the achievement. Try again.');
    }

    commit('SET_IS_SAVING', false);
  },

  async deleteTrackedAchievement({ state, commit }: CommitDispatchStateFunction<MemberAchievementState>, achieveId: number): Promise<void> {
    commit('SET_IS_SAVING', true);

    try {
      const ta = state.trackedAchievements.find((x: TrackedAchievement) => x.achievementId === achieveId);
      if (ta) {
        await trackedAchievementService.delete(ta.id);
        commit('REMOVE_TRACKED_ACHIEVEMENT', ta.id);

        addSuccessToast('You have stopped tracking the achievement.');
      }
    } catch {
      // TODO: Success is still showing even if there was an API error
      addErrorToast('There was an error removing the tracked achievement.');
    }

    commit('SET_IS_SAVING', false);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};