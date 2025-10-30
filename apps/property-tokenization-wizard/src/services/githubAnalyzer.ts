/**
 * GitHub Repository Analyzer - Deep Analysis
 * 
 * Performs comprehensive repository analysis similar to Cursor:
 * - Repository structure and file analysis
 * - Deep tech stack detection (dependencies, frameworks)
 * - Code complexity and scope estimation
 * - Development patterns and architecture
 * - Team collaboration metrics
 * - Product readiness indicators
 */

export interface GitHubRepoData {
  // Basic Info
  owner: string;
  repoName: string;
  fullName: string;
  description: string;
  createdAt: Date;
  lastUpdated: Date;
  homepage?: string;
  
  // Activity Metrics
  totalCommits: number;
  recentCommitFrequency: number; // commits per month (last 6 months)
  contributors: number;
  activeContributors: number; // active in last 3 months
  
  // Code Metrics
  linesOfCode: number;
  fileCount: number;
  primaryLanguage: string;
  languages: { language: string; percentage: number }[];
  openIssues: number;
  closedIssues: number;
  pullRequests: number;
  
  // Deep Tech Stack Analysis
  frameworks: string[];
  dependencies: { name: string; type: 'production' | 'dev' }[];
  hasBackend: boolean;
  hasFrontend: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
  deploymentPlatform?: string;
  
  // Repository Structure
  hasReadme: boolean;
  hasLicense: boolean;
  hasChangelog: boolean;
  hasContributing: boolean;
  hasSecurity: boolean;
  folderStructure: string[]; // Top-level folders
  
  // Product Indicators
  productType: 'library' | 'app' | 'service' | 'tool' | 'framework' | 'unknown';
  isMonorepo: boolean;
  hasDocker: boolean;
  hasKubernetes: boolean;
  
  // Community Metrics
  stars: number;
  forks: number;
  watchers: number;
  
  // Quality Indicators
  hasTests: boolean;
  hasCI: boolean;
  hasDocumentation: boolean;
  license: string;
  codeOfConduct: boolean;
  
  // Complexity Estimation
  estimatedProjectValue: number; // Rough estimation based on LOC, contributors, etc.
  developmentHours: number; // Estimated dev hours
  
  // Derived Insights
  developmentVelocity: 'high' | 'medium' | 'low';
  codeMaturity: 'mature' | 'developing' | 'early';
  teamSize: 'small' | 'medium' | 'large';
  communityEngagement: 'high' | 'medium' | 'low';
  commercialReadiness: 'production' | 'beta' | 'alpha' | 'prototype';
}

/**
 * Detect frameworks from dependencies
 */
function detectFrameworks(dependencies: Record<string, string>, devDependencies: Record<string, string>): string[] {
  const allDeps = { ...dependencies, ...devDependencies };
  const frameworks: string[] = [];
  
  // Frontend frameworks
  if (allDeps['next']) frameworks.push('Next.js');
  else if (allDeps['react']) frameworks.push('React');
  if (allDeps['vue']) frameworks.push('Vue');
  if (allDeps['angular']) frameworks.push('Angular');
  if (allDeps['svelte']) frameworks.push('Svelte');
  
  // Backend frameworks
  if (allDeps['express']) frameworks.push('Express');
  if (allDeps['fastify']) frameworks.push('Fastify');
  if (allDeps['@nestjs/core']) frameworks.push('NestJS');
  if (allDeps['koa']) frameworks.push('Koa');
  
  // Full-stack
  if (allDeps['remix']) frameworks.push('Remix');
  if (allDeps['@redwoodjs/core']) frameworks.push('RedwoodJS');
  
  // Database
  if (allDeps['prisma']) frameworks.push('Prisma');
  if (allDeps['mongoose']) frameworks.push('Mongoose');
  if (allDeps['typeorm']) frameworks.push('TypeORM');
  
  // UI Libraries
  if (allDeps['tailwindcss']) frameworks.push('Tailwind CSS');
  if (allDeps['@mui/material']) frameworks.push('Material-UI');
  
  return frameworks;
}

/**
 * Determine product type from repo characteristics
 */
function determineProductType(
  folderStructure: string[],
  fileNames: string[],
  dependencies: { name: string; type: string }[],
  description: string
): 'library' | 'app' | 'service' | 'tool' | 'framework' | 'unknown' {
  
  const desc = description.toLowerCase();
  const depNames = dependencies.map(d => d.name);
  
  // Framework/Library indicators
  if (desc.includes('framework') || desc.includes('library')) return 'framework';
  if (fileNames.includes('index.d.ts') && !folderStructure.includes('app')) return 'library';
  
  // Application indicators
  if (folderStructure.includes('pages') || folderStructure.includes('app')) return 'app';
  if (depNames.includes('next') || depNames.includes('remix')) return 'app';
  
  // Service/API indicators
  if (folderStructure.includes('api') && !folderStructure.includes('client')) return 'service';
  if (desc.includes('api') || desc.includes('service')) return 'service';
  
  // Developer tool indicators
  if (desc.includes('cli') || desc.includes('tool') || desc.includes('plugin')) return 'tool';
  
  return 'unknown';
}

/**
 * Estimate commercial readiness
 */
function determineCommercialReadiness(
  hasTests: boolean,
  hasCI: boolean,
  hasDocumentation: boolean,
  hasDocker: boolean,
  stars: number,
  ageInMonths: number
): 'production' | 'beta' | 'alpha' | 'prototype' {
  
  let readinessScore = 0;
  
  if (hasTests) readinessScore += 25;
  if (hasCI) readinessScore += 20;
  if (hasDocumentation) readinessScore += 15;
  if (hasDocker) readinessScore += 10;
  if (stars > 100) readinessScore += 15;
  if (ageInMonths > 12) readinessScore += 15;
  
  if (readinessScore >= 70) return 'production';
  if (readinessScore >= 50) return 'beta';
  if (readinessScore >= 30) return 'alpha';
  return 'prototype';
}

/**
 * Estimate project value based on complexity
 * This gives a rough "cost to rebuild" valuation
 */
function estimateProjectValue(
  loc: number,
  contributors: number,
  commits: number,
  hasTests: boolean,
  hasCI: boolean,
  frameworks: string[],
  productType: string
): { value: number; hours: number } {
  
  // Base: $100/hour developer rate, 100 LOC/day productivity
  const hoursPerLOC = 0.05; // ~200 LOC per day
  const baseHours = loc * hoursPerLOC;
  
  // Complexity multipliers
  let complexityMultiplier = 1.0;
  
  // Product type complexity
  if (productType === 'framework') complexityMultiplier *= 1.5;
  else if (productType === 'service') complexityMultiplier *= 1.3;
  else if (productType === 'app') complexityMultiplier *= 1.2;
  
  // Team size (more people = more coordination overhead)
  if (contributors > 20) complexityMultiplier *= 1.3;
  else if (contributors > 10) complexityMultiplier *= 1.15;
  
  // Quality adds cost
  if (hasTests) complexityMultiplier *= 1.2;
  if (hasCI) complexityMultiplier *= 1.1;
  
  // Framework complexity
  if (frameworks.length > 3) complexityMultiplier *= 1.15;
  
  const totalHours = Math.round(baseHours * complexityMultiplier);
  const estimatedValue = totalHours * 100; // $100/hour
  
  return {
    hours: totalHours,
    value: estimatedValue,
  };
}

/**
 * Extract GitHub org/repo from various URL formats
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', ''),
      };
    }
  }
  
  return null;
}

/**
 * Fetch file contents from repository
 */
async function fetchFileContent(owner: string, repo: string, path: string, headers: HeadersInit): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.content) {
      // Content is base64 encoded
      return atob(data.content);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Analyze a GitHub repository - DEEP ANALYSIS
 */
export async function analyzeGitHubRepo(githubUrl: string): Promise<GitHubRepoData> {
  const parsed = parseGitHubUrl(githubUrl);
  
  if (!parsed) {
    throw new Error('Invalid GitHub URL. Format: github.com/owner/repo or owner/repo');
  }
  
  const { owner, repo } = parsed;
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  try {
    console.log(`🔍 Deep analyzing repository: ${owner}/${repo}`);
    
    // Fetch repository data
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        throw new Error('Repository not found. Please check the URL or make sure the repo is public.');
      }
      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }
    
    const repoData = await repoResponse.json();
    
    // Fetch core data in parallel
    const [contributorsData, languagesData, commitsData, contentsData, pullsData] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }).then(r => r.ok ? r.json() : {}),
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`, { headers }).then(r => r.ok ? r.json() : []),
    ]);
    
    const contributors = contributorsData.status === 'fulfilled' ? contributorsData.value : [];
    const languages = languagesData.status === 'fulfilled' ? languagesData.value : {};
    const commits = commitsData.status === 'fulfilled' ? commitsData.value : [];
    const contents = contentsData.status === 'fulfilled' ? contentsData.value : [];
    const pulls = pullsData.status === 'fulfilled' ? pullsData.value : [];
    
    console.log(`📦 Fetched: ${contributors.length} contributors, ${commits.length} commits, ${contents.length} files`);
    
    // Deep analysis: Read key files
    const [packageJson, readme, dockerfile, dockerCompose] = await Promise.all([
      fetchFileContent(owner, repo, 'package.json', headers),
      fetchFileContent(owner, repo, 'README.md', headers),
      fetchFileContent(owner, repo, 'Dockerfile', headers),
      fetchFileContent(owner, repo, 'docker-compose.yml', headers),
    ]);
    
    console.log(`📄 Key files found: package.json=${!!packageJson}, README=${!!readme}, Dockerfile=${!!dockerfile}`);
    
    // Calculate metrics
    const totalContributors = contributors.length;
    
    // Recent activity (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentCommits = commits.filter((commit: any) => {
      const commitDate = new Date(commit.commit.author.date);
      return commitDate > threeMonthsAgo;
    });
    
    const activeContributors = new Set(
      recentCommits.map((commit: any) => commit.author?.login).filter(Boolean)
    ).size;
    
    // Commit frequency (commits per month in last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentSixMonthCommits = commits.filter((commit: any) => {
      const commitDate = new Date(commit.commit.author.date);
      return commitDate > sixMonthsAgo;
    });
    
    const commitsPerMonth = recentSixMonthCommits.length / 6;
    
    // Language breakdown
    const totalBytes = Object.values(languages).reduce((sum: number, bytes: any) => sum + bytes, 0);
    const languageBreakdown = Object.entries(languages).map(([language, bytes]: [string, any]) => ({
      language,
      percentage: (bytes / totalBytes) * 100,
    })).sort((a, b) => b.percentage - a.percentage);
    
    // Estimate lines of code (rough estimate based on bytes and language)
    const estimatedLOC = Math.round(totalBytes / 50); // ~50 bytes per line average
    
    // Analyze repository structure
    const folderStructure = contents
      .filter((item: any) => item.type === 'dir')
      .map((item: any) => item.name);
    
    const fileNames = contents
      .filter((item: any) => item.type === 'file')
      .map((item: any) => item.name);
    
    console.log(`📁 Folders: ${folderStructure.join(', ')}`);
    
    // Parse package.json for dependencies
    let dependencies: { name: string; type: 'production' | 'dev' }[] = [];
    let frameworks: string[] = [];
    
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        
        // Extract dependencies
        const prodDeps = Object.keys(pkg.dependencies || {}).map(name => ({ name, type: 'production' as const }));
        const devDeps = Object.keys(pkg.devDependencies || {}).map(name => ({ name, type: 'dev' as const }));
        dependencies = [...prodDeps, ...devDeps];
        
        // Detect frameworks
        frameworks = detectFrameworks(pkg.dependencies || {}, pkg.devDependencies || {});
        
        console.log(`📦 Dependencies: ${dependencies.length} total, Frameworks: ${frameworks.join(', ')}`);
      } catch (error) {
        console.warn('Failed to parse package.json:', error);
      }
    }
    
    // Detect repository characteristics
    const hasBackend = folderStructure.some(f => 
      ['api', 'server', 'backend', 'src/api', 'apps/api'].some(b => f.includes(b))
    ) || dependencies.some(d => ['express', 'fastify', 'nest', 'koa'].includes(d.name));
    
    const hasFrontend = folderStructure.some(f => 
      ['client', 'frontend', 'web', 'app', 'public'].includes(f)
    ) || dependencies.some(d => ['react', 'vue', 'angular', 'svelte', 'next'].includes(d.name));
    
    const hasDatabase = dependencies.some(d => 
      ['prisma', 'mongoose', 'sequelize', 'typeorm', 'pg', 'mysql'].includes(d.name)
    );
    
    const hasAPI = fileNames.some(f => f.includes('openapi') || f.includes('swagger')) ||
                  folderStructure.includes('api') ||
                  readme?.toLowerCase().includes('api');
    
    const isMonorepo = folderStructure.includes('packages') || 
                      folderStructure.includes('apps') ||
                      fileNames.includes('pnpm-workspace.yaml') ||
                      fileNames.includes('lerna.json');
    
    const hasDocker = !!dockerfile || !!dockerCompose;
    const hasKubernetes = folderStructure.some(f => f.includes('k8s') || f.includes('kubernetes'));
    
    // Deployment platform detection
    let deploymentPlatform: string | undefined;
    if (fileNames.includes('vercel.json')) deploymentPlatform = 'Vercel';
    else if (fileNames.includes('netlify.toml')) deploymentPlatform = 'Netlify';
    else if (hasKubernetes) deploymentPlatform = 'Kubernetes';
    else if (hasDocker) deploymentPlatform = 'Docker';
    
    // Check for quality indicators
    const hasTests = folderStructure.some(f => f.includes('test') || f.includes('__tests__')) ||
                    fileNames.some(f => f.includes('.test.') || f.includes('.spec.')) ||
                    dependencies.some(d => ['jest', 'mocha', 'vitest', 'cypress'].includes(d.name));
    
    const hasCI = fileNames.includes('.github') || 
                 fileNames.includes('.gitlab-ci.yml') ||
                 fileNames.includes('.circleci');
    
    const hasReadme = !!readme;
    const hasLicense = !!repoData.license;
    const hasChangelog = fileNames.some(f => f.toLowerCase().includes('changelog'));
    const hasContributing = fileNames.some(f => f.toLowerCase().includes('contributing'));
    const hasSecurity = fileNames.some(f => f.toLowerCase().includes('security'));
    const codeOfConduct = fileNames.some(f => f.toLowerCase().includes('code_of_conduct'));
    
    const hasDocumentation = hasReadme || 
      repoData.has_wiki ||
      folderStructure.includes('docs') ||
      folderStructure.includes('documentation');
    
    // Determine product type
    const productType = determineProductType(folderStructure, fileNames, dependencies, repoData.description || '');
    
    console.log(`🎯 Product type: ${productType}`);
    
    // Estimate project complexity and value
    const { value: estimatedProjectValue, hours: developmentHours } = estimateProjectValue(
      estimatedLOC,
      totalContributors,
      commits.length,
      hasTests,
      hasCI,
      frameworks,
      productType
    );
    
    console.log(`💰 Estimated rebuild cost: $${(estimatedProjectValue / 1000000).toFixed(1)}M (${developmentHours.toLocaleString()} hours)`);
    
    // Derive insights
    const developmentVelocity = commitsPerMonth > 50 ? 'high' : 
                                commitsPerMonth > 10 ? 'medium' : 'low';
    
    const ageInMonths = (Date.now() - new Date(repoData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
    const codeMaturity = ageInMonths > 24 && repoData.stargazers_count > 100 ? 'mature' :
                        ageInMonths > 12 ? 'developing' : 'early';
    
    const teamSize = totalContributors > 10 ? 'large' :
                    totalContributors > 3 ? 'medium' : 'small';
    
    const communityEngagement = repoData.stargazers_count > 1000 ? 'high' :
                               repoData.stargazers_count > 100 ? 'medium' : 'low';
    
    const commercialReadiness = determineCommercialReadiness(
      hasTests,
      hasCI,
      hasDocumentation,
      hasDocker,
      repoData.stargazers_count,
      ageInMonths
    );
    
    console.log(`✅ Analysis complete: ${codeMaturity} maturity, ${commercialReadiness} readiness`);
    
    return {
      owner,
      repoName: repo,
      fullName: repoData.full_name,
      description: repoData.description || '',
      createdAt: new Date(repoData.created_at),
      lastUpdated: new Date(repoData.updated_at),
      homepage: repoData.homepage,
      
      totalCommits: commits.length,
      recentCommitFrequency: Math.round(commitsPerMonth),
      contributors: totalContributors,
      activeContributors,
      
      linesOfCode: estimatedLOC,
      fileCount: contents.length,
      primaryLanguage: repoData.language || 'Unknown',
      languages: languageBreakdown,
      openIssues: repoData.open_issues_count,
      closedIssues: 0,
      pullRequests: pulls.length,
      
      frameworks,
      dependencies,
      hasBackend,
      hasFrontend,
      hasDatabase,
      hasAPI,
      deploymentPlatform,
      
      hasReadme,
      hasLicense,
      hasChangelog,
      hasContributing,
      hasSecurity,
      codeOfConduct,
      folderStructure,
      
      productType,
      isMonorepo,
      hasDocker,
      hasKubernetes,
      
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      
      hasTests,
      hasCI,
      hasDocumentation,
      license: repoData.license?.name || 'None',
      
      estimatedProjectValue,
      developmentHours,
      
      developmentVelocity,
      codeMaturity,
      teamSize,
      communityEngagement,
      commercialReadiness,
    };
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze GitHub repository');
  }
}

/**
 * Convert GitHub data to business metrics
 */
export function githubToBusinessMetrics(githubData: GitHubRepoData): {
  employeeCount?: number;
  industry?: string;
  foundedYear?: number;
  description?: string;
} {
  return {
    // Estimate team size from active contributors
    employeeCount: githubData.activeContributors > 0 ? githubData.activeContributors : githubData.contributors,
    
    // Detect industry from languages
    industry: determineIndustry(githubData.primaryLanguage, githubData.description),
    
    // Use repo creation year as founded year (for startups)
    foundedYear: githubData.createdAt.getFullYear(),
    
    // Use repo description
    description: githubData.description,
  };
}

/**
 * Determine industry from tech stack
 */
function determineIndustry(primaryLanguage: string, description: string): string {
  const desc = description.toLowerCase();
  
  // Check description first
  if (desc.includes('saas') || desc.includes('software as a service')) return 'SaaS';
  if (desc.includes('fintech') || desc.includes('financial')) return 'FinTech';
  if (desc.includes('ai') || desc.includes('machine learning') || desc.includes('ml')) return 'AI/ML';
  if (desc.includes('blockchain') || desc.includes('crypto')) return 'Blockchain';
  if (desc.includes('devtools') || desc.includes('developer')) return 'DevTools';
  
  // Check language
  const lang = primaryLanguage.toLowerCase();
  if (lang === 'javascript' || lang === 'typescript' || lang === 'react') return 'Software/Web';
  if (lang === 'python') return 'Software/Data';
  if (lang === 'rust' || lang === 'go') return 'Software/Infrastructure';
  
  return 'Software';
}

