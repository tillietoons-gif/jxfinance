'use client';

import { Card, Text, Title2, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { ReactNode, ComponentType } from 'react';

const useStyles = makeStyles({
  card: { padding: tokens.spacingHorizontalL, minHeight: '132px', borderTop: `${tokens.strokeWidthThick} solid ${tokens.colorBrandBackground}`, transitionDuration: tokens.durationFast },
  primary: { backgroundColor: tokens.colorNeutralBackgroundInverted, color: tokens.colorNeutralForegroundInverted, borderTopColor: tokens.colorBrandBackground },
  row: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: tokens.spacingHorizontalM },
  label: { display: 'block', color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: tokens.spacingVerticalS },
  primaryLabel: { color: tokens.colorBrandForeground2 },
  hint: { display: 'block', color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalS },
  primaryHint: { color: tokens.colorNeutralForegroundInverted },
  icon: { display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground1 },
});

export function KpiCard({ label, value, hint, icon: Icon, trend, variant = 'default' }: { label: string; value: string | number; hint?: string; icon?: ComponentType<{ className?: string }>; trend?: { value: string; positive?: boolean }; variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'; className?: string }) {
  const styles = useStyles();
  const primary = variant === 'primary';
  return <Card className={mergeClasses(styles.card, primary && styles.primary)}><div className={styles.row}><div><Text size={200} weight="semibold" className={mergeClasses(styles.label, primary && styles.primaryLabel)}>{label}</Text><Title2>{value}</Title2>{hint && <Text size={200} className={mergeClasses(styles.hint, primary && styles.primaryHint)}>{hint}</Text>}{trend && <Text size={200} weight="semibold" style={{ color: trend.positive ? tokens.colorBrandForeground1 : tokens.colorPaletteRedForeground1 }}>{trend.value}</Text>}</div>{Icon && <div className={styles.icon}><Icon /></div>}</div></Card>;
}
