import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../index';

export const resourcesStyles = StyleSheet.create({
  categoryTabs: {
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
  },
  activeCategoryTab: {
    backgroundColor: Colors.primaryLight,
  },
  categoryTabText: {
    marginLeft: Spacing.xs,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  activeCategoryTabText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: Spacing.sm,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  lawCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  lawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  lawTitleContainer: {
    flex: 1,
  },
  lawCite: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  lawTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: 2,
  },
  lawPenalty: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 2,
  },
  lawSummary: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  expandedContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fullTextLabel: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fullText: {
    ...Typography.caption,
    color: '#555',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  sourceButtonText: {
    marginLeft: Spacing.xs,
    ...Typography.caption,
    color: Colors.primary,
  },
  resourcesCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    ...Shadows.small,
  },
  resourcesTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  resourceTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  resourceItemTitle: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text,
  },
  resourceItemDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderTitle: {
    ...Typography.h3,
    color: Colors.textLight,
    marginTop: Spacing.lg,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: 40,
  },
});