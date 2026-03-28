import { VscGithub } from 'react-icons/vsc';
import { githubUrl } from '@/constants/github';
import styles from './github-link.module.scss';

interface GitHubLinkProps {
  filePath: string;
}

export function GitHubLink({ filePath }: GitHubLinkProps) {
  const fileName = filePath.split('/').pop() ?? filePath;

  return (
    <a
      href={githubUrl(filePath)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      title={filePath}
    >
      <VscGithub className={styles.icon} />
      <span className={styles.fileName}>{fileName}</span>
    </a>
  );
}
