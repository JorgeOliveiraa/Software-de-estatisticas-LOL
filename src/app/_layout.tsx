import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrateDb } from '../db/database';
import { colors } from '../theme/colors';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="lolstats.db" onInit={migrateDb}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {/* Formulário de partida abre de baixo para cima */}
        <Stack.Screen name="match-form" options={{ presentation: 'modal' }} />
      </Stack>
    </SQLiteProvider>
  );
}
