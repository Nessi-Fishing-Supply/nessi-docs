import { VscGithub } from 'react-icons/vsc';
import { githubUrl } from '@/features/shared/constants/github';
import styles from './github-link.module.scss';

interface GitHubLinkProps {
  filePath: string;
}

export function GitHubLink({ filePath }: GitHubLinkProps) {
  // Strip common prefixes for a cleaner display while keeping the path code-accurate
  const displayPath = filePath
    .replace(/^src\/app\//, '')
    .replace(/^src\//, '')
    .replace(/^supabase\/migrations\/\d+_/, '');

  return (
    <a
      href={githubUrl(filePath)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      title={filePath}
    >
      <VscGithub className={styles.icon} />
      <span className={styles.fileName}>{displayPath}</span>
    </a>
  );
}
