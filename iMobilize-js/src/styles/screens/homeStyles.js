import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../index';

export const homeStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  dashboardContainer: {
    backgroundColor: Colors.cardBackground,
    padding: Spacing.lg,
    margin: Spacing.sm,
    borderRadius: 10,
    ...Shadows.small,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dashboardTitle: {
    ...Typography.caption,
    fontWeight: 'bold',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  statNumber: {
    marginTop: Spacing.xs,
    ...Typography.body,
    color: Colors.text,
  },
  feedContainer: {
    padding: Spacing.lg,
  },
  feedTitle: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  feedSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  eventCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  eventTitle: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  eventMovement: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventDetailText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  eventFeatureText: {
    ...Typography.body,
    marginLeft: Spacing.xs,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  moreInfoButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 5,
  },
  moreInfoText: {
    color: Colors.primary,
    ...Typography.body,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: 5,
  },
  joinText: {
    color: Colors.cardBackground,
    ...Typography.body,
    fontWeight: 'bold',
  },
  safetyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: Spacing.sm,
    borderRadius: 5,
    marginTop: Spacing.sm,
    marginBottom: 80,
  },
  safetyAlertText: {
    color: Colors.success,
    ...Typography.body,
    marginLeft: Spacing.xs,
  },
});