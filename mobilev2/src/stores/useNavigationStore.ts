import { create } from 'zustand';

export type ViewScreen = 'home' | 'routes' | 'products' | 'charges' | 'chargeDetail' | 'customers' | 'customerDetail' | 'cardDetail';

interface ViewState {
  view: ViewScreen;
  params: any;
}

interface NavigationState {
  currentView: ViewScreen;
  currentParams: any;
  history: ViewState[];
  navigate: (view: ViewScreen, params?: any) => void;
  goBack: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'home',
  currentParams: {},
  history: [],
  
  navigate: (view, params = {}) => set((state) => ({
    history: [...state.history, { view: state.currentView, params: state.currentParams }],
    currentView: view,
    currentParams: params,
  })),

  goBack: () => set((state) => {
    if (state.history.length === 0) return state;
    const newHistory = [...state.history];
    const previous = newHistory.pop()!;
    return {
      history: newHistory,
      currentView: previous.view,
      currentParams: previous.params,
    };
  }),
}));
