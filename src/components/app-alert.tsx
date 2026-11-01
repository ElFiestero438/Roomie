/// Alertas propias de Roomie con la colorimetría de la app.
/// Se usan igual que las de React Native: Alert.alert('Título', 'Mensaje', [botones]).

import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';

export type AlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertData = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type Listener = (queue: AlertData[]) => void;

let queue: AlertData[] = [];
let listener: Listener | null = null;
let nextId = 1;

function emit() {
  listener?.([...queue]);
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    queue.push({
      id: nextId++,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'Aceptar' }],
    });
    emit();
  },
};

export function AppAlertHost() {
  const [items, setItems] = useState<AlertData[]>([]);

  useEffect(() => {
    listener = setItems;
    setItems([...queue]);

    return () => {
      listener = null;
    };
  }, []);

  const current = items[0];

  const close = (button?: AlertButton) => {
    queue = queue.slice(1);
    emit();

    // La acción del botón (por ejemplo "Eliminar") se ejecuta justo después
    // de cerrar la alerta. Si se ejecuta mientras se cierra, en Android
    // puede perderse.
    const action = button?.onPress;

    if (action) {
      setTimeout(() => {
        try {
          const result: any = action();

          if (result && typeof result.catch === 'function') {
            result.catch((error: unknown) =>
              console.log('[Roomie] Error en la acción de la alerta:', error)
            );
          }
        } catch (error) {
          console.log('[Roomie] Error en la acción de la alerta:', error);
        }
      }, 0);
    }
  };

  if (!current) return null;

  const cancelButton = current.buttons.find((b) => b.style === 'cancel');
  const isDestructive = current.buttons.some((b) => b.style === 'destructive');
  const isRow = current.buttons.length <= 2;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(cancelButton)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.icon, isDestructive && styles.iconDanger]}>
            <Text style={styles.iconText}>{isDestructive ? '!' : 'R'}</Text>
          </View>

          <Text style={styles.title}>{current.title}</Text>

          {current.message ? (
            <Text style={styles.message}>{current.message}</Text>
          ) : null}

          <View style={isRow ? styles.buttonsRow : styles.buttonsColumn}>
            {current.buttons.map((button, index) => {
              const variant =
                button.style === 'cancel'
                  ? 'outline'
                  : button.style === 'destructive'
                    ? 'danger'
                    : 'primary';

              return (
                <Pressable
                  key={`${current.id}-${index}`}
                  onPress={() => close(button)}
                  style={({ pressed }) => [
                    styles.button,
                    isRow && styles.buttonFlex,
                    variant === 'outline' && styles.buttonOutline,
                    variant === 'primary' && styles.buttonPrimary,
                    variant === 'danger' && styles.buttonDanger,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      variant === 'outline'
                        ? styles.buttonTextOutline
                        : styles.buttonTextFilled,
                    ]}
                  >
                    {button.text ?? 'Aceptar'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor: colors.primary,
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  iconDanger: {
    backgroundColor: colors.primary,
  },

  iconText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    alignSelf: 'stretch',
  },

  buttonsColumn: {
    gap: 10,
    marginTop: 22,
    alignSelf: 'stretch',
  },

  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  buttonFlex: {
    flex: 1,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
  },

  buttonDanger: {
    backgroundColor: '#B3121F',
  },

  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },

  pressed: {
    opacity: 0.8,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  buttonTextFilled: {
    color: colors.surface,
  },

  buttonTextOutline: {
    color: colors.primary,
  },
});