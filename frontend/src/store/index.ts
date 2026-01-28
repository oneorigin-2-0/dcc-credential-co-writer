import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import genaiReducer from './slices/genaiSlice';

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['genai'], // Only persist genai slice
  // Optionally blacklist specific fields that shouldn't be persisted
  // You can also use nested persist configs for more granular control
};

// Combine reducers
const rootReducer = combineReducers({
  genai: genaiReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.logo_file'], // File objects can't be serialized
        // Ignore these paths in the state
        ignoredPaths: ['genai.imageConfig.logo_file'], // File objects in state
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
