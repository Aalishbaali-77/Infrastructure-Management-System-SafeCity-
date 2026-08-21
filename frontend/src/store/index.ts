import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { baseApi } from './api/baseApi';
import './api/projectApi';
import './api/siteApi';
import './api/boqApi';
import './api/provinceApi';
import './api/userApi';
import './api/permissionsApi';
import authReducer from './slices/authSlice';
import permissionsReducer from './slices/permissionsSlice';
import disciplinesReducer from './slices/disciplinesSlice';
import workPackagesReducer from './slices/workPackagesSlice';
import rootSaga from './sagas/rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    permissions: permissionsReducer,
    // UI-only / future modules (no backend yet)
    disciplines: disciplinesReducer,
    workPackages: workPackagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      baseApi.middleware,
      sagaMiddleware
    ),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
