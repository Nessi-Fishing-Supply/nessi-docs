export const GITHUB_BASE_URL = 'https://github.com/Nessi-Fishing-Supply/nessi-web-app/blob/main/';

export function githubUrl(filePath: string): string {
  return `${GITHUB_BASE_URL}${filePath}`;
}
