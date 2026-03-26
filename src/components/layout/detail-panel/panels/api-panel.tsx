import type { ApiEndpoint } from '@/types/api-contract';
import { getLinksForEndpoint } from '@/data';
import { getMethodColors } from '@/constants/colors';
import { Badge, SectionLabel, InfoBlock, CrossLink } from '@/components/ui';
import styles from './panel-content.module.scss';

interface ApiPanelProps {
  endpoint: ApiEndpoint;
  group: string;
}

export function ApiPanel({ endpoint, group }: ApiPanelProps) {
  const crossLinks = getLinksForEndpoint(endpoint.method, endpoint.path);
  const { color } = getMethodColors(endpoint.method);

  return (
    <div>
      <div className={styles.badgeRow}>
        <Badge color={color} variant="method">{endpoint.method}</Badge>
        <span className={styles.context}>{group}</span>
      </div>

      <div className={styles.codeBlockAccent}>{endpoint.path}</div>

      <p className={styles.description}>{endpoint.description}</p>

      {endpoint.why && (
        <>
          <SectionLabel spaced={false}>Why this exists</SectionLabel>
          <InfoBlock>{endpoint.why}</InfoBlock>
        </>
      )}

      {crossLinks.length > 0 && (
        <>
          <SectionLabel>Used in Journeys</SectionLabel>
          <div className={styles.linkList}>
            {crossLinks.map((link, i) => (
              <CrossLink key={i} href={link.href}>{link.label}</CrossLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
