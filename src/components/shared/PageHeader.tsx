'use client';

import { Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode, ComponentType } from 'react';

const useStyles = makeStyles({
  root: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalL, marginBottom: tokens.spacingVerticalXXL, flexWrap: 'wrap' },
  heading: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM },
  icon: { display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorBrandBackground, color: tokens.colorBrandForegroundInverted },
  eyebrow: { display: 'block', color: tokens.colorBrandForeground1, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: tokens.spacingVerticalXS },
  subtitle: { display: 'block', color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXS },
});

export function PageHeader({ title, subtitle, icon: Icon, actions }: { title: string; subtitle?: string; icon?: ComponentType<{ className?: string }>; actions?: ReactNode; className?: string }) {
  const styles = useStyles();
  return <div className={styles.root}><div className={styles.heading}>{Icon && <div className={styles.icon}><Icon /></div>}<div><Text className={styles.eyebrow} size={200} weight="semibold">JACXI workspace</Text><Title2>{title}</Title2>{subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}</div></div>{actions && <div>{actions}</div>}</div>;
}
