import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenContent: {
    flexGrow: 1,
    padding: 24,
  },

  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },

  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 23,
  },

  bodyText: {
    fontSize: 16,
    color: colors.text,
  },

  secondaryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  primaryButton: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  secondaryButton: {
    minHeight: 52,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  textButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },

  textButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  input: {
    minHeight: 52,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },

  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  errorText: {
    fontSize: 14,
    color: colors.danger,
  },

  successText: {
    fontSize: 14,
    color: colors.success,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fullWidth: {
    width: '100%',
  },
});